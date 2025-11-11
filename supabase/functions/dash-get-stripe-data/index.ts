// supabase/functions/dash-get-stripe-data/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helper to create CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fix: Add type declaration for Deno global to resolve TypeScript errors.
// This informs the type checker that the 'Deno' object exists and has properties
// like 'env', which is standard in the Deno runtime environment.
declare const Deno: any;

// Main function to serve requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 0. VALIDATE ENVIRONMENT VARIABLES ---
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Function is missing required environment variables. Please ensure STRIPE_SECRET_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set in your function's secrets.");
    }
    
    // Stripe initialization
    const stripe = new Stripe(STRIPE_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: '2022-11-15',
    });

    // Supabase client initialization with the SERVICE_ROLE_KEY to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // --- 1. GET TIMEFRAME & CALCULATE START DATE ---
    const { time_period } = await req.json();
    const now = new Date();
    let startDate = 0; // Stripe uses Unix timestamps

    if (time_period !== 'all') {
        let date = new Date();
        if (time_period === '24h') date.setDate(now.getDate() - 1);
        else if (time_period === '7d') date.setDate(now.getDate() - 7);
        else if (time_period === '30d') date.setDate(now.getDate() - 30);
        else if (time_period === '1y') date.setFullYear(now.getFullYear() - 1);
        startDate = Math.floor(date.getTime() / 1000);
    }
    
    // --- 2. FETCH ALL CHARGES FROM STRIPE ---
    const charges: Stripe.Charge[] = [];
    for await (const charge of stripe.charges.list({
      limit: 100,
      created: startDate > 0 ? { gte: startDate } : undefined,
      expand: ['data.balance_transaction'],
    })) {
      charges.push(charge);
    }
    const successfulCharges = charges.filter(c => c.paid && c.status === 'succeeded');

    // --- 3. GET USER IDS & EMAILS, THEN FETCH PROFILES FROM SUPABASE ---
    const userIds = [...new Set(successfulCharges.map(c => c.metadata.supabase_user_id).filter(Boolean))];
    const userEmails = [...new Set(successfulCharges.map(c => c.receipt_email?.toLowerCase()).filter(Boolean))];

    console.log(`[DEBUG] Found ${userIds.length} unique user IDs and ${userEmails.length} unique emails from Stripe.`);

    const profilesById = new Map();
    if (userIds.length > 0) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_id')
            .in('id', userIds);
        if (error) {
            console.error('[DEBUG] Supabase profile fetch by ID error:', error);
        } else if (data) {
            data.forEach(p => profilesById.set(p.id, p));
            console.log(`[DEBUG] Fetched ${profilesById.size} profiles by ID.`);
        }
    }

    const profilesByEmail = new Map();
    if (userEmails.length > 0) {
        // This assumes an 'email' column exists and is queryable in the 'profiles' table.
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, username, avatar_id')
            .in('email', userEmails);
        if (error) {
            console.error('[DEBUG] Supabase profile fetch by email error:', error);
        } else if (data) {
            data.forEach(p => profilesByEmail.set(p.email, p));
            console.log(`[DEBUG] Fetched ${profilesByEmail.size} profiles by email.`);
        }
    }
    
    // --- 4. PROCESS CHARGES WITH ENRICHED USER DATA ---
    let grossDonations = 0;
    let stripeFees = 0;
    const donationsByUser = new Map();
    const recentDonations: any[] = [];

    for (const charge of successfulCharges) {
        const amount = charge.amount / 100;
        const fee = (charge.balance_transaction as Stripe.BalanceTransaction)?.fee / 100 || 0;
      
        grossDonations += amount;
        stripeFees += fee;

        const userId = charge.metadata.supabase_user_id;
        const userEmail = charge.receipt_email?.toLowerCase();

        // Find profile: by ID first, then fallback to email.
        let profile = userId ? profilesById.get(userId) : null;
        if (!profile && userEmail) {
            profile = profilesByEmail.get(userEmail);
        }

        const username = profile ? profile.username : 'Anonymous';
        const avatar_id = profile ? profile.avatar_id : '';
      
        // Use a consistent key for aggregation: profile ID, then email, then a unique charge ID for anonymous.
        const aggregationKey = profile ? (profile.id || profile.email) : `anonymous-${charge.id}`;

        const currentUserDonation = donationsByUser.get(aggregationKey) || {
            username,
            avatar_id,
            totalAmount: 0,
        };
        currentUserDonation.totalAmount += amount;
        donationsByUser.set(aggregationKey, currentUserDonation);

        if (recentDonations.length < 10) {
            recentDonations.push({
                id: charge.id,
                user: { username, avatar_id },
                amount: amount,
                date: new Date(charge.created * 1000).toLocaleDateString('en-GB'),
            });
        }
    }

    // --- 5. FIND TOP DONATOR ---
    let topDonator = { username: 'N/A', avatar_id: '', totalAmount: 0 };
    if (donationsByUser.size > 0) {
        topDonator = [...donationsByUser.values()].reduce((top, current) => 
            current.totalAmount > top.totalAmount ? current : top
        );
    }

    // --- 6. ASSEMBLE RESPONSE DATA ---
    const responseData = {
      grossDonations,
      stripeFees,
      netDonations: grossDonations - stripeFees,
      totalDonations: successfulCharges.length,
      topDonator,
      recentDonations,
    };

    // --- 7. RETURN DATA ---
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Stripe function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});