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

        // 1. Injeta o token num cookie HttpOnly (Seguro contra XSS)
        res.cookie('gnosis_token', dadosLogin.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true se for HTTPS
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000 // Expira em 1 hora
        });

        res.cookie('gnosis_refresh_token', dadosLogin.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // 2. Injeta os dados do usuário num cookie normal (Acessível ao JS para a UI)
        res.cookie('gnosis_user', JSON.stringify(dadosLogin.usuario), {
            httpOnly: false,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json(
            success(dadosLogin, 'Login realizado com sucesso')
        );
    });

    static refresh = asyncHandler(async (req, res) => {
        const refreshToken = req.body?.refreshToken || req.cookies?.gnosis_refresh_token;
        const dadosSessao = await UsuarioService.refreshSession(refreshToken);

        res.cookie('gnosis_token', dadosSessao.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000
        });

        res.cookie('gnosis_refresh_token', dadosSessao.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json(
            success(dadosSessao, 'Sessao renovada com sucesso')
        );
    });

    static logout = asyncHandler(async (req, res) => {
        res.clearCookie('gnosis_token', { path: '/' });
        res.clearCookie('gnosis_refresh_token', { path: '/' });
        res.clearCookie('gnosis_user', { path: '/' });
        
        return res.status(200).json(success(null, 'Logout realizado com sucesso'));
    });
}

module.exports = UsuarioController;
