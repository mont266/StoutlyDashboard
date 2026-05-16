import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLimits() {
    let { data: ratings } = await supabase.from('ratings').select('id');
    console.log("Ratings fetched:", ratings?.length);
}
testLimits();
