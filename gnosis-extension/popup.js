const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const viewLogin = document.getElementById('view-login');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');
    const btnConectar = document.getElementById('btnConectar');
    const btnCadastrar = document.getElementById('btnCadastrar');

    const viewTarefas = document.getElementById('view-tarefas');
    const btnSair = document.getElementById('btnSair');
    const btnAtualizar = document.getElementById('btnAtualizar');
    const taskListContainer = document.getElementById('taskListContainer');
    const searchInput = document.getElementById('searchInput');
    const todayPill = document.getElementById('todayPill');
    const todayText = document.getElementById('todayText');
    const filterMenu = document.getElementById('filterMenu');
    const selectPeriodo = document.getElementById('selectPeriodo');
    const containerMateriasFiltro = document.getElementById('containerMateriasFiltro');
    const tabs = document.querySelectorAll('.nav-tabs-custom .nav-link');

    let tarefasCache = [];
    let filtroAtual = 'todas';
    let termoBusca = '';
    
    // Variáveis para o Menu Customizado
    let filtroPeriodo = 'todos'; // 'todos', 'hoje', 'semana', 'mes'
    let materiasSelecionadas = []; // Array de strings com as matérias marcadas

    init();
    configurarEventosFiltro();

    function init() {
        chrome.storage.local.get(['gnosis_token', 'gnosis_user'], (resultado) => {
            const usuario = resultado.gnosis_user;

            if (resultado.gnosis_token && usuario?.id) {
                mostrarTelaTarefas(usuario);
                buscarTarefas(usuario.id);
                return;
            }
            mostrarTelaLogin();
        });
    }

    function configurarEventosFiltro() {
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                filtroAtual = tab.dataset.filter;
                renderizarTarefas();
            });
        });

        searchInput.addEventListener('input', () => {
            termoBusca = searchInput.value.trim().toLowerCase();
            renderizarTarefas();
        });

        // Alternar a exibição do Menu de Filtros
        todayPill.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('d-none');
            atualizarEstiloBotaoFiltro();
        });

        // Impede que cliques dentro do menu fechem ele acidentalmente
        filterMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Fechar o menu se clicar em qualquer outro lugar da tela
        document.addEventListener('click', () => {
            filterMenu.classList.add('d-none');
        });

        // Escutar a mudança do seletor de período (data)
        selectPeriodo.addEventListener('change', () => {
            filtroPeriodo = selectPeriodo.value;
            renderizarTarefas();
            atualizarEstiloBotaoFiltro();
        });
    }

    // Gerenciamento de Telas (Fix do erro de ReferenceError)
    function mostrarTelaLogin() {
        viewTarefas.classList.add('d-none');
        viewLogin.classList.remove('d-none');
    }

    function mostrarTelaTarefas(usuario) {
        viewLogin.classList.add('d-none');
        viewTarefas.classList.remove('d-none');

        const nomeUsuario = usuario?.nome || 'Estudante';
        document.getElementById('userName').innerText = nomeUsuario;
        document.getElementById('userInitials').innerText = nomeUsuario.substring(0, 2).toUpperCase();
    }

    // Altera a cor do botão principal caso tenha filtros selecionados
    function atualizarEstiloBotaoFiltro() {
        const temFiltroAtivo = filtroPeriodo !== 'todos' || materiasSelecionadas.length > 0;
        if (temFiltroAtivo) {
            todayPill.style.backgroundColor = 'var(--gnosis-gold)';
            todayText.textContent = 'Filtrando';
        } else {
            todayPill.style.backgroundColor = 'var(--gnosis-dark)';
            todayText.textContent = 'Filtrar';
        }
    }

    // Mapeia a lista de tarefas recebidas e gera a lista de checkboxes de matérias únicas
    function gerarMenuMaterias() {
        const materiasUnicas = new Set();
        
            tarefasCache.forEach(t => {
            const disc = obterDisciplina(t).trim();
            if (disc) materiasUnicas.add(disc);
        });

        containerMateriasFiltro.innerHTML = '';

        if (materiasUnicas.size === 0) {
            containerMateriasFiltro.innerHTML = '<span class="text-muted italic">Nenhuma matéria</span>';
            return;
        }

        materiasUnicas.forEach(materia => {
            const checked = materiasSelecionadas.includes(materia) ? 'checked' : '';
            const itemDiv = document.createElement('div');
            itemDiv.className = 'form-check mb-1';
            itemDiv.innerHTML = `
                <input class="form-check-input chk-materia-filtro" type="checkbox" value="${materia}" id="chk-${materia}" ${checked}>
                <label class="form-check-label text-truncate" for="chk-${materia}" style="max-width: 140px; font-size: 0.75rem; user-select: none;">
                    ${materia}
                </label>
            `;

            const chk = itemDiv.querySelector('.chk-materia-filtro');
            chk.addEventListener('change', () => {
                if (chk.checked) {
                    materiasSelecionadas.push(materia);
                } else {
                    materiasSelecionadas = materiasSelecionadas.filter(m => m !== materia);
                }
                renderizarTarefas();
                atualizarEstiloBotaoFiltro();
            });

            containerMateriasFiltro.appendChild(itemDiv);
        });
    }

    async function buscarTarefas(userId) {
        // ... mantém a injeção do HTML de loading Tasks aqui ...

        // Puxa o token e faz a requisição protegida
        chrome.storage.local.get(['gnosis_token'], async (resultado) => {
            const token = resultado.gnosis_token;

            try {
                const response = await fetch(`${API_BASE_URL}/tarefas/usuario/${encodeURIComponent(userId)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}` // <-- PROTEÇÃO AQUI
                    }
                });
                const payload = await response.json();

                if (!response.ok || !payload.success) {
                    throw new Error(payload.message || 'Erro ao buscar tarefas');
                }

                let tarefasbrutas = Array.isArray(payload.data) ? payload.data : [];

                tarefasbrutas.sort((a, b) => {
                    const dataA = new Date(a.data_vencimento || a.data_entrega || a.dataEntrega || a.data);
                    const dataB = new Date(b.data_vencimento || b.data_entrega || b.dataEntrega || b.data);
                    const aValida = !Number.isNaN(dataA.getTime());
                    const bValida = !Number.isNaN(dataB.getTime());

                    if (aValida && bValida) return dataA - dataB;
                    if (aValida) return -1;
                    if (bValida) return 1;
                    return 0;
                });

                tarefasCache = tarefasbrutas;
                gerarMenuMaterias(); 
                renderizarTarefas();
            } catch (error) {
                taskListContainer.innerHTML = `
                    <div class="text-center mt-4 text-danger small">
                        Falha ao carregar a constelacao.<br>${error.message || 'Verifique se a API esta online.'}
                    </div>`;
            }
        });
    }

    async function alterarStatusTarefa(id, titulo, descricao, statusAtual) {
        // Transita entre os status oficiais que o backend espera ("Finalizada" e "Pendente")
        const novoStatus = normalizarStatus(statusAtual) === 'feita' ? 'Pendente' : 'Finalizada';

        // Puxa o token de forma assíncrona do storage da extensão
        chrome.storage.local.get(['gnosis_token'], async (resultado) => {
            const token = resultado.gnosis_token;

            try {
                const URL = `${API_BASE_URL}/tarefas/activities/${encodeURIComponent(id)}`;
                const dadosParaAtualizar = {
                    titulo: titulo || 'Sem titulo',
                    descricao: descricao || 'Sem descricao',
                    status: novoStatus
                };

                const response = await fetch(URL, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // <-- PROTEÇÃO AQUI
                    },
                    body: JSON.stringify(dadosParaAtualizar)
                });
                
                if (!response.ok) throw new Error(`Servidor respondeu com status ${response.status}`);
                const payload = await response.json();

                if (payload.success) {
                    const idx = tarefasCache.findIndex(t => t.id === id);
                    if (idx !== -1) {
                        tarefasCache[idx].status = novoStatus;
                        renderizarTarefas();
                    }
                }
            } catch (err) {
                alert(`Uai, deu erro ao atualizar: ${err.message}`);
            }
        });
    }

    function aplicarFiltros(lista) {
        return lista.filter((t) => {
            const dataStr = t.data_vencimento || t.data_entrega || t.dataEntrega || t.data;
            const statusNormalizado = normalizarStatus(t.status, dataStr);

            // 1. Filtro por Aba Superior
            const passaFiltroAba =
                filtroAtual === 'todas' ||
                (filtroAtual === 'pendentes' && statusNormalizado === 'pendente') ||
                (filtroAtual === 'feitas' && statusNormalizado === 'feita') ||
                (filtroAtual === 'nao-feitas' && statusNormalizado === 'nao-feita');

            if (!passaFiltroAba) return false;

            // 2. Filtro Avançado por Período de Tempo
            if (filtroPeriodo !== 'todos') {
                const dataTarefaStr = t.data_vencimento || t.data_entrega || t.dataEntrega || t.data;
                if (!dataTarefaStr) return false;

                const dataTarefa = new Date(dataTarefaStr);
                const hoje = new Date();
                
                const dTarefa = new Date(dataTarefa.getFullYear(), dataTarefa.getMonth(), dataTarefa.getDate());
                const dHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                
                const diferencaTempo = dTarefa - dHoje;
                const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

                if (filtroPeriodo === 'hoje') {
                    if (dTarefa.toLocaleDateString('pt-BR') !== dHoje.toLocaleDateString('pt-BR')) return false;
                } else if (filtroPeriodo === 'semana') {
                    if (diferencaDias < 0 || diferencaDias > 7) return false; 
                } else if (filtroPeriodo === 'mes') {
                    if (diferencaDias < 0 || diferencaDias > 30) return false; 
                }
            }

            // 3. Filtro Avançado por Múltiplas Matérias (Checkboxes)
            if (materiasSelecionadas.length > 0) {
                const disciplinaTarefa = obterDisciplina(t).trim();
                if (!materiasSelecionadas.includes(disciplinaTarefa)) return false;
            }

            // 4. Filtro por Caixa de Texto (Busca livre)
            if (!termoBusca) return true;

            const materiasArray = t.materias || t.tarefas_materias || [];
            const materiaTexto = Array.isArray(materiasArray)
                ? materiasArray.map((m) => m?.nome || m?.materia?.nome).filter(Boolean).join(' ')
                : '';

            const texto = [
                materiaTexto,
                t.disciplina,
                t.titulo,
                t.descricao,
                t.status
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return texto.includes(termoBusca);
        });
    }

    function normalizarStatus(status, data_vencimento) {
        if (!status) status = 'pendente';
        const s = String(status).toLowerCase().trim();
        let statusNorm = 'pendente';

        if (['feita', 'feito', 'concluida', 'concluída', 'done', 'completed', 'finalizada'].includes(s)) {
            statusNorm = 'feita';
        } else if (['nao-feita', 'não feita', 'nao feita', 'nao_feita', 'não_feita', 'incompleta', 'cancelada'].includes(s)) {
            statusNorm = 'nao-feita';
        }

        // Se a tarefa não foi finalizada e já passou do prazo, marca como "Não feita" (atrasada)
        if (statusNorm === 'pendente' && data_vencimento) {
            const dataTarefa = new Date(data_vencimento);
            if (!Number.isNaN(dataTarefa.getTime())) {
                const hoje = new Date();
                dataTarefa.setHours(0, 0, 0, 0);
                hoje.setHours(0, 0, 0, 0);
                if (dataTarefa < hoje) {
                    statusNorm = 'nao-feita';
                }
            }
        }
        
        return statusNorm;
    }

    function statusTexto(statusNormalizado) {
        if (statusNormalizado === 'feita') return 'Feito';
        if (statusNormalizado === 'nao-feita') return 'Não Feito';
        return 'Pendente';
    }

    function statusBadgeClass(statusNormalizado) {
        if (statusNormalizado === 'feita') return 'status-feita';
        if (statusNormalizado === 'nao-feita') return 'status-nao-feita';
        return 'status-pendente';
    }

    function getStatusIcon(statusNormalizado) {
        if (statusNormalizado === 'feita') {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.97 10.03a.75.75 0 0 0 1.08.02l3.992-4.99a.75.75 0 0 0-1.16-.971L7.58 8.42 5.98 6.82a.75.75 0 1 0-1.06 1.06l2.05 2.05Z"/></svg>`;
        }
        if (statusNormalizado === 'nao-feita') {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.646 4.646a.5.5 0 0 0 0 .708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646a.5.5 0 0 0-.708 0Z"/></svg>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0a.5.5 0 0 1 .5.5V2h1a.5.5 0 0 1 0 1h-1v1.5a.5.5 0 0 1-1 0V3H7a.5.5 0 0 1 0-1h1V.5A.5.5 0 0 1 8 0ZM3 8a.5.5 0 0 1 .5-.5H5v-1a.5.5 0 0 1 1 0v1h1.5a.5.5 0 0 1 0 1H6v1a.5.5 0 0 1-1 0v-1H3.5A.5.5 0 0 1 3 8Zm8.5-4a.5.5 0 0 0-1 0v1H9a.5.5 0 0 0 0 1h1.5v1a.5.5 0 0 0 1 0V6H14a.5.5 0 0 0 0-1h-1.5V4Z"/></svg>`;
    }

    function formatarData(data) {
        if (!data) return '';
        const d = new Date(data);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
    }

    function obterDisciplina(tarefa) {
        const materiasArray = tarefa.materias || tarefa.tarefas_materias || [];
        if (Array.isArray(materiasArray) && materiasArray.length > 0) {
            const nomes = materiasArray.map((m) => {
                if (typeof m === 'string') return m;
                return m?.nome || m?.materia?.nome || m?.nome_materia;
            }).filter(Boolean);
            
            if (nomes.length > 0) return nomes.join(', ');
        }
        return tarefa.disciplina || tarefa.materia || 'Geral';
    }

    function renderizarTarefas() {
        const tarefasFiltradas = aplicarFiltros(tarefasCache);

        if (!tarefasFiltradas || tarefasFiltradas.length === 0) {
            taskListContainer.innerHTML = `
                <div class="empty-state">
                    <span class="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M7 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zM2 1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm0 8a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zm.854-3.646a.5.5 0 0 1-.708 0l-1-1a.5.5 0 1 1 .708-.708l.646.647 1.646-1.647a.5.5 0 1 1 .708.708zm0 8a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 .708-.708l.646.647 1.646-1.647a.5.5 0 0 1 .708.708zM7 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zm0-5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0 8a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                        </svg>
                    </span>
                    Nenhuma tarefa encontrada.
                </div>`;
            return;
        }

        taskListContainer.innerHTML = '';

        tarefasFiltradas.forEach((t) => {
            const dataStr = t.data_vencimento || t.data_entrega || t.dataEntrega || t.data;
            const statusNormalizado = normalizarStatus(t.status, dataStr);
            const dataFormatada = formatarData(dataStr);
            const disciplina = obterDisciplina(t);
            const titulo = t.titulo || t.nome || 'Sem título';

            const card = document.createElement('div');
            card.className = `task-card ${statusNormalizado}`;
            
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start gap-2">
                    <div class="flex-grow-1">
                        <p class="mb-1 task-meta">
                            <span class="d-inline-flex align-items-center" style="font-weight: 700;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                  <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.815 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.815 8.985.936 8 1.783"/>
                                </svg>
                                ${disciplina}
                            </span>
                            <span class="d-inline-flex align-items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                                  <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                                </svg>
                                ${dataFormatada || 'Sem data'}
                            </span>
                        </p>
                        <h6 class="task-title">${titulo}</h6>
                    </div>
                    <div class="status-badge ${statusBadgeClass(statusNormalizado)}" style="cursor: pointer;" title="Clique para alterar o status">
                        ${getStatusIcon(statusNormalizado)}
                        <span>${statusTexto(statusNormalizado)}</span>
                    </div>
                </div>
            `;

            const badge = card.querySelector('.status-badge');
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                alterarStatusTarefa(t.id, t.titulo, t.descricao, t.status);
            });

            taskListContainer.appendChild(card);
        });
    }

    btnSair.addEventListener('click', async () => {
        await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_token' });
        await chrome.cookies.remove({ url: API_BASE_URL, name: 'gnosis_user' });
        
        chrome.storage.local.remove(['tarefas_notificadas'], () => {});
        
        chrome.runtime.sendMessage({ acao: 'PARAR_MONITORAMENTO' });
        inputEmail.value = '';
        inputSenha.value = '';
        tarefasCache = [];
        filtroAtual = 'todas';
        termoBusca = '';
        searchInput.value = '';
        filtroPeriodo = 'todos';
        materiasSelecionadas = [];
        selectPeriodo.value = 'todos';
        atualizarEstiloBotaoFiltro();
        tabs.forEach((t) => t.classList.remove('active'));
        tabs[0].classList.add('active');
        mostrarTelaLogin();
    });

    btnConectar.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const senha = inputSenha.value.trim();

        if (!email || !senha) {
            alert('Preencha e-mail e senha para continuar.');
            return;
        }

        btnConectar.innerHTML = 'Conectando...';
        btnConectar.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const payload = await response.json();
            if (!response.ok || !payload.success) throw new Error(payload.message || 'Credenciais invalidas');

            const token = payload.data?.token;
            const usuario = payload.data?.usuario;

            await chrome.cookies.set({ url: API_BASE_URL, name: 'gnosis_token', value: token, path: '/' });
            await chrome.cookies.set({ url: API_BASE_URL, name: 'gnosis_user', value: encodeURIComponent(JSON.stringify(usuario)), path: '/' });

            chrome.runtime.sendMessage({ acao: 'INICIAR_MONITORAMENTO', token, userId: usuario.id });
            mostrarTelaTarefas(usuario);
            buscarTarefas(usuario.id);
        } catch (error) {
            alert(error.message || 'Erro ao conectar.');
        } finally {
            btnConectar.innerHTML = 'Conectar';
            btnConectar.disabled = false;
        }
    });

    btnCadastrar.addEventListener('click', (e) => {
        e.preventDefault();
        const frontendUrl = API_BASE_URL.replace('/api', '/');
        chrome.tabs.create({ url: frontendUrl });
    });
});