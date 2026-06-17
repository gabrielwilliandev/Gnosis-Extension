const GATILHOS = [
    { horas: 1,   chave: '1h',  mensagem: 'Falta apenas 1 hora!' },
    { horas: 12,  chave: '12h', mensagem: 'Faltam 12 horas!' },
    { horas: 24,  chave: '1d',  mensagem: 'Falta 1 dia!' },
    { horas: 72,  chave: '3d',  mensagem: 'Faltam 3 dias!' },
    { horas: 168, chave: '1w',  mensagem: 'Falta 1 semana!' },
];
const TOLERANCIA_GATILHO_HORAS = 2 / 60;
let checagemTarefasPromise = null;
const notificacoesEmitidasNaSessao = new Set();

async function getSessao() {
    const [cookieUser, cookieToken, cookieRefreshToken] = await Promise.all([
        chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_user' }),
        chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_token' }),
        chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_refresh_token' })
    ]);

    let userId = null;
    try {
        if (cookieUser?.value) userId = JSON.parse(decodeURIComponent(cookieUser.value))?.id;
    } catch { /* cookie corrompido */ }

    return {
        userId,
        token: cookieToken?.value || null,
        refreshToken: cookieRefreshToken?.value || null
    };
}

function getCookieExpirationDate(dias) {
    return Math.floor(Date.now() / 1000) + (dias * 24 * 60 * 60);
}

async function salvarTokens(token, refreshToken) {
    await chrome.cookies.set({
        url: API_BASE_URL,
        name: 'gnosis_token',
        value: token,
        path: '/',
        expirationDate: getCookieExpirationDate(1 / 24)
    });

    await chrome.cookies.set({
        url: API_BASE_URL,
        name: 'gnosis_refresh_token',
        value: refreshToken,
        path: '/',
        expirationDate: getCookieExpirationDate(30)
    });
}

async function limparSessaoBackground() {
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_token' });
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_refresh_token' });
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_user' });
    await chrome.storage.local.remove(['tarefas_notificadas']);
    notificacoesEmitidasNaSessao.clear();
    chrome.alarms.clear('checkGnosisTasks');
}

async function renovarSessao(refreshToken) {
    if (!refreshToken) {
        throw new Error('Refresh token ausente');
    }

    const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    const payload = await response.json();

    if (!response.ok || !payload.success || !payload.data?.token || !payload.data?.refreshToken) {
        throw new Error(payload.message || 'Falha ao renovar sessao');
    }

    await salvarTokens(payload.data.token, payload.data.refreshToken);
    return payload.data.token;
}

async function buscarPendentes(userId, token, refreshToken, retry = true) {
    const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/pendentes`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    if (response.status === 401 && retry) {
        const novoToken = await renovarSessao(refreshToken);
        return buscarPendentes(userId, novoToken, null, false);
    }

    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Falha na API');
    return Array.isArray(payload.data) ? payload.data : [];
}

function resolverGatilho(horasRestantes) {
    return GATILHOS.find(g => horasRestantes <= g.horas + TOLERANCIA_GATILHO_HORAS) || null;
}

function obterChavesCompatibilidadeNotificacao(tarefa) {
    const id = String(tarefa.id);
    return [
        id,
        ...GATILHOS.map(gatilho => `${id}-${gatilho.chave}`)
    ];
}

function jaFoiNotificada(chavesNotificacao, notificadas) {
    return chavesNotificacao.some(chave => notificadas.has(chave));
}

function registrarComoNotificada(chavesNotificacao, notificadas) {
    chavesNotificacao.forEach(chave => {
        notificadas.add(chave);
        notificacoesEmitidasNaSessao.add(chave);
    });
}

function montarDataHoraVencimento(tarefa) {
    const dataRef = tarefa.data_vencimento || tarefa.data_entrega;
    if (!dataRef) return null;

    const dataTexto = String(dataRef).slice(0, 10);
    const partesData = dataTexto.split('-').map(Number);
    if (partesData.length !== 3 || partesData.some(Number.isNaN)) return null;

    const [ano, mes, dia] = partesData;
    const horaTexto = tarefa.hora_vencimento || '23:59:59';
    const [hora = 23, minuto = 59, segundo = 59] = String(horaTexto).split(':').map(Number);
    const vencimento = new Date(ano, mes - 1, dia, hora || 0, minuto || 0, segundo || 0);

    return Number.isNaN(vencimento.getTime()) ? null : vencimento;
}

function obterDisciplinaNotificacao(tarefa) {
    const arr = tarefa.materias || tarefa.tarefas_materias || tarefa.tarefa_materia || [];
    if (!Array.isArray(arr) || arr.length === 0) return 'GNOSIS ORACLE';
    return arr.map((m) => {
        if (Array.isArray(m)) m = m[0];
        return m?.nome
            || m?.materia?.nome
            || m?.materias?.nome
            || m?.nome_materia
            || m?.materia_nome
            || m?.nomeMateria
            || m?.disciplina;
    }).filter(Boolean).join(', ').toUpperCase() || 'GNOSIS ORACLE';
}

function dispararNotificacao(tarefa, mensagemPrazo, chaveNotificacao) {
    const dataRef = tarefa.data_vencimento || tarefa.data_entrega;
    const prazoFormatado = dataRef ? new Date(dataRef).toLocaleDateString('pt-BR') : 'Sem prazo definido';

    chrome.notifications.create(chaveNotificacao, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
        title: obterDisciplinaNotificacao(tarefa),
        message: `${tarefa.titulo}\nPrazo: ${prazoFormatado}\n${mensagemPrazo}`,
        priority: 2,
        requireInteraction: true
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('[Gnosis Oracle] Erro ao criar notificacao:', chrome.runtime.lastError.message);
        }
    });
}

async function executarChecagemTarefasPendentes() {
    try {
        const { userId, token, refreshToken } = await getSessao();
        if (!userId || (!token && !refreshToken)) {
            console.log('[Gnosis Oracle] Usuário não autenticado. Pulando checagem.');
            return;
        }

        const agora = new Date();
        const { tarefas_notificadas: notificadas = [] } = await chrome.storage.local.get(['tarefas_notificadas']);

        const STATUS_CONCLUIDO = ['feita', 'feito', 'concluida', 'concluída', 'done', 'completed', 'finalizada'];
        const tokenAtual = token || await renovarSessao(refreshToken);
        const tarefas = await buscarPendentes(userId, tokenAtual, refreshToken);
        const pendentes = tarefas.filter(t => !STATUS_CONCLUIDO.includes(String(t.status || '').toLowerCase()));

        const novasNotificadas = new Set([
            ...notificadas,
            ...notificacoesEmitidasNaSessao
        ]);

        for (const tarefa of pendentes) {
            const vencimento = montarDataHoraVencimento(tarefa);
            if (!vencimento) continue;

            const horasRestantes = (vencimento - agora) / (60 * 60 * 1000);
            if (horasRestantes <= 0) continue;

            const gatilho = resolverGatilho(horasRestantes);
            if (!gatilho) continue;

            const chave = String(tarefa.id);
            const chavesNotificacao = obterChavesCompatibilidadeNotificacao(tarefa);
            if (!jaFoiNotificada(chavesNotificacao, novasNotificadas)) {
                registrarComoNotificada(chavesNotificacao, novasNotificadas);
                await chrome.storage.local.set({ tarefas_notificadas: Array.from(novasNotificadas) });
                dispararNotificacao(tarefa, gatilho.mensagem, chave);
            } else if (!novasNotificadas.has(chave)) {
                registrarComoNotificada(chavesNotificacao, novasNotificadas);
                await chrome.storage.local.set({ tarefas_notificadas: Array.from(novasNotificadas) });
            }
        }

        await chrome.storage.local.set({ tarefas_notificadas: Array.from(novasNotificadas) });
    } catch (error) {
        console.error('[Gnosis Oracle] Erro no Service Worker:', error);
        if (/refresh|sessao|token/i.test(error.message || '')) {
            await limparSessaoBackground();
        }
    }
}

async function checarTarefasPendentes() {
    if (checagemTarefasPromise) {
        return checagemTarefasPromise;
    }

    checagemTarefasPromise = executarChecagemTarefasPendentes()
        .finally(() => {
            checagemTarefasPromise = null;
        });

    return checagemTarefasPromise;
}
