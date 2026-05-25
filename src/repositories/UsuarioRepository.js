const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');

class UsuarioRepository {
    static async salvar(usuarioEntity) {
        let authUserId = null;

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: usuarioEntity.email,
                password: usuarioEntity.senha
            });

            if (authError) throw authError;

            authUserId = authData.user.id;

            const { data, error: profileError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        id: authUserId,
                        nome: usuarioEntity.nome,
                        email: usuarioEntity.email,
                        data_cadastro: usuarioEntity.data_cadastro
                    }
                ])
                .select()
                .single();

            if (profileError) throw profileError;

            return data;
        } catch (error) {
            if (authUserId) {
                await supabase.auth.admin.deleteUser(authUserId);
            }

            throw new AppError(`Erro no processo de cadastro: ${error.message}`, 400, 'USER_REGISTRATION_ERROR');
        }
    }

    static async login(email, senha) {
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (authError) {
                throw new AppError('Credenciais invalidas', 401, 'AUTH_INVALID_CREDENTIALS');
            }

            const { data: profileData, error: profileError } = await supabase
                .from('usuarios')
                .select('nome, email')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.warn('Aviso: Nao foi possivel localizar o perfil!');
            }

            return {
                token: authData.session.access_token,
                usuario: {
                    id: authData.user.id,
                    nome: profileData ? profileData.nome : 'Estudante',
                    email: profileData ? profileData.email : 'estudante@gmail.com'
                }
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error('Erro detalhado do Supabase Auth:', error.message || error);
            throw new AppError('Credenciais invalidas', 401, 'AUTH_INVALID_CREDENTIALS');
        }
    }
}

module.exports = UsuarioRepository;
