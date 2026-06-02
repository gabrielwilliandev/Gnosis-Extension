const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class Validar {
    static validartarefa(dados){
        const regexHora = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const notification = new Notification();

        if (!dados.titulo || dados.titulo.trim() === ''){
            notification.addError('Titulo', 'Titulo obrigatório')
        }

        if (!dados.data_vencimento || dados.data_vencimento.trim() === '') {
            notification.addError('Data', 'Data obrigatório');
        } else {
        
            const partesData = dados.data_vencimento.split('-');
            
            const dataEscolhida = new Date(partesData[0], partesData[1] - 1, partesData[2]);
            
            const dataAtual = new Date();
   
            dataAtual.setHours(0, 0, 0, 0);

            if (dataEscolhida < dataAtual) {
                notification.addError('Data', 'A data da atividade não pode ser no passado');
            }
        }

        if (!dados.hora_vencimento || dados.hora_vencimento.trim() === ''){
            notification.addError('Hora', 'Horário obrigatório')
        } else if (!regexHora.test(dados.hora_vencimento)){
            notification.addError('Hora', 'Horário inválido. Use o formato HH:mm');
        }

        if (notification.hasErrors()){

            console.log("DADOS RECEBIDOS DO FRONTEND:", dados);
            console.log("ERROS ESCONDIDOS:", notification.getErrors());
            throw new ValidationError('Falha no cadastro da atividade', notification.getErrors());
        }

        return true;

    }

}

module.exports = Validar