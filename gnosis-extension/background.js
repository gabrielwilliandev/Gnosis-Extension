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
        // Declarando a data atual logo no topo do escopo da função
        const agora = new Date();

        // Puxa o token e os dados do usuário usando cookies ao invés do local storage
        const cookieUser = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_user' });
        const cookieToken = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_token' });
        
        const dataStorage = await chrome.storage.local.get(['tarefas_notificadas']);
        let notificadas = dataStorage.tarefas_notificadas || [];

        let userId = null;
        if (cookieUser && cookieUser.value) {
            try {
                const usuario = JSON.parse(decodeURIComponent(cookieUser.value));
                userId = usuario.id;
            } catch (err) { console.error('[Gnosis Oracle] Falha ao ler cookie:', err); }
        }
        const token = cookieToken ? cookieToken.value : null;

        // Se o usuário não estiver logado ou o token sumiu, aborta para evitar erros na API
        if (!userId || !token) {
            console.log('[Gnosis Oracle] Usuário não autenticado ou token ausente. Pulando checagem.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/pendentes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // <-- Vai enviar redondo para o authHandler
                'Content-Type': 'application/json'
            }
        });
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
            const dataReferencia = tarefa.data_vencimento || tarefa.data_entrega;
            if (!dataReferencia) return;

            const prazo = new Date(dataReferencia);
            const diferencaMs = prazo - agora; 

            if (diferencaMs <= 0) return; // Tarefa já venceu

            const mS_EM_HORA = 60 * 60 * 1000;
            const horasRestantes = diferencaMs / mS_EM_HORA;

            // Definição dos gatilhos com base no tempo que falta
            let gatilho = null;
            let mensagemPrazo = '';

            if (horasRestantes <= 1) {
                gatilho = '1h';
                mensagemPrazo = 'Falta apenas 1 hora!';
            } else if (horasRestantes <= 12) {
                gatilho = '12h';
                mensagemPrazo = 'Faltam 12 horas!';
            } else if (horasRestantes <= 24) {
                gatilho = '1d';
                mensagemPrazo = 'Falta 1 dia!';
            } else if (horasRestantes <= 72) {
                gatilho = '3d';
                mensagemPrazo = 'Faltam 3 dias!';
            } else if (horasRestantes <= 168) {
                gatilho = '1w';
                mensagemPrazo = 'Falta 1 semana!';
            }

            if (gatilho) {
                const chaveNotificacao = `${tarefa.id}-${gatilho}`;
                
                // Só notifica se esse gatilho específico ainda não foi disparado para esta tarefa
                if (!notificadas.includes(chaveNotificacao)) {
                    dispararNotificacao(tarefa, mensagemPrazo);
                    notificadas.push(chaveNotificacao);
                }
            }
        });

        await chrome.storage.local.set({ tarefas_notificadas: notificadas });
    } catch (error) {
        console.error('[Gnosis Oracle] Erro no Service Worker:', error);
    }
}

function dispararNotificacao(tarefa, mensagemPrazo) {
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
        message: `${tarefa.titulo}\nPrazo: ${prazoFormatado}\n${mensagemPrazo}`,
        priority: 2,
        requireInteraction: true
    });
}
