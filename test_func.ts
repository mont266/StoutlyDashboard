import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data, error } = await supabase.rpc('get_function_definition', { func_name: 'dash_get_outgoings_data' });
    if (error) {
       console.log("fallback");
    }
    console.log(data);
}
run();
