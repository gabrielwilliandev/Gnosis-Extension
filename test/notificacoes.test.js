const test = require('node:test');
const assert = require('node:assert/strict');

const {
    resolverGatilho,
    obterChavesCompatibilidadeNotificacao,
    jaFoiNotificada,
    registrarComoNotificada,
    montarDataHoraVencimento,
    obterDisciplinaNotificacao
} = require('../gnosis-extension/js/background/notificacoes');

test('resolverGatilho encontra o gatilho correto respeitando a tolerancia de 2 minutos', () => {
    assert.equal(resolverGatilho(1.03).chave, '1h');
    assert.equal(resolverGatilho(12).chave, '12h');
    assert.equal(resolverGatilho(169), null);
});

test('deduplicacao considera chave nova e chaves antigas por gatilho', () => {
    const tarefa = { id: 63 };
    const chaves = obterChavesCompatibilidadeNotificacao(tarefa);

    assert.deepEqual(chaves, ['63', '63-1h', '63-12h', '63-1d', '63-3d', '63-1w']);
    assert.equal(jaFoiNotificada(chaves, new Set(['63-1h'])), true);
    assert.equal(jaFoiNotificada(chaves, new Set(['99'])), false);
});

test('registrarComoNotificada grava todas as chaves de compatibilidade', () => {
    const chaves = obterChavesCompatibilidadeNotificacao({ id: 64 });
    const notificadas = new Set();

    registrarComoNotificada(chaves, notificadas);

    assert.equal(notificadas.has('64'), true);
    assert.equal(notificadas.has('64-1h'), true);
    assert.equal(notificadas.has('64-12h'), true);
});

test('montarDataHoraVencimento monta data e hora local da tarefa', () => {
    const vencimento = montarDataHoraVencimento({
        data_vencimento: '2026-06-17',
        hora_vencimento: '12:40'
    });

    assert.equal(vencimento.getFullYear(), 2026);
    assert.equal(vencimento.getMonth(), 5);
    assert.equal(vencimento.getDate(), 17);
    assert.equal(vencimento.getHours(), 12);
    assert.equal(vencimento.getMinutes(), 40);
});

test('obterDisciplinaNotificacao extrai materias em diferentes formatos', () => {
    assert.equal(
        obterDisciplinaNotificacao({
            materias: [{ materia: { nome: 'Arquitetura' } }, { nome_materia: 'Banco de Dados' }]
        }),
        'ARQUITETURA, BANCO DE DADOS'
    );

    assert.equal(obterDisciplinaNotificacao({ materias: [] }), 'GNOSIS ORACLE');
});
