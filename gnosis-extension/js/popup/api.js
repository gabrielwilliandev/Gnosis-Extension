class SessaoExpiradaError extends Error {
    constructor(message = 'Sua sessao expirou. Faca login novamente.') {
        super(message);
        this.name = 'SessaoExpiradaError';
    }
}

async function lerPayload(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function tratarSessaoExpirada(message) {
    await limparSessao();
    window.dispatchEvent(new CustomEvent('gnosis:sessao-expirada', {
        detail: { message: message || 'Sua sessao expirou. Faca login novamente.' }
    }));
    throw new SessaoExpiradaError(message);
}

function getCookieExpirationDate(dias) {
    return Math.floor(Date.now() / 1000) + (dias * 24 * 60 * 60);
}

async function getToken() {
    const cookie = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_token' });
    return cookie?.value || null;
}

async function getRefreshToken() {
    const cookie = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_refresh_token' });
    return cookie?.value || null;
}

async function getUsuario() {
    const cookie = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_user' });
    if (!cookie?.value) return null;
    try {
        return JSON.parse(decodeURIComponent(cookie.value));
    } catch {
        return null;
    }
}

async function renovarSessao() {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        await tratarSessaoExpirada('Sua sessao expirou. Faca login novamente.');
    }

    const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });

    const payload = await lerPayload(response);
    if (!response.ok || !payload.success) {
        await tratarSessaoExpirada(payload.message);
    }

    const token = payload.data?.token;
    const novoRefreshToken = payload.data?.refreshToken;
    if (!token || !novoRefreshToken) {
        await tratarSessaoExpirada('Nao foi possivel renovar a sessao.');
    }

    await salvarTokens(token, novoRefreshToken);
    return token;
}

async function fetchAutenticado(url, options = {}, retry = true) {
    const token = await getToken();
    const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status !== 401 || !retry) {
        return response;
    }

    const novoToken = await renovarSessao();
    return fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            'Authorization': `Bearer ${novoToken}`
        }
    });
}

async function fetchTarefas(userId) {
    const response = await fetchAutenticado(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/TODOS`);
    const payload = await lerPayload(response);
    if (response.status === 401) await tratarSessaoExpirada(payload.message);
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Erro ao buscar tarefas');
    return Array.isArray(payload.data) ? payload.data : [];
}

async function atualizarStatus(tarefa, novoStatus) {
    const idMaterias = (tarefa.materias || []).map(m => m?.id || m?.idMateria).filter(Boolean);

    const response = await fetchAutenticado(`${API_BASE_URL}/tarefas/activities/${encodeURIComponent(tarefa.id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            titulo: tarefa.titulo || 'Sem titulo',
            descricao: tarefa.descricao || 'Sem descricao',
            status: novoStatus,
            data_vencimento: tarefa.data_vencimento || tarefa.data_entrega || undefined,
            hora_vencimento: tarefa.hora_vencimento || undefined,
            idMaterias: idMaterias.length > 0 ? idMaterias : undefined
        })
    });

    const payload = await lerPayload(response);
    if (response.status === 401) await tratarSessaoExpirada(payload.message);
    if (!response.ok) throw new Error(payload.message || `Servidor respondeu com status ${response.status}`);
    return payload;
}

async function login(email, senha) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });
    const payload = await lerPayload(response);
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Credenciais invalidas');
    return payload.data;
}

async function salvarTokens(token, refreshToken) {
    if (!token || !refreshToken) {
        throw new Error('Sessao invalida. Faca login novamente.');
    }

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

async function salvarSessao(token, usuario, refreshToken) {
    await salvarTokens(token, refreshToken);
    await chrome.cookies.set({
        url: API_BASE_URL,
        name: 'gnosis_user',
        value: encodeURIComponent(JSON.stringify(usuario)),
        path: '/',
        expirationDate: getCookieExpirationDate(30)
    });
}

async function limparSessao() {
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_token' });
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_refresh_token' });
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_user' });
    chrome.storage.local.remove(['tarefas_notificadas']);
}
