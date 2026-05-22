import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { count } = await supabase.from('ratings').select('*', { count: 'exact', head: true });
    console.log('Total in select:', count);
    
    let { data } = await supabase.rpc('dash_get_home_data', { time_period: 'all' });
    console.log('Total in RPC:', data?.kpis?.totalRatings);
}
run();
