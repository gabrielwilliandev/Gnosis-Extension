const { success, error } = require('../utils/response.js');
const TarefaService = require('../service/TarefaService.js');


class TarefaController {
    static async cadastrar(req, res) {
        try {
            const tarefaSalva = await TarefaService.cadastrar(req.body);

            return res.status(201).json(
                success(tarefaSalva, "Tarefa criada com sucesso!")
            );

        } catch (err) {
            console.error("Erro ao cadastrar tarefa:", err.message);
            return res.status(400).json(
                error(err.message)
            );
        }
    }   
    static async listar(req, res) {
        try {
            const { user_id } = req.params;
            const tarefas = await TarefaService.listarPorUsuario(user_id);

            if (!tarefas || tarefas.length === 0) {
            return res.status(200).json(
                success([], "Nenhuma tarefa encontrada")
            );
        }

            return res.status(200).json(
                success(tarefas, "Tarefas listadas com sucesso")
        );

        } catch (err) {
            console.error("Erro ao listar tarefas:", err.message);
            return res.status(400).json(
                error(err.message)
            );
        }
    }
    static async listarPendentes(req, res){
        try{
            const {user_id} = req.params;
            const tarefasPendentes = await TarefaService.listarPendentes(user_id);

            if (!tarefasPendentes || tarefasPendentes.length === 0) {
                return res.status(200).json(
                    success([], "Nenhuma tarefa pendente encontrada")
                );
            }

            return res.status(200).json(
                success(tarefasPendentes, "Tarefas pendentes listadas")
            );

        } catch (err) {
            console.error("Erro ao listar pendentes:", err.message);
            return res.status(400).json(
                error(err.message)
            );
        }
    }
    static async atualizar(req, res) {
    try {
        const { id } = req.params;
        const { titulo, descricao, status } = req.body;

        const tarefaAtualizada = await TarefaService.atualizar(id, {
            titulo,
            descricao,
            status
        });

            if (!tarefaAtualizada) {
                return res.status(404).json(
                    error("Tarefa não encontrada")
                );
            }

            return res.status(200).json(
                success(tarefaAtualizada, "Tarefa atualizada com sucesso")
            );

        } catch (err) {
            console.error("Erro ao atualizar tarefa:", err.message);
                return res.status(400).json(
                    error(err.message)
            );
        }
    }   

   static async listarTarefaSelecionada(req, res){
        try{
            const { user_id, tarefaId } = req.params;
            const tarefaSelecionada = await TarefaService.listarSelecionada(user_id, tarefaId);
            
            return res.status(200).json(
                success(tarefaSelecionada, "Tarefa encontrada com sucesso")
            );

        } catch (err) {
            console.error("Erro ao listar tarefa:", err.message);
            
            return res.status(400).json(
                error(err.message)
            );
        }
    }
}


module.exports = TarefaController;

