const express = require('express');
const MateriaController = require('../controllers/MateriaController.js');
const authHandler = require('../middlewares/authHandler');

const router = express.Router();

router.use(authHandler); // Aplica o middleware de autenticação a todas as rotas deste router

router.post('/', MateriaController.cadastrar);
router.delete('/:idMateria', MateriaController.deletar);
router.get('/usuario/:idUsuario', MateriaController.listar);

module.exports = router;
