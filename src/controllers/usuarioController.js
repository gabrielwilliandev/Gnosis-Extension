const UsuarioService = require('../service/UsuarioService.js');
const { success } = require('../utils/response.js');
const asyncHandler = require('../middlewares/asyncHandler');

class UsuarioController {
    static cadastrar = asyncHandler(async (req, res) => {
        const usuarioSalvo = await UsuarioService.cadastrar(req.body);

        return res.status(201).json(
            success(
                {
                    id: usuarioSalvo.id,
                    nome: usuarioSalvo.nome,
                    email: usuarioSalvo.email,
                    data_cadastro: usuarioSalvo.data_cadastro
                },
                'Usuario cadastrado com sucesso!'
            )
        );
    });

    static login = asyncHandler(async (req, res) => {
        const { email, senha } = req.body || {};
        const dadosLogin = await UsuarioService.login(email, senha);

        return res.status(200).json(
            success(dadosLogin, 'Login realizado com sucesso')
        );
    });
}

module.exports = UsuarioController;
