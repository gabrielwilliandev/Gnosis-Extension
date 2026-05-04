const { success, error } = require('../utils/response.js');
const NotificacaoService = require('../services/NotificacaoService.js');

class NotificacaoController {
    static async criar(req, res) {
        try {
            const notificacaoSalva = await NotificacaoService.criar(req.body);

            return res.status(201).json(
                success(notificacaoSalva, "Notificação agendada com sucesso!")
            );

        } catch (err) {
            console.error("Erro ao criar notificação:", err.message);

            return res.status(400).json(
                error(err.message)
            );
        }
    }
}

module.exports = NotificacaoController;