// Define as rotas da api e exporta
const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const authHandler = require('../middlewares/authHandler');

// 1. ROTAS PÚBLICAS (Sem autenticação)

router.post('/login', UsuarioController.login);
router.post('/cadastrar', UsuarioController.cadastrar);
router.post('/refresh', UsuarioController.refresh);
router.post('/logout', UsuarioController.logout);

// 2. MIDDLEWARE DE PROTEÇÃO

router.use(authHandler);

// 3. ROTAS PRIVADAS (Exigem estar logado)

// router.get('/', UsuarioController.listarUsuarios);

module.exports = router;
