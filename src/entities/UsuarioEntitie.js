const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class UsuarioEntitie {
    constructor({ nome, email, senha }) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.data_cadastro = new Date();

        this.validar();
    }

    validar() {
        const notification = new Notification();

        if (!this.nome) {
            notification.addError('nome', 'Nome e obrigatorio.');
        }

        if (!this.email) {
            notification.addError('email', 'Email e obrigatorio.');
        } else if (!this.email.includes('@')) {
            notification.addError('email', 'O email fornecido e invalido.');
        }

        if (!this.senha) {
            notification.addError('senha', 'Senha e obrigatoria.');
        }

        if (notification.hasErrors()) {
            throw new ValidationError('Falha ao validar usuario.', notification.getErrors());
        }
    }
}

module.exports = UsuarioEntitie;
