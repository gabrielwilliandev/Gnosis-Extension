class Notification {
    constructor() {
        this.errors = [];
    }

    addError(field, message) {
        this.errors.push({ field, message });
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }
}

module.exports = Notification;
