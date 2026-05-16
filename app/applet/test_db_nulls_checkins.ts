import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data: nullData } = await supabase.from('pub_checkins').select('amount_drank').is('amount_drank', null);
    console.log("pub_checkins null:", nullData?.length);
    let { data: zeroData } = await supabase.from('pub_checkins').select('amount_drank').eq('amount_drank', 0);
    console.log("pub_checkins zero:", zeroData?.length);
}
run();
