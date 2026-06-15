const {createClient} = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.supabaseUrl, env.supabaseKey);

const supabaseAuth = supabase;

module.exports = supabase;
module.exports.supabaseAuth = supabaseAuth;
