const {createClient} = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabaseUrl, env.supabaseKey);

const supabaseAuth = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
});

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
