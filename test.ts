import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
    const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/outgoings?limit=1`, {
        headers: {
            'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY!}`
        }
    });
    const data = await res.json();
    console.log(data);
}
test();
