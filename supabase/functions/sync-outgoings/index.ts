// sync-outgoings/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Add type declaration for Deno global to resolve TypeScript errors.
declare const Deno: any;

console.log('Initializing sync-outgoings function...');

// --- Environment Variables ---
// Ensure these are set in the Edge Function's settings in the Supabase Dashboard
const montfordUrl = Deno.env.get('MONTFORD_URL')
const montfordKey = Deno.env.get('MONTFORD_SERVICE_ROLE_KEY')

// You need to find the UUID for Stoutly in your Montford DB and hardcode it here
const STOUTLY_ENTITY_ID = 'b442546e-d162-497b-b3a5-2ecbe9144e04'

if (!montfordUrl || !montfordKey) {
  console.error("Missing required environment variables: MONTFORD_URL or MONTFORD_SERVICE_ROLE_KEY");
  // Throw an error to ensure the function fails loudly if not configured
  throw new Error("Function is not configured correctly. Missing Montford DB credentials.");
}

const montfordClient = createClient(montfordUrl, montfordKey)

serve(async (req) => {
  console.log('Edge function invoked.');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const payload = await req.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    // We only care about INSERT (new expenses) or UPDATE
    // payload.record contains the new data from Stoutly
    const record = payload.record;
    const eventType = payload.type;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!record) {
        console.error("Payload is missing 'record' property.");
        return new Response(JSON.stringify({ error: "Payload missing 'record' property." }), { status: 400 });
      }

      // Map Stoutly fields to Montford fields
      const expenseData = {
        description: `${record.name} - ${record.description || ''}`,
        amount: record.amount,
        category: record.category,
        expense_date: record.start_date, // Mapping start_date to expense_date
        expense_type: record.type === 'subscription' ? 'subscription' : 'one-time',
        billing_cycle: record.billing_cycle === 'monthly' ? 'monthly' : 'annually', // Ensure enums match
        is_active: record.end_date === null, // If no end date, it's active
        entity_id: STOUTLY_ENTITY_ID
      }
      
      console.log('Attempting to upsert the following data into Montford:', JSON.stringify(expenseData, null, 2));

      // Insert into Montford
      const { data, error } = await montfordClient
        .from('expenses')
        .upsert(expenseData, { onConflict: 'description, expense_date, amount' }) // simple dedup strategy
      
      if (error) {
        console.error('Supabase upsert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to upsert data into Montford.', details: error }), { status: 500 });
      }

      console.log('Successfully upserted data to Montford.', data);

    } else {
      console.log(`Ignoring event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
  } catch (e) {
    console.error('Unhandled error in edge function:', e);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.', details: e.message }), { status: 500 });
  }
})