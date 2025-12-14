// sync-outgoings/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Add type declaration for Deno global to resolve TypeScript errors.
declare const Deno: any;

console.log('Initializing sync-outgoings function...');

// --- Environment Variables ---
const montfordUrl = Deno.env.get('MONTFORD_URL')
const montfordKey = Deno.env.get('MONTFORD_SERVICE_ROLE_KEY')
const STOUTLY_ENTITY_ID = 'b442546e-d162-497b-b3a5-2ecbe9144e04'

if (!montfordUrl || !montfordKey) {
  console.error("Missing required environment variables: MONTFORD_URL or MONTFORD_SERVICE_ROLE_KEY");
  throw new Error("Function is not configured correctly. Missing Montford DB credentials.");
}

const montfordClient = createClient(montfordUrl, montfordKey)

serve(async (req) => {
  console.log('Edge function invoked.');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const payload = await req.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2));

    const eventType = payload.type;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const record = payload.record;
      if (!record || !record.id) {
        console.error("Payload is missing 'record' or 'record.id' for INSERT/UPDATE.");
        return new Response(JSON.stringify({ error: "Payload missing 'record' or 'record.id'." }), { status: 400 });
      }

      // Map `billing_cycle` to align with MontfordDigital's expected values.
      let mappedBillingCycle: string | null = null;
      if (record.type === 'subscription' && record.billing_cycle) {
          if (record.billing_cycle.toLowerCase() === 'yearly') {
              mappedBillingCycle = 'annually';
          } else {
              mappedBillingCycle = record.billing_cycle.toLowerCase();
          }
      }

      // Map Stoutly fields, now including the stoutly_outgoing_id for reliable sync
      const expenseData = {
        stoutly_outgoing_id: record.id, // The new, stable identifier
        name: record.name,
        description: record.description || null,
        amount: record.amount,
        type: record.type,
        start_date: record.start_date,
        end_date: record.end_date || null, // This will now update correctly
        category: record.category || null,
        currency: record.currency,
        billing_cycle: mappedBillingCycle,
        entity_id: STOUTLY_ENTITY_ID,
      };
      
      console.log('Attempting to upsert using stoutly_outgoing_id:', JSON.stringify(expenseData, null, 2));

      // Upsert using the NEW, reliable onConflict key. This fixes the update issue.
      const { data, error } = await montfordClient
        .from('expenses')
        .upsert(expenseData, { onConflict: 'stoutly_outgoing_id' });
      
      if (error) {
        console.error('Supabase upsert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to upsert data into Montford.', details: error }), { status: 500 });
      }

      console.log('Successfully upserted data to Montford.', data);

    } else if (eventType === 'DELETE') {
      const old_record = payload.old_record;
       if (!old_record || !old_record.id) {
        console.error("Payload is missing 'old_record' or 'old_record.id' for DELETE.");
        return new Response(JSON.stringify({ error: "Payload missing 'old_record' or 'old_record.id'." }), { status: 400 });
      }

      const { id } = old_record;
      
      console.log(`Attempting to delete record from Montford with stoutly_outgoing_id: ${id}`);

      // Delete using the NEW, reliable ID. This fixes the deletion issue.
      const { error } = await montfordClient
        .from('expenses')
        .delete()
        .eq('stoutly_outgoing_id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete data from Montford.', details: error }), { status: 500 });
      }
      
      console.log('Successfully deleted record from Montford.');

    } else {
      console.log(`Ignoring event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true, processed: true }), { status: 200 });
  } catch (e) {
    console.error('Unhandled error in edge function:', e);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.', details: e.message }), { status: 500 });
  }
})