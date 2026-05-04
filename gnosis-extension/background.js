const API_BASE_URL = 'http://localhost:3000/api';
const ALARM_NAME = 'checkGnosisTasks';

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Gnosis Oracle] Service Worker instalado e pronto.');
});

chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
    if (mensagem.acao === 'INICIAR_MONITORAMENTO') {
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
        console.log('[Gnosis Oracle] Monitoramento ativado. Alarme configurado.');

        checarTarefasPendentes();
        sendResponse({ status: 'Monitoramento ativado' });
    } else if (mensagem.acao === 'PARAR_MONITORAMENTO') {
        chrome.alarms.clear(ALARM_NAME);
        chrome.storage.local.remove(['tarefas_notificadas']);
        console.log('[Gnosis Oracle] Monitoramento parado.');

        sendResponse({ status: 'Monitoramento parado' });
    }

    return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        checarTarefasPendentes();
    }
});

async function checarTarefasPendentes() {
    try {
        const data = await chrome.storage.local.get(['gnosis_user', 'tarefas_notificadas']);
        const userId = data.gnosis_user?.id;
        let notificadas = data.tarefas_notificadas || [];

        if (!userId) return;

        const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}`);
        const payload = await response.json();

        if (!response.ok || !payload.success) {
            throw new Error(payload.message || 'Falha ao comunicar com a API');
        }

        const tarefas = Array.isArray(payload.data) ? payload.data : [];
        const pendentes = tarefas.filter((t) => {
            const status = String(t.status || '').toLowerCase();
            return !['feita', 'feito', 'concluida', 'concluída', 'done', 'completed'].includes(status);
        });

        pendentes.forEach((tarefa) => {
            if (!notificadas.includes(tarefa.id)) {
                dispararNotificacao(tarefa);
                notificadas.push(tarefa.id);
            }
        });

        await chrome.storage.local.set({ tarefas_notificadas: notificadas });
    } catch (error) {
        console.error('[Gnosis Oracle] Erro no Service Worker:', error);
    }
}

function dispararNotificacao(tarefa) {
    let prazoFormatado = 'Sem prazo definido';
    const dataReferencia = tarefa.data_vencimento || tarefa.data_entrega;

    if (dataReferencia) {
        prazoFormatado = new Date(dataReferencia).toLocaleDateString('pt-BR');
    }

    const disciplina = Array.isArray(tarefa.materias) && tarefa.materias.length > 0
        ? tarefa.materias.map((materia) => materia.nome).filter(Boolean).join(', ').toUpperCase()
        : 'GNOSIS ORACLE';

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: disciplina,
        message: `${tarefa.titulo}\nPrazo: ${prazoFormatado}`,
        priority: 2,
        requireInteraction: true
    });
}
