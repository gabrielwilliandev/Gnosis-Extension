const MateriaEntitie = require('../entities/MateriaEntitie');
const MateriaRepository = require('../repositories/MateriaRepository.js');
const ValidationError = require('../errors/ValidationError');
const ValidarMateria =  require('../validate/ValidateMateria.js');

class MateriaService {
    static async cadastrar(dadosMateria) {
        if(await ValidarMateria.validarmateria(dadosMateria)) { 
        const novaMateria = new MateriaEntitie(dadosMateria);
        return await MateriaRepository.salvar(novaMateria);

        }
        
    }
    static async deletar(idMateria) {
        if (!idMateria) {
            throw new ValidationError('Falha ao deletar materia.', [
                { field: 'idMateria', message: 'Nao e possivel deletar materia sem identificar a materia.' }
            ]);
        }
        return await MateriaRepository.deletar(idMateria);
    }

    static async listarPorUsuario(idUsuario) {
        if (!idUsuario) {
            throw new ValidationError('Falha ao listar materias.', [
                { field: 'idUsuario', message: 'Nao e possivel buscar materias sem identificar o usuario.' }
            ]);
        }

        return await MateriaRepository.buscarPorUsuario(idUsuario);
    }
}

module.exports = MateriaService;
