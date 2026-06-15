const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');

function normalizarMateria(relacao) {
    if (!relacao) return null;
    if (Array.isArray(relacao)) return normalizarMateria(relacao[0]);
    if (typeof relacao === 'string') return { nome: relacao };

    return relacao.materias
        || relacao.materia
        || relacao.nome_materia && { nome: relacao.nome_materia }
        || relacao.nome && relacao
        || null;
}

function mapearTarefaComMaterias(tarefa, materiasPorTarefa = new Map()) {
    const relacoes = tarefa.tarefas_materias || tarefa.tarefa_materia || tarefa.materias || [];
    const materiasRelacionadas = materiasPorTarefa.get(tarefa.id);
    const materias = Array.isArray(materiasRelacionadas) && materiasRelacionadas.length > 0
        ? materiasRelacionadas
        : Array.isArray(relacoes)
        ? relacoes.map(normalizarMateria).filter(Boolean)
        : [];

    return {
        ...tarefa,
        materias
    };
}

async function buscarMateriasPorTarefas(tarefas) {
    const idsTarefas = tarefas.map((tarefa) => tarefa.id).filter(Boolean);
    if (idsTarefas.length === 0) return new Map();

    const { data, error } = await supabase
        .from('tarefas_materias')
        .select(`
            tarefa_id,
            materias (id, nome)
        `)
        .in('tarefa_id', idsTarefas);

    if (error) {
        throw new AppError(`Erro ao buscar materias das tarefas: ${error.message}`, 400, 'TASK_SUBJECT_FETCH_ERROR');
    }

    return (data || []).reduce((mapa, relacao) => {
        const materia = normalizarMateria(relacao);
        if (!materia) return mapa;

        const materias = mapa.get(relacao.tarefa_id) || [];
        materias.push(materia);
        mapa.set(relacao.tarefa_id, materias);
        return mapa;
    }, new Map());
}


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
            const inicioMes = `${ano_mes}-01`;
            const [ano, mes] = ano_mes.split('-').map(Number);
            const proximoMes = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`; 
            filtro = filtro.gte('data_vencimento', inicioMes).lt('data_vencimento', proximoMes);
        }

        const { data, error } = await filtro;
        if (error) {
            throw new AppError(`Erro ao buscar tarefas: ${error.message}`, 400, 'TASK_FETCH_ERROR');
        }

        const materiasPorTarefa = await buscarMateriasPorTarefas(data || []);
        return data.map((tarefa) => mapearTarefaComMaterias(tarefa, materiasPorTarefa));
    }

    static async buscarPendentesPorUsuario(userId) {
        const { data, error } = await supabase
            .from('tarefas')
            .select(`
                *,
                tarefas_materias (
                    materias (id, nome)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'Pendente')
            .order('data_vencimento', { ascending: true })
            .order('hora_vencimento', { ascending: true });

        if (error) {
            throw new AppError(`Erro ao buscar tarefas pendentes: ${error.message}`, 400, 'TASK_PENDING_FETCH_ERROR');
        }

        const materiasPorTarefa = await buscarMateriasPorTarefas(data || []);
        return data.map((tarefa) => mapearTarefaComMaterias(tarefa, materiasPorTarefa));
    }

    static async buscarSelecionadaPorUsuario(userId, tarefaId) {
        const { data, error } = await supabase
            .from('tarefas')
            .select(`
                *,
                tarefas_materias (
                    materias (id, nome)
                )
            `)
            .eq('user_id', userId)
            .eq('id', tarefaId);

        if (error) {
            throw new AppError(`Erro ao buscar tarefa: ${error.message}`, 400, 'TASK_FETCH_SELECTED_ERROR');
        }

        const materiasPorTarefa = await buscarMateriasPorTarefas(data || []);
        return data.map((tarefa) => mapearTarefaComMaterias(tarefa, materiasPorTarefa));
    }

    static async buscarPorId(id) {
        const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new AppError(`Erro ao buscar tarefa: ${error.message}`, 400, 'TASK_FETCH_ERROR');
        }

        return data;
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
