import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
import { dash_getHomeData } from './services/supabaseService.ts';

async function run() {
    const data = await dash_getHomeData('all');
    console.log('Total Ratings KPI:', data.kpis.totalRatings);
    console.log('Total Checkins KPI:', data.kpis.totalCheckins);
    console.log('Total Pints checkins:', data.kpis.totalCheckinPints);
    console.log('Total Pints ratings:', data.kpis.totalRatingsPints);
    console.log('Total Pints Drank Sum:', data.kpis.totalPintsDrankSum);
}
run();
