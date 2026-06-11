require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const clientOptions = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
    }
};

const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
const supabaseAuth = createClient(supabaseUrl, supabaseKey, clientOptions);

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
