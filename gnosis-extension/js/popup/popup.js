document.addEventListener('DOMContentLoaded', () => {
    const viewLogin = document.getElementById('view-login');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');
    const btnConectar = document.getElementById('btnConectar');
    const btnCadastrar = document.getElementById('btnCadastrar');

    const viewTarefas = document.getElementById('view-tarefas');
    const btnSair = document.getElementById('btnSair');
    const btnAtualizar = document.getElementById('btnAtualizar') || document.getElementById('refresh');
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
    let filtroPeriodo = 'todos'; 
    let materiasSelecionadas = []; 

    init();
    configurarEventosFiltro();

    async function init() {
        const usuario = await getUsuario();
        const token = await getToken();

        if (token && usuario && usuario.id) {
            mostrarTelaTarefas(usuario);
            buscarTarefas(usuario.id);
        } else {
            mostrarTelaLogin();
        }
    }

    function configurarEventosFiltro() {
        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                filtroAtual = tab.dataset.filter;
                atualizarView();
            });
        });

        searchInput.addEventListener('input', () => {
            termoBusca = searchInput.value.trim().toLowerCase();
            atualizarView();
        });

        todayPill.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('d-none');
            atualizarEstiloBotaoFiltro();
        });

        filterMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            filterMenu.classList.add('d-none');
        });

        selectPeriodo.addEventListener('change', () => {
            filtroPeriodo = selectPeriodo.value;
            atualizarView();
            atualizarEstiloBotaoFiltro();
        });
    }

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

    async function buscarTarefas(userId) {
        try {
            taskListContainer.innerHTML = `
                <div class="text-center mt-5 text-muted small d-flex align-items-center justify-content-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stars me-2" viewBox="0 0 16 16">
                      <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z"/>
                    </svg>
                    Buscando estrelas...
                </div>`;

            let tarefasbrutas = await fetchTarefas(userId);

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
            
            gerarMenuMaterias(tarefasCache, materiasSelecionadas, containerMateriasFiltro, (materia, checked) => {
                if (checked) {
                    materiasSelecionadas.push(materia);
                } else {
                    materiasSelecionadas = materiasSelecionadas.filter(m => m !== materia);
                }
                atualizarView();
                atualizarEstiloBotaoFiltro();
            });

            atualizarView();
        } catch (error) {
            taskListContainer.innerHTML = `
                <div class="text-center mt-4 text-danger small">
                    Falha ao carregar a constelacao.<br>${error.message || 'Verifique se a API esta online.'}
                </div>`;
        }
    }

    async function handleAlterarStatus(tarefa) {
        try {
            const novoStatus = normalizarStatus(tarefa.status) === 'feita' ? 'Pendente' : 'Finalizada';
            const payload = await atualizarStatus(tarefa, novoStatus);

            if (payload.success) {
                const idx = tarefasCache.findIndex(t => t.id === tarefa.id);
                if (idx !== -1) {
                    tarefasCache[idx].status = novoStatus;
                    atualizarView();
                }
            }
        } catch (err) {
            alert(`Erro ao atualizar: ${err.message}`);
        }
    }

    function atualizarView() {
        const filtrosObj = {
            filtroAtual,
            filtroPeriodo,
            materiasSelecionadas,
            termoBusca
        };
        renderizarTarefas(tarefasCache, filtrosObj, taskListContainer, handleAlterarStatus);
    }

    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', async (e) => {
            e.preventDefault(); 
            btnAtualizar.style.opacity = '0.5';
            
            const usuario = await getUsuario();
            if (usuario?.id) {
                await buscarTarefas(usuario.id);
            }
            btnAtualizar.style.opacity = '1';
        });
    }

    btnSair.addEventListener('click', async () => {
        await limparSessao();
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
        if(tabs.length > 0) tabs[0].classList.add('active');
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
            const data = await login(email, senha);
            const token = data?.token;
            const usuario = data?.usuario;

            const usuarioSessao = await salvarSessao(token, usuario);

            chrome.runtime.sendMessage({ acao: 'INICIAR_MONITORAMENTO', token, userId: usuarioSessao.id });
            mostrarTelaTarefas(usuarioSessao);
            buscarTarefas(usuarioSessao.id);
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
