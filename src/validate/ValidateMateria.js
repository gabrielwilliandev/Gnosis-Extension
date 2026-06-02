const ValidationError = require('../errors/ValidationError');
const Notification = require('../utils/Notification');
const MateriaRepository = require('../repositories/MateriaRepository');

class ValidarMateria {
    static async validarmateria(dados){
        
        const notification = new Notification();

        if (!dados.nome || dados.nome.trim() === ''){
            notification.addError('Nome', 'Materia obrigatório')
        } else {
            const materiaExistente = await MateriaRepository.buscarPorNome(dados.nome.trim());

            if (materiaExistente && materiaExistente.length > 0) {
            notification.addError('Nome', 'Já existe uma matéria cadastrada com este nome');
        }

        }

        if (notification.hasErrors()){
            throw new ValidationError('Falha no cadastro da matéria', notification.getErrors());
        }

         return true;

    }

   

}

module.exports = ValidarMateria