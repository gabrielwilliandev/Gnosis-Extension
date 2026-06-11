const NotificacaoEntitie = require('../entities/NotificacaoEntitie');
const NotificacaoRepository = require('../repositories/NotificacaoRepository.js');

class NotificacaoService {
    static async criar(dadosNotificacao) {

        const novaNotificacao = new NotificacaoEntitie(dadosNotificacao);
        
        return await NotificacaoRepository.salvar(novaNotificacao);
    }
}

module.exports = NotificacaoService;