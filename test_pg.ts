import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data, error } = await supabase.from('pg_proc').select('*').limit(1);
    console.log(error);
}
run();
