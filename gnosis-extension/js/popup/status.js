function normalizarStatus(status, data_vencimento) {
    const s = String(status || 'pendente').toLowerCase().trim();
    let statusNorm = 'pendente';

    if (['feita', 'feito', 'concluida', 'concluída', 'done', 'completed', 'finalizada'].includes(s)) {
        statusNorm = 'feita';
    } else if (['nao-feita', 'não feita', 'nao feita', 'nao_feita', 'não_feita', 'incompleta', 'cancelada'].includes(s)) {
        statusNorm = 'nao-feita';
    }

    if (statusNorm === 'pendente' && data_vencimento) {
        const dataTarefa = new Date(data_vencimento);
        if (!Number.isNaN(dataTarefa.getTime())) {
            const hoje = new Date();
            dataTarefa.setHours(0, 0, 0, 0);
            hoje.setHours(0, 0, 0, 0);
            if (dataTarefa < hoje) statusNorm = 'nao-feita';
        }
    }

    return statusNorm;
}

function statusTexto(s) {
    if (s === 'feita') return 'Feito';
    if (s === 'nao-feita') return 'Não Feito';
    return 'Pendente';
}

function statusBadgeClass(s) {
    if (s === 'feita') return 'status-feita';
    if (s === 'nao-feita') return 'status-nao-feita';
    return 'status-pendente';
}

function getStatusIcon(s) {
    if (s === 'feita') return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.97 10.03a.75.75 0 0 0 1.08.02l3.992-4.99a.75.75 0 0 0-1.16-.971L7.58 8.42 5.98 6.82a.75.75 0 1 0-1.06 1.06l2.05 2.05Z"/></svg>`;
    if (s === 'nao-feita') return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.646 4.646a.5.5 0 0 0 0 .708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646a.5.5 0 0 0-.708 0Z"/></svg>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a.5.5 0 0 1 .5.5V2h1a.5.5 0 0 1 0 1h-1v1.5a.5.5 0 0 1-1 0V3H7a.5.5 0 0 1 0-1h1V.5A.5.5 0 0 1 8 0ZM3 8a.5.5 0 0 1 .5-.5H5v-1a.5.5 0 0 1 1 0v1h1.5a.5.5 0 0 1 0 1H6v1a.5.5 0 0 1-1 0v-1H3.5A.5.5 0 0 1 3 8Zm8.5-4a.5.5 0 0 0-1 0v1H9a.5.5 0 0 0 0 1h1.5v1a.5.5 0 0 0 1 0V6H14a.5.5 0 0 0 0-1h-1.5V4Z"/></svg>`;
}