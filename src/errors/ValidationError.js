const AppError = require('./AppError');

class ValidationError extends AppError {
    constructor(message = 'Dados invalidos', details = [], code = 'VALIDATION_ERROR') {
        super(message, 400, code, details);
        this.name = 'ValidationError';
    }
}

module.exports = ValidationError;
