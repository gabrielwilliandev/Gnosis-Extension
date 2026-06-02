const supabase = require('../config/supabase');
const AppError = require('../errors/AppError');

class MateriaRepository {
    static async salvar(materiaEntity) {
        const { data, error } = await supabase
            .from('materias')
            .insert([
                {
                    nome: materiaEntity.nome,
                    user_id: materiaEntity.idUsuario
                }
            ])
            .select()
            .single();

        if (error) {
            throw new AppError(`Erro ao salvar materia: ${error.message}`, 400, 'SUBJECT_CREATE_ERROR');
        }

        return data;
    }

    static async buscarPorUsuario(userId) {
        const { data, error } = await supabase
            .from('materias')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw new AppError(error.message, 400, 'SUBJECT_FETCH_ERROR');
        }
               return data;
    }

    static async buscarPorNome(nome) {
        const { data, error } = await supabase
            .from('materias')
            .select('*')
            .eq('nome', nome);

        if (error) {
            throw new AppError(error.message, 400, 'SUBJECT_FETCH_ERROR');
        }

    
        return data; 
    }
}

 

module.exports = MateriaRepository;
