import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    console.time('fetch');
    let { data, error } = await supabase.from('pubs').select('id, name, lat, lng, area_identifier, country_code, ratings!inner(quality, exact_price)');
    console.timeEnd('fetch');
    console.log(error);
    console.log(data?.length, "pubs fetched");
    if(data) {
        console.log(data[0]);
    }
}
run();
