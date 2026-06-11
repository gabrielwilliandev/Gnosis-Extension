const supabase = require('../config/supabase')
// salva a notificacao no banco
class NotificacaoRepository{
    static async salvar(notificacaoEntity){
        const {data, error} = await supabase
        .from('notificacoes')
        .insert([
            {
                user_id: notificacaoEntity.idUsuario,
                tarefa_id: notificacaoEntity.idTarefa,
                mensagem: notificacaoEntity.mensagem
            }
        ])
        .select()
        .single();

        if(error) throw new Error(`Erro ao salvar notificação: ${error.message}`);
        return data;
    }
}
module.exports = NotificacaoRepository;