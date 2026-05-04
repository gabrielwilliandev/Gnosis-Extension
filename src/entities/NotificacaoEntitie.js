const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class NotificacaoEntitie {
  constructor({ mensagem, data_envio, idTarefa, idUsuario }) {
    this.mensagem = mensagem;
    this.data_envio = data_envio;
    this.idTarefa = idTarefa;
    this.idUsuario = idUsuario;
    this.data_criacao = new Date();

    this.validar();
  }

  validar() {
    const notification = new Notification();

    if (!this.mensagem) {
      notification.addError('mensagem', 'A mensagem da notificacao e obrigatoria.');
    }

    if (!this.data_envio) {
      notification.addError('data_envio', 'A data de envio da notificacao deve ser definida.');
    }

    if (!this.idTarefa) {
      notification.addError('idTarefa', 'Toda notificacao precisa estar vinculada a uma tarefa.');
    }

    if (!this.idUsuario) {
      notification.addError('idUsuario', 'Toda notificacao precisa pertencer a um usuario.');
    }

    if (notification.hasErrors()) {
      throw new ValidationError('Falha ao validar notificacao.', notification.getErrors());
    }
  }
}

module.exports = NotificacaoEntitie;
