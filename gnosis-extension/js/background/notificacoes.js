const API_ORIGIN = 'http://localhost:3000';
const API_BASE_URL = `${API_ORIGIN}/api`;

const GATILHOS = [
    { horas: 1,   chave: '1h',  mensagem: 'Falta apenas 1 hora!' },
    { horas: 12,  chave: '12h', mensagem: 'Faltam 12 horas!' },
    { horas: 24,  chave: '1d',  mensagem: 'Falta 1 dia!' },
    { horas: 72,  chave: '3d',  mensagem: 'Faltam 3 dias!' },
    { horas: 168, chave: '1w',  mensagem: 'Falta 1 semana!' },
];

async function getSessao() {
    const [cookieUser, cookieToken] = await Promise.all([
        chrome.cookies.get({ url: API_ORIGIN, name: 'gnosis_user' }),
        chrome.cookies.get({ url: API_ORIGIN, name: 'gnosis_token' })
    ]);

    let userId = null;
    try {
        if (cookieUser?.value) userId = JSON.parse(decodeURIComponent(cookieUser.value))?.id;
    } catch { /* cookie corrompido */ }

    return { userId, token: cookieToken?.value || null };
}

async function buscarPendentes(userId, token) {
    const url = `${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/pendentes?_=${Date.now()}`;
    const response = await fetch(url, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Falha na API');
    return Array.isArray(payload.data) ? payload.data : [];
}

function resolverGatilho(horasRestantes) {
    return GATILHOS.find(g => horasRestantes <= g.horas) || null;
}

function extrairNomesMaterias(valor) {
    if (!valor) return [];
    if (typeof valor === 'string') return [valor];

    if (Array.isArray(valor)) {
        return valor.flatMap(extrairNomesMaterias);
    }

    const nomesDiretos = [
        valor.nome,
        valor.nome_materia,
        valor.materia_nome
    ].filter(Boolean);

    return [
        ...nomesDiretos,
        ...extrairNomesMaterias(valor.materia),
        ...extrairNomesMaterias(valor.materias)
    ];
}

function obterDisciplinaNotificacao(tarefa) {
    const materias = [
        ...extrairNomesMaterias(tarefa.materias),
        ...extrairNomesMaterias(tarefa.tarefas_materias),
        ...extrairNomesMaterias(tarefa.tarefa_materia),
        ...extrairNomesMaterias(tarefa.disciplina),
        ...extrairNomesMaterias(tarefa.materia)
    ].map((nome) => String(nome).trim()).filter(Boolean);

    return [...new Set(materias)].join(', ').toUpperCase() || 'GNOSIS ORACLE';
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
