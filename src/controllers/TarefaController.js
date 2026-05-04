const TarefaService = require('../service/TarefaService.js');

class TarefaController {
    static async cadastrar(req, res) {
        try {
            const tarefaSalva = await TarefaService.cadastrar(req.body);

            return res.status(201).json({
                mensagem: "Tarefa criada com sucesso!",
                tarefa: tarefaSalva
            });
        } catch (error) {
            console.error("Erro ao cadastrar tarefa:", error.message);
            return res.status(400).json({ erro: error.message });
        }
    }
    static async listar(req, res) {
        try {
            const { user_id } = req.params;
            const tarefas = await TarefaService.listarPorUsuario(user_id);

            return res.status(200).json(tarefas);
        } catch (error) {
            console.error("Erro ao listar tarefas:", error.message);
            return res.status(400).json({ erro: error.message });
        }
    }
    static async listarPendentes(req, res){
        try{
            const {user_id} = req.params;
            const tarefasPendentes = await TarefaService.listarPendentes(user_id);

            return res.status(200).json(tarefasPendentes);
        }catch(error){
            console.error("Erro ao listar tarefas pendentes:", error.message);
            return res.status(400).json({ erro: error.mensage});
        }
    }

    static async listarTarefaSelecionada(req, res){
        try{
            const{user_id, tarefaId} = req.params;
            const tarefaSelecionada = await TarefaService.listarSelecionada(user_id,tarefaId);
            return res.status(200).json(tarefaSelecionada);

        }catch(error){
            console.error("Erro ao listar tarefa:", error.message);
            return res.status(400).json({ erro: error.message});
        }
    }
}

module.exports = TarefaController;