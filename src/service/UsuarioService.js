const UsuarioEntite = require('../entities/UsuarioEntitie');
const UsuarioRepository = require('../repositories/UsuarioRepository.js');
const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');

class UsuarioService {
    static async cadastrar(dadosUsuario) {
        const novoUsuario = new UsuarioEntite(dadosUsuario);
        const usuarioSalvo = await UsuarioRepository.salvar(novoUsuario);

        return usuarioSalvo;
    }

    static async buscarPerfil(email) {
        if (!email) {
            throw new ValidationError('Falha ao buscar perfil.', [
                { field: 'email', message: 'O email e obrigatorio para busca.' }
            ]);
        }

        return await UsuarioRepository.buscarPorEmail(email);
    }

    static async login(email, senha) {
        const notification = new Notification();

        if (!email) {
            notification.addError('email', 'E-mail e obrigatorio para realizar o login.');
        }

        if (!senha) {
            notification.addError('senha', 'Senha e obrigatoria para realizar o login.');
        }

        if (notification.hasErrors()) {
            throw new ValidationError('Falha ao realizar login.', notification.getErrors());
        }

        return await UsuarioRepository.login(email, senha);
    }
}

module.exports = UsuarioService;
