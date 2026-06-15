const supabase = require('../config/supabase');
const { supabaseAuth } = require('../config/supabase');
const AppError = require('../errors/AppError');

class UsuarioRepository {
    static async salvar(usuarioEntity) {
        let authUserId = null;

        try {
            const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
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
                await supabaseAuth.auth.admin.deleteUser(authUserId);
            }

            if (error.message === 'User already registered') {
                throw new AppError('Este e-mail já está cadastrado.', 400, 'USER_ALREADY_REGISTERED');
            }

            if (error.message.includes('Password should be at least')) {
                throw new AppError('A senha deve possuir pelo menos 6 caracteres.', 400, 'PASSWORD_TOO_SHORT');
            }

            throw new AppError('Erro ao cadastrar usuário.', 400, 'REGISTER_ERROR');   
        }
    }

    static async login(email, senha) {
        try {
            const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
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
                refreshToken: authData.session.refresh_token,
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

    static async refreshSession(refreshToken) {
        try {
            const { data, error } = await supabaseAuth.auth.refreshSession({
                refresh_token: refreshToken
            });

            if (error || !data.session) {
                throw new AppError('Sessao expirada. Faca login novamente.', 401, 'AUTH_REFRESH_FAILED');
            }

            return {
                token: data.session.access_token,
                refreshToken: data.session.refresh_token,
                usuario: data.user ? {
                    id: data.user.id,
                    email: data.user.email
                } : null
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error('Erro ao renovar sessao:', error.message || error);
            throw new AppError('Sessao expirada. Faca login novamente.', 401, 'AUTH_REFRESH_FAILED');
        }
    }
}

module.exports = UsuarioRepository;
