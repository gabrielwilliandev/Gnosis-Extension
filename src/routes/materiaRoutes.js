const express = require('express');
const MateriaController = require('../controllers/MateriaController.js');

const router = express.Router();

router.post('/', MateriaController.cadastrar);
router.get('/usuario/:idUsuario', MateriaController.listar);

module.exports = router;
