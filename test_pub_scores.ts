import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data: pubScores } = await supabase.from('pub_scores').select('*').limit(3);
    console.log("pubScores sample:", pubScores);
}
run();
