const express = require('express');
const TarefaController = require('../controllers/TarefaController.js');
const authHandler = require('../middlewares/authHandler');

const router = express.Router();

router.use(authHandler);

// criar tarefa
router.post('/', TarefaController.cadastrar);

// pendentes (DEVE vir antes de rotas curingas para evitar conflito de rotas)
router.get('/usuario/:user_id/pendentes', TarefaController.listarPendentes);

// selecionar tarefa específica
router.get(
  '/usuario/tarefaSelecionada/:user_id/:tarefaId',
  TarefaController.listarTarefaSelecionada
);

// listar tarefas por mês/ano (usado pelo calendário, ex: 2026-01)
router.get('/usuario/:user_id/:ano_mes', TarefaController.listar);

// listar tarefas (TUDO ou FILTRADO POR MÊS/STATUS via query)
router.get('/usuario/:user_id', TarefaController.listar);

// atualizar
router.put('/activities/:id', TarefaController.atualizar);

// deletar
router.delete('/activities/:id', TarefaController.deletar);

module.exports = router;