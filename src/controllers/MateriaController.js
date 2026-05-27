const { success } = require('../utils/response.js');
const MateriaService = require('../service/MateriaService.js');
const asyncHandler = require('../middlewares/asyncHandler');

class MateriaController {
    static cadastrar = asyncHandler(async (req, res) => {
        const materiaSalva = await MateriaService.cadastrar(req.body);

        return res.status(201).json(
            success(materiaSalva, 'Materia cadastrada com sucesso!')
        );
    });
    
    static deletar = asyncHandler(async (req, res) => {
        const { idMateria } = req.params;
        await MateriaService.deletar(idMateria);
        return res.status(200).json(
            success(null, 'Materia deletada com sucesso!')
        );
    });

    static listar = asyncHandler(async (req, res) => {
        const { idUsuario } = req.params;
        const materias = await MateriaService.listarPorUsuario(idUsuario);

        if (!materias || materias.length === 0) {
            return res.status(200).json(
                success([], 'Nenhuma materia encontrada')
            );
        }

        return res.status(200).json(
            success(materias, 'Materias listadas com sucesso')
        );
    });
}

module.exports = MateriaController;
