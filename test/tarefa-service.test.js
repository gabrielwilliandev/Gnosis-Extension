const test = require('node:test');
const assert = require('node:assert/strict');

const TarefaService = require('../src/service/TarefaService');
const TarefaRepository = require('../src/repositories/TarefaRepository');
const AppError = require('../src/errors/AppError');
const ValidationError = require('../src/errors/ValidationError');

test('listarPorUsuario exige userId', async () => {
    await assert.rejects(
        () => TarefaService.listarPorUsuario(null),
        (error) => {
            assert.ok(error instanceof ValidationError);
            assert.equal(error.code, 'VALIDATION_ERROR');
            assert.equal(error.details[0].field, 'user_id');
            return true;
        }
    );
});

test('listarPendentes exige userId', async () => {
    await assert.rejects(
        () => TarefaService.listarPendentes(''),
        (error) => {
            assert.ok(error instanceof ValidationError);
            assert.equal(error.message, 'Falha ao listar tarefas pendentes.');
            assert.equal(error.details[0].field, 'user_id');
            return true;
        }
    );
});

test('atualizar bloqueia mudanca de status quando a tarefa esta vencida', async () => {
    const buscarPorIdOriginal = TarefaRepository.buscarPorId;
    TarefaRepository.buscarPorId = async () => ({
        id: 10,
        status: 'Pendente',
        data_vencimento: '2020-01-01',
        hora_vencimento: '10:00'
    });

    try {
        await assert.rejects(
            () => TarefaService.atualizar(10, { status: 'Feita' }),
            (error) => {
                assert.ok(error instanceof AppError);
                assert.equal(error.statusCode, 409);
                assert.equal(error.code, 'TASK_STATUS_LOCKED');
                return true;
            }
        );
    } finally {
        TarefaRepository.buscarPorId = buscarPorIdOriginal;
    }
});
