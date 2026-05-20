import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data, error } = await supabase.from('outgoings').select('*').limit(5);
    console.log(JSON.stringify(data, null, 2));
}
run();
