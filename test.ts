import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
    const { data, error } = await supabase.rpc('get_function_def', { function_name: 'dash_get_home_data' });
    console.log(data, error);
}
test();
