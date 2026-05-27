// Função para carregar os recursos (SEM DUPLICATA)
function carregarDependencias() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
    document.head.appendChild(link);

    const linkcss = document.createElement('link');
    linkcss.rel = 'stylesheet';
    linkcss.href = './css/default.css';
    document.head.appendChild(linkcss);

    const linkIcons = document.createElement('link');
    linkIcons.rel = 'stylesheet';
    linkIcons.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(linkIcons);

    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = './img/logo_gnosis.png';
    document.head.appendChild(favicon);    
}

carregarDependencias();

const API_BASE_URL = 'http://localhost:3000/api';

// --- INICIALIZAÇÃO DO SISTEMA ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarLogin();
    gerarIconUser();
    carregarMaterias();
    inicializarFormularios();
    inicializarLogout();
    
    if (document.getElementById('dias-calendario')) {
        montarCalendario(mesAtual, anoAtual);
        configurarBotoesCalendario();
    }
});

// --- UTILITÁRIOS ---
function obterCookie(nome) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nome}=`);
    if (partes.length === 2) {
        let dec = decodeURIComponent(partes.pop().split(';').shift());
        // Fallback para recuperar cookies corrompidos/duplicados
        if (dec.startsWith('%')) {
            try { dec = decodeURIComponent(dec); } catch(e){}
        }
        return dec;
    }
    return null;
}

// --- CONTROLE DO LOGIN ---
function inicializarLogin() {
    const form = document.getElementById('form_login');
    if (!form) return;

    const inputEmail = document.querySelector('input[type="email"]') || document.getElementById('email');
    const inputSenha = document.getElementById('login_senha');
    const btnEntrar = document.getElementById('btnEntrar');
    const btnText = document.getElementById('btn-text');
    const lottieContainer = document.getElementById('lottie-login');

    let animacaoCarregamento = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = inputEmail.value.trim();
        const senha = inputSenha.value.trim();

        if (!email || !senha) {
            alert("Por favor, preencha o e-mail e a senha.");
            return;
        }

        if (btnText && lottieContainer && btnEntrar) {
            btnText.classList.add('d-none');
            lottieContainer.classList.remove('d-none');
            btnEntrar.disabled = true;

            if (window.lottie) {
                if (animacaoCarregamento) animacaoCarregamento.destroy();
                animacaoCarregamento = lottie.loadAnimation({
                    container: lottieContainer,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    path: './js/loading.json'
                });
            }
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.erro || data.message || "Credenciais inválidas");


            window.location.href = '/home';

        } catch (error) {
            if (btnText && lottieContainer && btnEntrar) {
                if (animacaoCarregamento) {
                    animacaoCarregamento.destroy();
                    animacaoCarregamento = null;
                }
                lottieContainer.classList.add('d-none');
                btnText.classList.remove('d-none');
                btnEntrar.disabled = false;
            }
            alert(error.message);
            console.error('Erro no login:', error);
        }
    });
}

// --- CONTROLE DE LOGOUT ---
function inicializarLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            // Bate na rota do backend que envia o comando clearCookie()
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Erro de rede ao tentar fazer logout:', error);
        } finally {
            // Independente de erro ou sucesso na API, volta pra home do site (login)
            window.location.href = '/';
        }
    });
}

// --- CONTROLE DO CALENDÁRIO ---
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();

function configurarBotoesCalendario() {
    const btnProximo = document.getElementById('proximo-mes');
    const btnAnterior = document.getElementById('mes-anterior');

    if (btnProximo) {
        btnProximo.addEventListener('click', () => {
            mesAtual++;
            if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
            montarCalendario(mesAtual, anoAtual);
        });
    }

    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            mesAtual--;
            if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
            montarCalendario(mesAtual, anoAtual);
        });
    }
}

function montarCalendario(mes, ano) {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const diasCalendario = document.getElementById('dias-calendario');
    const campoMesAno = document.getElementById('mes-ano');
    if (!diasCalendario || !campoMesAno) return;

    campoMesAno.innerText = `${meses[mes]} ${ano}`;
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    let html = '<tr>';
    for (let i = 0; i < primeiroDia; i++) html += '<td></td>';
    let contadorSemana = primeiroDia;

    for (let dia = 1; dia <= totalDias; dia++) {
        html += `<td id="dia_${dia}_${mes}_${ano}" data-bs-target="#cadastrar_atividade" data-bs-toggle="modal" style="cursor: pointer;"><span style="font-size: 14px; font-weight: bold;">${dia}</span></td>`;
        contadorSemana++;
        if (contadorSemana === 7) {
            html += '</tr>';
            if (dia !== totalDias) html += '<tr>';
            contadorSemana = 0;
        }
    }
    html += '</tr>';
    diasCalendario.innerHTML = html;
}

// --- CONTROLE DOS DADOS NA HOME ---
function gerarIconUser() {
    const cookieDados = obterCookie('gnosis_user');
    if (!cookieDados) return;

    try {
        const usuario = JSON.parse(cookieDados);
        const nome = usuario.nome || 'Estudante';
        const email = usuario.email || 'estudante@gmail.com';
        
        const icon = document.getElementById('icon-user');
        const campo_email = document.getElementById('email-user');
        const campo_nome = document.getElementById('nome-user');
        
        if (icon && campo_nome && campo_email) {
            icon.innerText = nome.charAt(0).toUpperCase();
            campo_nome.innerText = nome;
            campo_email.innerText = email;
        }
    } catch (e) {
        console.error('Erro ao ler dados do usuário do cookie:', e);
    }
}

function carregarMaterias() {
    const select = document.getElementById('select_materia_atividade');
    if (!select) return;

    const cookieDados = obterCookie('gnosis_user');
    if (!cookieDados) {
        console.warn('Sessão ou dados do usuário indisponíveis para carregar matérias.');
        return;
    }

    let usuario;
    try {
        usuario = JSON.parse(cookieDados);
    } catch (e) {
        console.error('Erro ao decodificar os dados do cookie nas matérias:', e);
        return;
    }

    fetch(`${API_BASE_URL}/materias/usuario/${usuario.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            const materias = response.data || [];
            select.innerHTML = '<option value="" selected disabled>Escolha uma matéria</option>';
            materias.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia.idMateria || materia.id;
                option.text = materia.nome;
                select.appendChild(option);
            });
        } else {
            console.error('Erro mapeado pelo servidor:', response.message);
        }
    })
    .catch(err => console.error('Erro de rede ao buscar matérias:', err));
}

function inicializarFormularios() {
    const formMateria = document.getElementById('form_cadastrar_materia');
    if (!formMateria) return;

    formMateria.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cookieDados = obterCookie('gnosis_user');
        if (!cookieDados) {
            alert('Dados do usuário não encontrados. Faça login novamente.');
            return;
        }
        
        let usuario;
        try {
            usuario = JSON.parse(cookieDados);
        } catch (e) {
            return;
        }

        const btnSalvar = document.getElementById('btnSalvarMateria');
        if (btnSalvar) btnSalvar.disabled = true;

        const dadosMateria = {
            nome: document.getElementById('nome_materia').value.trim(),
            cor: document.getElementById('cor_materia').value,
            idUsuario: usuario.id
        };

        if (!dadosMateria.nome) {
            alert('Por favor, informe o nome da matéria.');
            if (btnSalvar) btnSalvar.disabled = false;
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/materias`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosMateria)
            });

            const response = await res.json();

            if (response.success) {
                alert(response.message);
                formMateria.reset();

                const modalElement = document.getElementById('cadastrar_materia');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) modalInstance.hide();
                }

                // Reseta o foco de forma limpa para a modal pai
                setTimeout(() => {
                    const modalAtividade = document.getElementById('cadastrar_atividade');
                    if (modalAtividade) {
                        const instanciaAtividade = bootstrap.Modal.getInstance(modalAtividade) 
                            || new bootstrap.Modal(modalAtividade);
                        instanciaAtividade.show();
                    }
                    carregarMaterias(); 
                }, 400);

            } else {
                alert(`Erro: ${response.message}`);
            }
        } catch (err) {
            console.error('Erro ao cadastrar matéria:', err);
            alert('Erro na comunicação com o servidor.');
        } finally {
            if (btnSalvar) btnSalvar.disabled = false;
        }
    });
}