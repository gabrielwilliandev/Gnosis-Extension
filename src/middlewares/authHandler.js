const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const env = require('../config/env');

const supabaseAuthUrl = `${env.supabaseUrl}/auth/v1`;

const client = jwksClient({
    jwksUri: `${supabaseAuthUrl}/.well-known/jwks.json`,
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

function autenticar(req, res, next, options = {}) {
    const { redirectToLogin = false } = options;

    function falharAutenticacao(status, payload) {
        if (redirectToLogin) {
            return res.redirect('/');
        }

        return res.status(status).json(payload);
    }

    let token = req.cookies?.gnosis_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.replace('Bearer ', '').trim();
    }

    if (!token) {
        return falharAutenticacao(401, { message: 'Token ausente ou expirado' });
    }

    jwt.verify(token, getKey, {
        algorithms: ['ES256'],
        issuer: supabaseAuthUrl,
        audience: 'authenticated'
    }, (err, decoded) => {
        if (err) {
            console.error('[JWT ERROR]', err.message);

            return falharAutenticacao(401, {
                message: 'Token invalido',
                error: err.message
            });
        }

        req.usuario = decoded;
        next();
    });
}

function authHandler(req, res, next) {
    return autenticar(req, res, next);
}

authHandler.protegerPagina = (req, res, next) => {
    return autenticar(req, res, next, { redirectToLogin: true });
};

module.exports = authHandler;
