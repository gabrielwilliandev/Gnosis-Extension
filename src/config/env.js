require('dotenv').config();

const env = {
    port: Number(process.env.PORT) || 3000,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY
};

if (!env.supabaseUrl) {
    throw new Error('SUPABASE_URL nao configurada.');
}

if (!env.supabaseKey) {
    throw new Error('SUPABASE_KEY nao configurada.');
}

module.exports = env;
