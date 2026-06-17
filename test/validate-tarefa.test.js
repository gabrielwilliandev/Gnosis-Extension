const test = require('node:test');
const assert = require('node:assert/strict');

const Validar = require('../src/validate/ValidateTarefa');
const ValidationError = require('../src/errors/ValidationError');

function dataFutura(dias = 1) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().slice(0, 10);
}

function dataPassada(dias = 1) {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    return data.toISOString().slice(0, 10);
}

test('valida uma tarefa com titulo, data futura e hora no formato correto', () => {
    const resultado = Validar.validartarefa({
        titulo: 'Estudar arquitetura',
        data_vencimento: dataFutura(),
        hora_vencimento: '11:40'
    });

    assert.equal(resultado, true);
});

test('rejeita tarefa sem titulo, sem data e sem hora', () => {
    assert.throws(
        () => Validar.validartarefa({
            titulo: ' ',
            data_vencimento: '',
            hora_vencimento: ''
        }),
        (error) => {
            assert.ok(error instanceof ValidationError);
            assert.equal(error.message, 'Falha no cadastro da atividade');
            assert.deepEqual(
                error.details.map((detail) => detail.field),
                ['Titulo', 'Data', 'Hora']
            );
            return true;
        }
    );
});

test('rejeita tarefa com data no passado e hora invalida', () => {
    assert.throws(
        () => Validar.validartarefa({
            titulo: 'Atividade antiga',
            data_vencimento: dataPassada(),
            hora_vencimento: '25:99'
        }),
        (error) => {
            assert.ok(error instanceof ValidationError);
            assert.deepEqual(
                error.details.map((detail) => detail.field),
                ['Data', 'Hora']
            );
            return true;
        }
    );
});
