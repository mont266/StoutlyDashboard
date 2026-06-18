import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    let { data: profile } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles:", profile ? Object.keys(profile[0] || {}) : 'No data');
}

run();
