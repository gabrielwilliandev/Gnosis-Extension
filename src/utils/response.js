function success(data = null, message = "OK") {
    return {
        success: true,
        message,
        data
    };
}

function error(message = "Erro inesperado", errors = [], code = null) {
    const response = {
        success: false,
        message,
        data: null
    };

    if (code) {
        response.code = code;
    }

    if (errors.length > 0) {
        response.errors = errors;
    }

    return response;
}

module.exports = { success, error };
