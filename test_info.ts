import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    let { data: rpcList, error } = await supabase.rpc('dash_get_users_data');
    console.log(error);
}

run();
