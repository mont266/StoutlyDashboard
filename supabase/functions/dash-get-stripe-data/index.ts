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

    // --- 3. GET USER IDS & FETCH PROFILES FROM SUPABASE ---
    const userIds = [
      ...new Set(successfulCharges.map(c => c.metadata.user_id).filter(Boolean))
    ];
    console.log(`[DEBUG] Found ${userIds.length} unique user IDs from Stripe metadata.`);
    
    const userProfilesMap = new Map();
    if (userIds.length > 0) {
        console.log('[DEBUG] Fetching profiles from Supabase for IDs:', userIds);
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_id')
            .in('id', userIds);

        if (error) {
            console.error('[DEBUG] Supabase profile fetch error:', error);
            throw new Error(`Supabase profile fetch error: ${error.message}`);
        }
        
        console.log(`[DEBUG] Received ${profiles?.length ?? 0} profiles from Supabase.`);

        if (profiles) {
            for (const profile of profiles) {
                userProfilesMap.set(profile.id, {
                    name: profile.username,
                    avatarId: profile.avatar_id
                });
            }
        }
        console.log(`[DEBUG] Mapped ${userProfilesMap.size} user profiles from Supabase.`);
    } else {
      console.log('[DEBUG] No user IDs found in Stripe charge metadata. All donors will appear as "Anonymous". Check if the main app is saving user_id to Stripe metadata.');
    }

    // --- 4. PROCESS CHARGES WITH ENRICHED USER DATA ---
    let grossDonations = 0;
    let stripeFees = 0;
    const donationsByUser: { [key: string]: { name: string; avatarId: string; totalAmount: number } } = {};
    const recentDonations: any[] = [];

    for (const charge of successfulCharges) {
      const amount = charge.amount / 100;
      const fee = (charge.balance_transaction as Stripe.BalanceTransaction)?.fee / 100 || 0;
      
      grossDonations += amount;
      stripeFees += fee;

      const userId = charge.metadata.user_id || 'anonymous';
      const userProfile = userProfilesMap.get(userId);
      
      const userName = userProfile ? userProfile.name : 'Anonymous';
      const avatarId = userProfile ? userProfile.avatarId : '';

      if (!donationsByUser[userId]) {
        donationsByUser[userId] = { name: userName, avatarId, totalAmount: 0 };
      }
      donationsByUser[userId].totalAmount += amount;

      if (recentDonations.length < 10) {
        recentDonations.push({
          id: charge.id,
          user: { name: userName, avatarId },
          amount: amount,
          date: new Date(charge.created * 1000).toLocaleDateString('en-GB'),
        });
      }
    }

    // --- 5. FIND TOP DONATOR ---
    let topDonator = { name: 'N/A', avatarId: '', totalAmount: 0 };
    if (Object.keys(donationsByUser).length > 0) {
        topDonator = Object.values(donationsByUser).reduce((top, current) => 
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
