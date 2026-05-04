const { success, error } = require('../utils/response.js');
const MateriaService = require('../service/MateriaService.js');

class MateriaController{
    static async cadastrar(req, res){
        try{
            const materiaSalva = await MateriaService.cadastrar(req.body);

            return res.status(201).json(
                success(materiaSalva, "Matéria cadastrada com sucesso!")
            );

        } catch (err) {
            console.error("Erro ao cadastrar matéria:", err.message);

            return res.status(400).json(
                error(err.message)
            );
        }
    }

    static async listar(req, res){
        try {
            const { idUsuario } = req.params;
            
            const materias = await MateriaService.listarPorUsuario(idUsuario);

            if (!materias || materias.length === 0) {
            return res.status(200).json(
                success([], "Nenhuma matéria encontrada")
            );
        }

return res.status(200).json(
    success(materias, "Matérias listadas com sucesso")
);

        } catch (err) {
            console.error("Erro ao listar matérias:", err.message);

            return res.status(400).json(
                error(err.message)
            );
        }
    }
}
module.exports = MateriaController;