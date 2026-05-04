const TarefaEntitie = require('../entities/TarefaEntitie');
const TarefaRepository = require('../repositories/TarefaRepository.js');

class TarefaService {
    static async cadastrar(dadosTarefa) {
        const novaTarefa = new TarefaEntitie(dadosTarefa);
        const tarefaSalva = await TarefaRepository.salvar(novaTarefa);

        return tarefaSalva;
    }
    static async listarPorUsuario(userId) {
        if (!userId) throw new Error("O ID do usuário é obrigatório para listar as tarefas.");
        return await TarefaRepository.buscarPorUsuario(userId);
    }
    static async listarPendentes(userId){
        if(!userId) throw new Error("O ID do usuário é obrigatório!");
        return await TarefaRepository.buscarPendentesPorUsuario(userId);
        
    }

    static async listarSelecionada(userId, tarefaId){
        if(!userId) throw new Error("O ID do usuário é obrigatório!");
        if(!tarefaId) throw new Error ("O ID da tarefa é obrigatório");
        return await TarefaRepository.buscarSelecionadaPorUsuario(userId,tarefaId);
    }
}

module.exports = TarefaService;