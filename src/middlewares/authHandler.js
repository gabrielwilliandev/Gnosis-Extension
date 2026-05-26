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
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token ausente' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

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