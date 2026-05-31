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

    static async buscarPorUsuario(userId, ano_mes) {
       const inicioMes = `${ano_mes}-01`;
       const [ano, mes] = ano_mes.split('-').map(Number);

       const proximoMes = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`; 

       let filtro = supabase
        .from('tarefas')
        .select(`
            *,
            tarefas_materias (
                materias (id, nome)
            )
        `)
        .eq('user_id', userId);

        if (ano_mes && ano_mes !== 'TODOS') {
            filtro = filtro.gte('data_vencimento', inicioMes).lt('data_vencimento', proximoMes);
        }

        const { data, error } = await filtro;
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
    static async deletar(id) {
    const { data, error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
}

module.exports = TarefaRepository;
