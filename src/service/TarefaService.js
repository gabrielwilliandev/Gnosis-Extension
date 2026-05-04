const TarefaEntitie = require('../entities/TarefaEntitie');
const TarefaRepository = require('../repositories/TarefaRepository.js');
const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');
const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class TarefaService {
    static async cadastrar(dadosTarefa) {
        const novaTarefa = new TarefaEntitie(dadosTarefa);
        const tarefaSalva = await TarefaRepository.salvar(novaTarefa);

        return tarefaSalva;
    }

    static async listarPorUsuario(userId) {
        if (!userId) {
            throw new ValidationError('Falha ao listar tarefas.', [
                { field: 'user_id', message: 'O ID do usuario e obrigatorio para listar as tarefas.' }
            ]);
        }

        return await TarefaRepository.buscarPorUsuario(userId);
    }

    static async listarPendentes(userId) {
        if (!userId) {
            throw new ValidationError('Falha ao listar tarefas pendentes.', [
                { field: 'user_id', message: 'O ID do usuario e obrigatorio.' }
            ]);
        }

        return await TarefaRepository.buscarPendentesPorUsuario(userId);
    }

    static async atualizar(id, dados) {
        if (!id) {
            throw new ValidationError('Falha ao atualizar tarefa.', [
                { field: 'id', message: 'O ID da tarefa e obrigatorio.' }
            ]);
        }

        const { data, error } = await supabase
            .from('tarefas')
            .update(dados)
            .eq('id', id)
            .select();

        if (error) {
            throw new AppError(error.message, 400, 'TASK_UPDATE_ERROR');
        }

        if (!data || data.length === 0) {
            throw new AppError('Tarefa nao encontrada', 404, 'TASK_NOT_FOUND');
        }

        return data[0];
    }

    static async listarSelecionada(userId, tarefaId) {
        const notification = new Notification();

        if (!userId) {
            notification.addError('user_id', 'O ID do usuario e obrigatorio.');
        }

        if (!tarefaId) {
            notification.addError('tarefaId', 'O ID da tarefa e obrigatorio.');
        }

        if (notification.hasErrors()) {
            throw new ValidationError('Falha ao buscar tarefa.', notification.getErrors());
        }

        return await TarefaRepository.buscarSelecionadaPorUsuario(userId, tarefaId);
    }
}

module.exports = TarefaService;
