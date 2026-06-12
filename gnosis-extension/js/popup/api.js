const API_BASE_URL = 'https://gnosis-api.whitesmoke-57ad5be1.eastus.azurecontainerapps.io/api';

async function getToken() {
    const cookie = await chrome.cookies.get({ url: API_BASE_URL, name: 'gnosis_token' });
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

async function fetchTarefas(userId) {
    const token = await getToken();
    const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}/TODOS`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Erro ao buscar tarefas');
    return Array.isArray(payload.data) ? payload.data : [];
}

async function atualizarStatus(tarefa, novoStatus) {
    const token = await getToken();
    const idMaterias = (tarefa.materias || []).map(m => m?.id || m?.idMateria).filter(Boolean);

    const response = await fetch(`${API_BASE_URL}/tarefas/activities/${encodeURIComponent(tarefa.id)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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

    if (!response.ok) throw new Error(`Servidor respondeu com status ${response.status}`);
    return await response.json();
}

async function login(email, senha) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || 'Credenciais invalidas');
    return payload.data;
}

async function salvarSessao(token, usuario) {
    await chrome.cookies.set({ url: API_BASE_URL, name: 'gnosis_token', value: token, path: '/' });
    await chrome.cookies.set({ url: API_BASE_URL, name: 'gnosis_user', value: encodeURIComponent(JSON.stringify(usuario)), path: '/' });
}

async function limparSessao() {
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_token' });
    await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_user' });
    chrome.storage.local.remove(['tarefas_notificadas']);
}
