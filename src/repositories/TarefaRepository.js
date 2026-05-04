const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');

class TarefaRepository {
    static async salvar(tarefaEntity) {
        const { data: tarefaSalva, error: erroTarefa } = await supabase.rpc('criar_tarefa_completa', {
            p_user_id: tarefaEntity.idUsuario,
            p_titulo: tarefaEntity.titulo,
            p_descricao: tarefaEntity.descricao,
            p_data_inicio: tarefaEntity.data_inicio,
            p_data_vencimento: tarefaEntity.data_vencimento,
            p_hora_vencimento: tarefaEntity.hora_vencimento,
            p_status: tarefaEntity.status,
            p_materia_ids: tarefaEntity.idsMaterias || []
        });

        if (erroTarefa) {
            throw new AppError(`Erro ao salvar tarefa: ${erroTarefa.message}`, 400, 'TASK_CREATE_ERROR');
        }

        return tarefaSalva;
    }

    static async buscarPorUsuario(userId) {
        const { data, error } = await supabase
            .from('tarefas')
            .select(`
                *,
                tarefas_materias (
                    materias (id, nome)
                )
            `)
            .eq('user_id', userId);

        if (error) {
            throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 400, 'TASK_FETCH_ERROR');
        }

        return data.map((tarefa) => ({
            ...tarefa,
            materias: tarefa.tarefas_materias.map((tm) => tm.materias)
        }));
    }

    static async buscarPendentesPorUsuario(userId) {
        const { data, error } = await supabase
            .from('tarefas')
            .select(`
            *, tarefas_materias(materias(id, nome)
            )
            `)
            .eq('user_id', userId)
            .eq('status', 'Pendente')
            .order('data_vencimento', { ascending: true })
            .order('hora_vencimento', { ascending: true });

        if (error) {
            throw new AppError(`Erro ao buscar tarefas pendentes: ${error.message}`, 400, 'TASK_PENDING_FETCH_ERROR');
        }

        return data.map((tarefa) => ({
            ...tarefa,
            materias: tarefa.tarefas_materias.map((tm) => tm.materias)
        }));
    }

    static async buscarSelecionadaPorUsuario(userId, tarefaId) {
        const { data, error } = await supabase
            .from('tarefas')
            .select(`
            *, tarefas_materias(materias(id, nome)
            )
            `)
            .eq('user_id', userId)
            .eq('id', tarefaId);

        if (error) {
            throw new AppError(`Erro ao buscar tarefa: ${error.message}`, 400, 'TASK_FETCH_SELECTED_ERROR');
        }

        return data.map((tarefa) => ({
            ...tarefa,
            materias: tarefa.tarefas_materias.map((tm) => tm.materias)
        }));
    }
}

module.exports = TarefaRepository;
