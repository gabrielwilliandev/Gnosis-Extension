const API_BASE_URL = 'https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api';

const GATILHOS = [
    { horas: 1,   chave: '1h',  mensagem: 'Falta apenas 1 hora!' },
    { horas: 12,  chave: '12h', mensagem: 'Faltam 12 horas!' },
    { horas: 24,  chave: '1d',  mensagem: 'Falta 1 dia!' },
    { horas: 72,  chave: '3d',  mensagem: 'Faltam 3 dias!' },
    { horas: 168, chave: '1w',  mensagem: 'Falta 1 semana!' },
];

async function getSessao() {
    const [cookieUser, cookieToken] = await Promise.all([
        chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_user' }),
        chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_token' })
    ]);

    let userId = null;
    try {
        if (cookieUser?.value) userId = JSON.parse(decodeURIComponent(cookieUser.value))?.id;
    } catch { /* cookie corrompido */ }

    return { userId, token: cookieToken?.value || null };
}

async function buscarPendentes(userId, token) {
    const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/pendentes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Falha na API');
    return Array.isArray(payload.data) ? payload.data : [];
}

function resolverGatilho(horasRestantes) {
    return GATILHOS.find(g => horasRestantes <= g.horas) || null;
}

function obterDisciplinaNotificacao(tarefa) {
    const arr = tarefa.materias || tarefa.tarefas_materias || tarefa.tarefa_materia || [];
    if (!Array.isArray(arr) || arr.length === 0) return 'GNOSIS ORACLE';
    return arr.map((m) => {
        if (Array.isArray(m)) m = m[0];
        return m?.nome || m?.materia?.nome || m?.materias?.nome || m?.nome_materia;
    }).filter(Boolean).join(', ').toUpperCase() || 'GNOSIS ORACLE';
}

function dispararNotificacao(tarefa, mensagemPrazo) {
    const dataRef = tarefa.data_vencimento || tarefa.data_entrega;
    const prazoFormatado = dataRef ? new Date(dataRef).toLocaleDateString('pt-BR') : 'Sem prazo definido';

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: obterDisciplinaNotificacao(tarefa),
        message: `${tarefa.titulo}\nPrazo: ${prazoFormatado}\n${mensagemPrazo}`,
        priority: 2,
        requireInteraction: true
    });
}

async function checarTarefasPendentes() {
    try {
        const { userId, token } = await getSessao();
        if (!userId || !token) {
            console.log('[Gnosis Oracle] Usuário não autenticado. Pulando checagem.');
            return;
        }

        const agora = new Date();
        const { tarefas_notificadas: notificadas = [] } = await chrome.storage.local.get(['tarefas_notificadas']);

        const STATUS_CONCLUIDO = ['feita', 'feito', 'concluida', 'concluída', 'done', 'completed', 'finalizada'];
        const tarefas = await buscarPendentes(userId, token);
        const pendentes = tarefas.filter(t => !STATUS_CONCLUIDO.includes(String(t.status || '').toLowerCase()));

        const novasNotificadas = [...notificadas];

        pendentes.forEach((tarefa) => {
            const dataRef = tarefa.data_vencimento || tarefa.data_entrega;
            if (!dataRef) return;

            const horasRestantes = (new Date(dataRef) - agora) / (60 * 60 * 1000);
            if (horasRestantes <= 0) return;

            const gatilho = resolverGatilho(horasRestantes);
            if (!gatilho) return;

            const chave = `${tarefa.id}-${gatilho.chave}`;
            if (!novasNotificadas.includes(chave)) {
                dispararNotificacao(tarefa, gatilho.mensagem);
                novasNotificadas.push(chave);
            }
        });

        await chrome.storage.local.set({ tarefas_notificadas: novasNotificadas });
    } catch (error) {
        console.error('[Gnosis Oracle] Erro no Service Worker:', error);
    }
}
