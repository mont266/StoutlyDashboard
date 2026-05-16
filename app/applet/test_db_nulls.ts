import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data: ratingData, error: ratingErr } = await supabase.from('ratings').select('amount_drank').is('amount_drank', null);
    console.log("null in db:", ratingData?.length);
    let { data: zeroData, error: zeroErr } = await supabase.from('ratings').select('amount_drank').eq('amount_drank', 0);
    console.log("zero in db:", zeroData?.length);
}
run();
