import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    let { data, error } = await supabase.rpc('dash_add_outgoing', {
            name_in: "test negative",
            description_in: "test negative",
            amount_in: -10.0,
            type_in: 'manual',
            start_date_in: '2026-05-20',
            category_in: 'test',
            currency_in: 'GBP',
            billing_cycle_in: 'monthly'
    });
    console.log(data, error);
}
run();
