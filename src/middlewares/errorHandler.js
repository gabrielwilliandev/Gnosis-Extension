const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = statusCode >= 500 ? 'Erro interno do servidor' : err.message;
    const details = Array.isArray(err.details) ? err.details : [];

    if (statusCode >= 500) {
        console.error('Erro nao tratado:', err);
    }

    return res.status(statusCode).json(error(message, details, code));
}

module.exports = errorHandler;
