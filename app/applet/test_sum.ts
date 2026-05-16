import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function sumPints() {
    console.log("Fetching...");
    let { data: checkins } = await supabase.from('pub_checkins').select('amount_drank');
    let { data: ratings } = await supabase.from('ratings').select('amount_drank');
    
    let totalCheckinPints = 0;
    if (checkins) {
        totalCheckinPints = checkins.reduce((acc, c) => acc + (c.amount_drank !== null ? c.amount_drank : 1), 0);
    }
    let totalRatingsPints = 0;
    if (ratings) {
        totalRatingsPints = ratings.reduce((acc, r) => acc + (r.amount_drank !== null ? r.amount_drank : 1), 0);
    }
    
    console.log({ totalCheckinPints, totalRatingsPints });
}
sumPints();
