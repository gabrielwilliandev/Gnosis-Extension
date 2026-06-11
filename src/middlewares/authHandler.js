const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://tgjndyfcwnupaafuonmv.supabase.co/auth/v1/.well-known/jwks.json',
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);

        const publicKey = key.getPublicKey();
        callback(null, publicKey);
    });
}

module.exports = (req, res, next) => {
    // Tenta buscar o token no cookie (Web App)
    let token = req.cookies?.gnosis_token;

    // Se não tiver cookie, tenta pelo header (Extensão do Chrome)
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.replace('Bearer ', '').trim();
    }

    if (!token) {
        return res.status(401).json({ message: 'Token ausente ou expirado' });
    }

    jwt.verify(token, getKey, {
        algorithms: ['ES256'],
        issuer: 'https://tgjndyfcwnupaafuonmv.supabase.co/auth/v1',
        audience: 'authenticated'
    }, (err, decoded) => {
        if (err) {
            console.error('[JWT ERROR]', err.message);

            return res.status(401).json({
                message: 'Token inválido',
                error: err.message
            });
        }

        req.usuario = decoded;
        next();
    });
};