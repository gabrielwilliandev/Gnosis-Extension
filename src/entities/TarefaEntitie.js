const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class TarefaEntitie {
  constructor({
    titulo,
    descricao,
    data_inicio,
    data_vencimento,
    hora_vencimento,
    idUsuario,
    idMaterias = []
  }) {
    this.titulo = titulo;
    this.descricao = descricao;
    this.data_inicio = data_inicio || new Date();
    this.data_vencimento = data_vencimento;
    this.hora_vencimento = hora_vencimento;
    this.status = 'Pendente';
    this.idUsuario = idUsuario;
    this.idsMaterias = idMaterias;
    this.data_cadastro = new Date();

    this.validar();
  }

  validar() {
    const notification = new Notification();

    if (!this.titulo) {
      notification.addError('titulo', 'O titulo da tarefa e obrigatorio.');
    }

    if (!this.data_vencimento) {
      notification.addError('data_vencimento', 'A data de vencimento e obrigatoria.');
    }

    if (!this.idUsuario) {
      notification.addError('idUsuario', 'Toda tarefa deve ter um usuario responsavel.');
    }

    if (notification.hasErrors()) {
      throw new ValidationError('Falha ao validar tarefa.', notification.getErrors());
    }
  }
}

module.exports = TarefaEntitie;
