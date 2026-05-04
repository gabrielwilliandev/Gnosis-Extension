function success(data = null, message = "OK") {
    return {
        success: true,
        message,
        data
    };
}

function error(message = "Erro inesperado") {
    return {
        success: false,
        message,
        data: null
    };
}

module.exports = { success, error };