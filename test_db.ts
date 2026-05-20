import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data: outgoings } = await supabase.from('dash_outgoings').select('*').limit(1);
    console.log('Outgoings:', outgoings);
    let { data: subs } = await supabase.from('dash_subscriptions').select('*').limit(1);
    console.log('Subscriptions:', subs);
}
run();
