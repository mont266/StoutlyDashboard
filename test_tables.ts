import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    console.log('Querying for tables...');
    try {
        let { data, error } = await supabase.from('outgoings').select('*').limit(1);
        console.log('outgoings:', data, error);
        
        let { data: d2, error: e2 } = await supabase.from('subscriptions').select('*').limit(1);
        console.log('subscriptions:', d2, e2);

        let { data: d3, error: e3 } = await supabase.rpc('dash_get_outgoings_data', { time_period: 'all' });
        console.log('rpc:', d3 ? 'success' : e3);
    } catch (e) {
        console.error(e);
    }
}
run();
