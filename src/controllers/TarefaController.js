const { success } = require('../utils/response.js');
const TarefaService = require('../service/TarefaService.js');
const asyncHandler = require('../middlewares/asyncHandler');

class TarefaController {
    static cadastrar = asyncHandler(async (req, res) => {
        const tarefaSalva = await TarefaService.cadastrar(req.body);

        return res.status(201).json(
            success(tarefaSalva, 'Tarefa criada com sucesso!')
        );
    });

    static listar = asyncHandler(async (req, res) => {
        const { user_id } = req.params;
        const tarefas = await TarefaService.listarPorUsuario(user_id);

        if (!tarefas || tarefas.length === 0) {
            return res.status(200).json(
                success([], 'Nenhuma tarefa encontrada')
            );
        }

        return res.status(200).json(
            success(tarefas, 'Tarefas listadas com sucesso')
        );
    });

    static listarPendentes = asyncHandler(async (req, res) => {
        const { user_id } = req.params;
        const tarefasPendentes = await TarefaService.listarPendentes(user_id);

        if (!tarefasPendentes || tarefasPendentes.length === 0) {
            return res.status(200).json(
                success([], 'Nenhuma tarefa pendente encontrada')
            );
        }

        return res.status(200).json(
            success(tarefasPendentes, 'Tarefas pendentes listadas')
        );
    });

    static atualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { titulo, descricao, status } = req.body;

        const tarefaAtualizada = await TarefaService.atualizar(id, {
            titulo,
            descricao,
            status
        });

        return res.status(200).json(
            success(tarefaAtualizada, 'Tarefa atualizada com sucesso')
        );
    });

    static listarTarefaSelecionada = asyncHandler(async (req, res) => {
        const { user_id, tarefaId } = req.params;
        const tarefaSelecionada = await TarefaService.listarSelecionada(user_id, tarefaId);

        return res.status(200).json(
            success(tarefaSelecionada, 'Tarefa encontrada com sucesso')
        );
    });
}

module.exports = TarefaController;
