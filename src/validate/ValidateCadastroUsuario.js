const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class ValidarCadastro{
    static validarCadastro(dados){
    const notification = new Notification();
    
    if  (!dados.nome || dados.nome.trim() === ''){
        notification.addError('Nome','Nome obrigatório');
    }

    if(!dados.email || dados.email.trim() === ''){
        notification.addError('Email','Email obrigatório');
    }

    if(!dados.cadastrar_senha || dados.cadastrar_senha.trim() === ''){
        notification.addError('Senha','Senha obrigatória');
    } else if(!dados.cadastrar_confirmar || dados.cadastrar_confirmar.trim() === ''){
        notification.addError('Senha','A confirmação da senha é obrigatória');
    }
    else if(dados.cadastrar_senha != dados.cadastrar_confirmar){
        notification.addError('Senha','Senhas devem ser iguais');
    }

    if (notification.hasErrors()){
            console.log("DADOS RECEBIDOS DO FRONTEND:", dados);
            console.log("ERROS ESCONDIDOS:", notification.getErrors());
            throw new ValidationError('Falha no cadastro do usuário', notification.getErrors());
    }

    return true;
    }

}

module.exports = ValidarCadastro