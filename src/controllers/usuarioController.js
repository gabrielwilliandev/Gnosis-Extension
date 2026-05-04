const UsuarioService = require('../service/UsuarioService.js');
const { success, error } = require('../utils/response.js');

class UsuarioController{
    static async cadastrar(req, res){
        try{
            const usuarioSalvo = await UsuarioService.cadastrar(req.body);

            return res.status(201).json(
                success(
                    {
                        id: usuarioSalvo.id,
                        nome: usuarioSalvo.nome,
                        email: usuarioSalvo.email,
                        data_cadastro: usuarioSalvo.data_cadastro
                    },
                    "Usuário cadastrado com sucesso!"
                )
            );

        } catch (err) {
            console.error("Erro no cadastro de usuário:", err.message);

            return res.status(400).json(
                error(err.message)
            );
        }
    }

    static async login(req, res){
        try{
            const { email, senha } = req.body;
                        
            const dadosLogin = await UsuarioService.login(email, senha);

            if (!dadosLogin) {
                return res.status(401).json(
                    error("E-mail ou senha inválidos")
                );
            }

            return res.status(200).json(
                success(dadosLogin, "Login realizado com sucesso")
            );
        }
        catch (err) {
            console.error("Erro no login de usuário:", err.message);

            return res.status(401).json(
                error(err.message)
            );
        }
    }
}

module.exports = UsuarioController;