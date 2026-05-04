const { success } = require('../utils/response.js');
const NotificacaoService = require('../service/NotificacaoService.js');
const asyncHandler = require('../middlewares/asyncHandler');

class NotificacaoController {
    static criar = asyncHandler(async (req, res) => {
        const notificacaoSalva = await NotificacaoService.criar(req.body);

        return res.status(201).json(
            success(notificacaoSalva, 'Notificacao agendada com sucesso!')
        );
    });
}

module.exports = NotificacaoController;
