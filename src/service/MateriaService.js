const MateriaEntitie = require('../entities/MateriaEntitie');
const MateriaRepository = require('../repositories/MateriaRepository.js');
const ValidationError = require('../errors/ValidationError');

class MateriaService {
    static async cadastrar(dadosMateria) {
        const novaMateria = new MateriaEntitie(dadosMateria);
        return await MateriaRepository.salvar(novaMateria);
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
