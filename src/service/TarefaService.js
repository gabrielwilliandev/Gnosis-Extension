const TarefaEntitie = require('../entities/TarefaEntitie');
const TarefaRepository = require('../repositories/TarefaRepository.js');
const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');
const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');
const Validar = require('../validate/ValidateTarefa.js')

function normalizarStatus(status) {
    return String(status || '').trim().toLowerCase();
}

function montarDataHoraVencimento(tarefa) {
    const dataVencimento = tarefa?.data_vencimento;
    if (!dataVencimento) return null;

    const dataTexto = String(dataVencimento).slice(0, 10);
    const [ano, mes, dia] = dataTexto.split('-').map(Number);

    if (!ano || !mes || !dia) return null;

    const horaTexto = tarefa.hora_vencimento || '23:59:59';
    const [hora = 23, minuto = 59, segundo = 59] = String(horaTexto).split(':').map(Number);

    const vencimento = new Date(ano, mes - 1, dia, hora || 0, minuto || 0, segundo || 0);
    return Number.isNaN(vencimento.getTime()) ? null : vencimento;
}

function tarefaEstaVencida(tarefa) {
    const vencimento = montarDataHoraVencimento(tarefa);
    return vencimento ? vencimento < new Date() : false;
}

class TarefaService {
    static async cadastrar(dadosTarefa) {
        if (Validar.validartarefa(dadosTarefa)){
        const novaTarefa = new TarefaEntitie(dadosTarefa)
        const tarefaSalva = await TarefaRepository.salvar(novaTarefa);
        return tarefaSalva;
        }
        
    }

    static async listarPorUsuario(userId, ano_mes) {
        if (!userId) {
            throw new ValidationError('Falha ao listar tarefas.', [
                { field: 'user_id', message: 'O ID do usuario e obrigatorio para listar as tarefas.' }
            ]);
        }
        if(!ano_mes){
            ano_mes = 'TODOS';
        }
        const tarefas = await TarefaRepository.buscarPorUsuario(userId, ano_mes);
        return await hidratarMaterias(tarefas);
    }

    static async listarPendentes(userId) {
        if (!userId) {
            throw new ValidationError('Falha ao listar tarefas pendentes.', [
                { field: 'user_id', message: 'O ID do usuario e obrigatorio.' }
            ]);
        }

        const tarefas = await TarefaRepository.buscarPendentesPorUsuario(userId);
        return await hidratarMaterias(tarefas);
    }

    static async atualizar(id, dados) {
        if (!id) {
            throw new ValidationError('Falha ao atualizar tarefa.', [
                { field: 'id', message: 'O ID da tarefa e obrigatorio.' }
            ]);
        }

        const { idMaterias, ...dadosRecebidos } = dados;
        const dadosTarefa = Object.fromEntries(
            Object.entries(dadosRecebidos).filter(([, value]) => value !== undefined)
        );

        if (Object.prototype.hasOwnProperty.call(dadosTarefa, 'status')) {
            const tarefaAtual = await TarefaRepository.buscarPorId(id);
            const statusAtual = normalizarStatus(tarefaAtual.status);
            const novoStatus = normalizarStatus(dadosTarefa.status);

            if (novoStatus && novoStatus !== statusAtual && tarefaEstaVencida(tarefaAtual)) {
                throw new AppError(
                    'Nao e possivel alterar o status de uma tarefa vencida.',
                    409,
                    'TASK_STATUS_LOCKED'
                );
            }
        }

        const { data, error } = await supabase
            .from('tarefas')
            .update(dadosTarefa)
            .eq('id', id)
            .select();

        // TABELA DE RELACIONAMENTO (Apenas atualiza se o array foi passado, evita falhas ao alterar status)
        if (Array.isArray(idMaterias)) {
            const { error: deleteError } = await supabase
                .from('tarefas_materias')
                .delete()
                .eq('tarefa_id', id);

            if (deleteError) {
                throw new AppError(
                    deleteError.message,
                    400,
                    'TASK_MATERIAS_DELETE_ERROR'
                );
            }

            if (idMaterias.length > 0) {
                const { error: insertError } = await supabase
                    .from('tarefas_materias')
                    .insert(
                        idMaterias.map(materiaId => ({
                            tarefa_id: id,
                            materia_id: materiaId
                        }))
                    );

                if (insertError) {
                    throw new AppError(
                        insertError.message,
                        400,
                        'TASK_MATERIAS_INSERT_ERROR'
                    );
                }
            }
        }

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

        const tarefas = await TarefaRepository.buscarSelecionadaPorUsuario(userId, tarefaId);
        return await hidratarMaterias(tarefas);
    }
    static async deletar(id) {
    if (!id) {
        throw new Error('ID da tarefa é obrigatório');
    }

    return await TarefaRepository.deletar(id);
}
}

module.exports = TarefaService;
