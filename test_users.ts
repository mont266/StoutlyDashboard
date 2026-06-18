import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
    let { data: usersData, error } = await supabase.rpc('dash_get_users_data').single();
    if (error) console.error(error);
    else console.log("Dash users data allUsers[0]:", usersData.allUsers ? Object.keys(usersData.allUsers[0]) : "No users");
    
    // Check if we can select email from a view like user_details or profiles?
    console.log(usersData.allUsers.find((u: any) => u.name === 'scottmontford'));
}

run();
