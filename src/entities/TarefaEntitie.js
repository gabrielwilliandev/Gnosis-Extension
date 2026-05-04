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
    this.idsMateria = idMaterias; 
    this.data_cadastro = new Date();

    this.validar();
  }

  validar() {
    if (!this.titulo) throw new Error("O título da tarefa é obrigatório.");
    if (!this.data_vencimento) throw new Error("A data de vencimento é obrigatória.");
    if (!this.idUsuario) throw new Error("Toda tarefa deve ter um usuário responsável.");
  }
}

module.exports = TarefaEntitie;