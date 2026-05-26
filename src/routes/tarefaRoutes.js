const express = require('express');
const TarefaController = require('../controllers/TarefaController.js');

const router = express.Router();

// Rota para cadastrar uma tarefa
router.post('/', TarefaController.cadastrar);

// Rota para listar todas as tarefas de um usuário específico
router.get('/usuario/:user_id', TarefaController.listar);
// para extensão, serve para buscar as pentendes
router.get('/usuario/:user_id/pendentes', TarefaController.listarPendentes);
// para atualizar tarefas
router.put('/activities/:id', TarefaController.atualizar);

router.get('/usuario/:user_id/:tarefaId',TarefaController.listarTarefaSelecionada);

router.delete('/activities/:id', TarefaController.deletar);

module.exports = router;