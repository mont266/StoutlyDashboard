import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function applySQL() {
    try {
        const sql = fs.readFileSync('./supabase/functions/dash_get_home_data.sql', 'utf8');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error(error);
        } else {
            console.log('Success applied');
        }
    } catch(e) {
        console.error(e);
    }
}
applySQL();
