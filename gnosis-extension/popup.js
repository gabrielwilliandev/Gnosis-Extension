const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Referências DOM - Tela Login
    const viewLogin = document.getElementById('view-login');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');
    const btnConectar = document.getElementById('btnConectar');
<<<<<<< HEAD
=======
    const btnCadastrar = document.getElementById('btnCadastrar');
    
>>>>>>> bc5fa7e (feat: integracao da logo na extensao e animacao lottie no login web)

    // Referências DOM - Tela Tarefas
    const viewTarefas = document.getElementById('view-tarefas');
    const btnSair = document.getElementById('btnSair');
    const btnAtualizar = document.getElementById('btnAtualizar');
    const taskListContainer = document.getElementById('taskListContainer');
    const searchInput = document.getElementById('searchInput');
    const todayText = document.getElementById('todayText');
    const tabs = document.querySelectorAll('.nav-tabs-custom .nav-link');

    // Estado da tela
    let tarefasCache = [];
    let filtroAtual = 'todas';
    let termoBusca = '';

    init();
    atualizarDataHoje();
    configurarEventosFiltro();

    function init() {
        chrome.storage.local.get(['gnosis_token', 'gnosis_user'], (resultado) => {
            if (resultado.gnosis_token) {
                mostrarTelaTarefas(resultado.gnosis_user || 'Estudante');
                buscarTarefas(resultado.gnosis_token);
            } else {
                mostrarTelaLogin();
            }
        });
    }

    function atualizarDataHoje() {
        const hoje = new Date();
        const dia = hoje.getDate();
        const mes = hoje.toLocaleDateString('pt-BR', { month: 'short' })
            .replace('.', '')
            .replace(/^./, letra => letra.toUpperCase());

        todayText.textContent = `Hoje, ${dia.toString().padStart(2, '0')} ${mes}`;
    }

    function configurarEventosFiltro() {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filtroAtual = tab.dataset.filter;
                renderizarTarefas();
            });
        });

        searchInput.addEventListener('input', () => {
            termoBusca = searchInput.value.trim().toLowerCase();
            renderizarTarefas();
        });
    }

    btnConectar.addEventListener('click', async () => {
        const email = inputEmail.value.trim();
        const senha = inputSenha.value.trim();

        if (!email || !senha) return;

        btnConectar.innerHTML = "Conectando...";
        btnConectar.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            if (!response.ok) throw new Error("Credenciais inválidas");

            const data = await response.json();

            const token = data.token;
            const usuarioNome = data.usuario?.nome || "Estudante";

            chrome.storage.local.set({
                'gnosis_token': token,
                'gnosis_user': usuarioNome
            }, () => {
                chrome.runtime.sendMessage({ acao: "INICIAR_MONITORAMENTO", token: token });
                mostrarTelaTarefas(usuarioNome);
                buscarTarefas(token);
            });

        } catch (error) {
            alert("Erro ao conectar. Verifique as credenciais ou se a API está rodando.");
        } finally {
            btnConectar.innerHTML = "Conectar";
            btnConectar.disabled = false;
        }
    });

<<<<<<< HEAD
=======
    btnCadastrar.addEventListener('click', (e) => {
        e.preventDefault();
        
        chrome.tabs.create({ url: "http://localhost:8080/cadastro" });
    });

>>>>>>> bc5fa7e (feat: integracao da logo na extensao e animacao lottie no login web)
    btnSair.addEventListener('click', () => {
        chrome.storage.local.remove(['gnosis_token', 'gnosis_user'], () => {
            chrome.runtime.sendMessage({ acao: "PARAR_MONITORAMENTO" });
            inputEmail.value = '';
            inputSenha.value = '';
            tarefasCache = [];
            filtroAtual = 'todas';
            termoBusca = '';
            searchInput.value = '';

            tabs.forEach(t => t.classList.remove('active'));
            tabs[0].classList.add('active');

            mostrarTelaLogin();
        });
    });

    btnAtualizar.addEventListener('click', () => {
        chrome.storage.local.get(['gnosis_token'], (resultado) => {
            if (resultado.gnosis_token) buscarTarefas(resultado.gnosis_token);
        });
    });

    function mostrarTelaLogin() {
        viewTarefas.classList.add('d-none');
        viewLogin.classList.remove('d-none');
    }

    function mostrarTelaTarefas(nomeUsuario) {
        viewLogin.classList.add('d-none');
        viewTarefas.classList.remove('d-none');

        document.getElementById('userName').innerText = nomeUsuario;
        document.getElementById('userInitials').innerText = nomeUsuario.substring(0, 2).toUpperCase();
    }

    async function buscarTarefas(token) {
        taskListContainer.innerHTML = `
            <div class="text-center mt-5 text-muted small d-flex align-items-center justify-content-center" id="loadingTasks">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stars me-2" viewBox="0 0 16 16">
                    <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
                </svg>
                Buscando estrelas...
            </div>`;

        try {
            const response = await fetch(`${API_BASE_URL}/tarefas`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) btnSair.click();
                throw new Error("Erro ao buscar tarefas");
            }

            const tarefas = await response.json();
            tarefasCache = Array.isArray(tarefas) ? tarefas : [];
            renderizarTarefas();

        } catch (error) {
            taskListContainer.innerHTML = `
                <div class="text-center mt-4 text-danger small">
                    Falha ao carregar a constelação.<br>O servidor está online?
                </div>`;
        }
    }

    function normalizarStatus(status) {
        if (!status) return 'pendente';

        const s = String(status).toLowerCase().trim();

        if (['feita', 'feito', 'concluida', 'concluída', 'done', 'completed'].includes(s)) {
            return 'feita';
        }

        if (['nao-feita', 'não feita', 'nao feita', 'nao_feita', 'não_feita', 'incompleta', 'cancelada'].includes(s)) {
            return 'nao-feita';
        }

        return 'pendente';
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
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.97 10.03a.75.75 0 0 0 1.08.02l3.992-4.99a.75.75 0 0 0-1.16-.971L7.58 8.42 5.98 6.82a.75.75 0 1 0-1.06 1.06l2.05 2.05Z"/>
                </svg>`;
        }

        if (statusNormalizado === 'nao-feita') {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.646 4.646a.5.5 0 0 0 0 .708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646a.5.5 0 0 0-.708 0Z"/>
                </svg>`;
        }

        return `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a.5.5 0 0 1 .5.5V2h1a.5.5 0 0 1 0 1h-1v1.5a.5.5 0 0 1-1 0V3H7a.5.5 0 0 1 0-1h1V.5A.5.5 0 0 1 8 0ZM3 8a.5.5 0 0 1 .5-.5H5v-1a.5.5 0 0 1 1 0v1h1.5a.5.5 0 0 1 0 1H6v1a.5.5 0 0 1-1 0v-1H3.5A.5.5 0 0 1 3 8Zm8.5-4a.5.5 0 0 0-1 0v1H9a.5.5 0 0 0 0 1h1.5v1a.5.5 0 0 0 1 0V6H14a.5.5 0 0 0 0-1h-1.5V4Z"/>
            </svg>`;
    }

    function aplicarFiltros(lista) {
        return lista.filter(t => {
            const statusNormalizado = normalizarStatus(t.status);

            const passaFiltro =
                filtroAtual === 'todas' ||
                (filtroAtual === 'pendentes' && statusNormalizado === 'pendente') ||
                (filtroAtual === 'feitas' && statusNormalizado === 'feita') ||
                (filtroAtual === 'nao-feitas' && statusNormalizado === 'nao-feita');

            if (!passaFiltro) return false;

            if (!termoBusca) return true;

            const texto = [
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

    function formatarData(data) {
        if (!data) return '';
        const d = new Date(data);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
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

        tarefasFiltradas.forEach(t => {
            const statusNormalizado = normalizarStatus(t.status);
            const dataFormatada = formatarData(t.data_entrega || t.dataEntrega || t.data);
            const disciplina = t.disciplina || 'Geral';
            const titulo = t.titulo || t.nome || 'Sem título';

            const cardHTML = `
                <div class="task-card ${statusNormalizado}">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <div class="flex-grow-1">
                            <p class="mb-1 task-meta">
                                <span class="d-inline-flex align-items-center">
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
                                    ${dataFormatada}
                                </span>
                            </p>

                            <h6 class="task-title">
                                ${titulo}
                            </h6>
                        </div>

                        <div class="status-badge ${statusBadgeClass(statusNormalizado)}">
                            ${getStatusIcon(statusNormalizado)}
                            ${statusTexto(statusNormalizado)}
                        </div>
                    </div>
                </div>
            `;

            taskListContainer.innerHTML += cardHTML;
        });
    }
});