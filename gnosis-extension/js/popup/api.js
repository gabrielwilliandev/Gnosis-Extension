const API_ORIGIN = 'https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io';
const API_BASE_URL = `${API_ORIGIN}/api`;
const SESSION_COOKIE_NAMES = ['gnosis_token', 'gnosis_user'];

async function getToken() {
    const cookie = await chrome.cookies.get({ url: API_ORIGIN, name: 'gnosis_token' });
    return cookie?.value || null;
}

async function getUsuario() {
    const cookie = await chrome.cookies.get({ url: API_ORIGIN, name: 'gnosis_user' });
    if (!cookie?.value) return null;

    const valores = [cookie.value];

    try {
        valores.push(decodeURIComponent(cookie.value));
    } catch {}

    for (const valor of valores) {
        try {
            return JSON.parse(valor);
        } catch {}
    }

    return null;
}

function obterUsuarioIdDoToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.sub || null;
    } catch {
        return null;
    }
}

async function fetchTarefas(userId) {
    const token = await getToken();
    const url = `${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/TODOS?_=${Date.now()}`;
    const response = await fetch(url, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        }
    });
    const payload = await response.json();
    const materiasCount = response.headers.get('X-Gnosis-Materias-Count');
    const build = response.headers.get('X-Gnosis-Build');
    console.log('[Gnosis Oracle] tarefas carregadas', {
        status: response.status,
        build,
        materiasCount,
        tarefas: Array.isArray(payload.data) ? payload.data.length : 0
    });

    if (!response.ok || !payload.success) throw new Error(payload.message || 'Erro ao buscar tarefas');
    return Array.isArray(payload.data) ? payload.data : [];
}

async function atualizarStatus(tarefa, novoStatus) {
    const token = await getToken();

    const response = await fetch(`${API_BASE_URL}/tarefas/activities/${encodeURIComponent(tarefa.id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            status: novoStatus
        })
    });

    if (!response.ok) throw new Error(`Servidor respondeu com status ${response.status}`);
    return await response.json();
}

async function login(email, senha) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Credenciais invalidas');
    return payload.data;
}

async function salvarSessao(token, usuario) {
    await limparSessao();

    const tokenUserId = obterUsuarioIdDoToken(token);
    const usuarioNormalizado = {
        ...usuario,
        id: tokenUserId || usuario?.id
    };

    await chrome.cookies.set({ url: API_ORIGIN, name: 'gnosis_token', value: token, path: '/' });
    await chrome.cookies.set({ url: API_ORIGIN, name: 'gnosis_user', value: encodeURIComponent(JSON.stringify(usuarioNormalizado)), path: '/' });

    return usuarioNormalizado;
}

async function limparSessao() {
    const cookies = await chrome.cookies.getAll({ domain: 'localhost' });
    await Promise.all(
        cookies
            .filter(cookie => SESSION_COOKIE_NAMES.includes(cookie.name))
            .map(cookie => chrome.cookies.remove({
                url: `${cookie.secure ? 'https' : 'http'}://${cookie.domain.replace(/^\./, '')}${cookie.path}`,
                name: cookie.name
            }))
    );
    await chrome.storage.local.remove(['tarefas_notificadas']);
}
