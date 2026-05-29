import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data: pubs } = await supabase.from('pubs').select('*').limit(1);
    let { data: ratings } = await supabase.from('ratings').select('*').limit(1);
    console.log("Pubs:", Object.keys(pubs[0] || {}));
    console.log("Ratings:", Object.keys(ratings[0] || {}));
}
run();
