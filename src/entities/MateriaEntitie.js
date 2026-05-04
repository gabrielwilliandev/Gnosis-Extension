const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class MateriaEntitie {
    constructor({ nome, idUsuario }) {
        this.nome = nome;
        this.idUsuario = idUsuario;
        this.data_cadastro = new Date();

        this.validar();
    }

    validar() {
        const notification = new Notification();

        if (!this.nome) {
            notification.addError('nome', 'O nome da materia e obrigatorio.');
        }

        if (!this.idUsuario) {
            notification.addError('idUsuario', 'A materia deve pertencer a um usuario.');
        }

        if (notification.hasErrors()) {
            throw new ValidationError('Falha ao validar materia.', notification.getErrors());
        }
    }
}

module.exports = MateriaEntitie;
