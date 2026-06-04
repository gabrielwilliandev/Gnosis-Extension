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
    cadastrar_atividade();
    
    if (document.getElementById('dias-calendario')) {
        montarCalendario(mesAtual, anoAtual);
        configurarBotoesCalendario();
    }
}); 

// =========================================================================================================
//                                             AUTENTICAÇÃO
// =========================================================================================================
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

// =========================================================================================================
//                                             CALENDÁRIO
// =========================================================================================================
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
    const mesF = add_zero(mes + 1);
    for (let dia = 1; dia <= totalDias; dia++) {
        const diaF = add_zero(dia);        
        let data_vencimento = `${ano}-${mesF}-${diaF}`;
        let hoje = new Date();
        let vencimento = new Date(data_vencimento);
        const diferencaDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
        let html_habilitado = '';
        let background = `background-color: rgba(139, 139, 139, 0.2);`;
        if (diferencaDias >= 0){
            html_habilitado = `onclick="exibir_cadastrar_atividade('${data_vencimento}');"`;
            background = '';
        }
        html += `<td id="td_${data_vencimento}"  ${html_habilitado} data-bs-toggle="modal" style="cursor: pointer; ${background}"><span style="font-size: 14px; font-weight: bold;">${dia} <p id="qtd_tarefas_${data_vencimento}" onclick="exibir_tarefas(${data_vencimento});"></p></span></td>`;


        contadorSemana++;
        if (contadorSemana === 7) {
            html += '</tr>';
            if (dia !== totalDias) html += '<tr>';
            contadorSemana = 0;
        }
    }
    html += '</tr>';
    const ano_mes = `${ano}-${mesF}`; // 2026-01
    diasCalendario.innerHTML = html;
    listar_atividades(ano_mes);
}

// =========================================================================================================
//                                             ATIVIDADE
// =========================================================================================================
 
// PARA EXIBIR A DATA NO CAMPO - CADASTRAR ATIVIDADE
function add_zero(valor) {
    valor = String(valor);
    if (valor.length < 2) {
        return '0' + valor;
    }

    return valor;
}

function exibir_cadastrar_atividade(data){
    
    const meuModal = new bootstrap.Modal('#cadastrar_atividade'); 
    if(data != ''){        
        console.log(data); // 2026-01-01                       
        $('#data_vencimento_cadastrar_atividade').val(data);   
        $('#data_vencimento_cadastrar_atividade').prop('disabled', true); // Desabilitando o campo
    } else {
        $('#data_vencimento_cadastrar_atividade').val('');
        $('#data_vencimento_cadastrar_atividade').prop('disabled', false);
    }
    meuModal.show();
}

function cadastrar_atividade(){
    const formAtividade = document.getElementById('form_cadastrar_atividade');    
      
    // PRECISA FAZER A VERIFICAÇÃO DOS CAMPOS EM BRANCO
    formAtividade.addEventListener('submit', async (e) => { 
        const modal = new bootstrap.Modal('#cadastrar_atividade');            
        e.preventDefault(); // Não carregar a página
        const cookieDados = obterCookie('gnosis_user');
        
        if(!cookieDados){        
            alert('Dados do usuário não encontrados. Faça login novamente.');
            return;
        }
        let usuario = [];
        try {
            usuario = JSON.parse(cookieDados); // Pegando os dados do usuário pelo cookie
        } catch(e){
            return; // Se não conseguir pegar os dados do usário, cancela a requisição
        }
        
        const materia = parseInt($('#idMaterias_cadastrar_atividade').val());
        // Recuperando dados do formulario
        const dados = {
            titulo: $('#titulo_cadastrar_atividade').val(),
            descricao: $('#descricao_cadastrar_atividade').val(),
            data_vencimento: $('#data_vencimento_cadastrar_atividade').val(),
            hora_vencimento: $('#hora_vencimento_cadastrar_atividade').val(),
            idUsuario: usuario.id,
            idMaterias: [materia]
        };                 

        try{        
            const res = await fetch(`${API_BASE_URL}/tarefas`, {                
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            const response = await res.json();
            
            if (response.success) {
                alert(response.message);
                formAtividade.reset();                
                
                // ATUALIZA O CALENDÁRIO
                const mes_ano = $('#mes-ano').html(); // pegando o conteudo do html
                const [mesTexto, ano] = mes_ano.split(' '); // quebrando a string para array
                const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                const index = meses.indexOf(mesTexto);
                let mes;
                if(index !== -1){
                    mes = index;
                } else {
                    mes = 0;
                }
                montarCalendario(mes, ano);
                modal.hide();
            } else {
                alert(`Erro: ${response.message}`);
            }
        } catch (err) {
            console.error('Erro ao cadastrar atividade:', err);
            alert('Erro na comunicação com o servidor.');
        }
    });
    $('#titulo_cadastrar_atividade').val('');
    $('#descricao_cadastrar_atividade').val('');
    $('#hora_vencimento_cadastrar_atividade').val('');
    $('#idMaterias_cadastrar_atividade').val('');
    $('#btn_cadastrar_atividade').prop('disabled', false);
}

function listar_atividades(mes_ano){
    const cookieDados = obterCookie('gnosis_user');
    if (!cookieDados) {
        console.warn('Sessão ou dados do usuário indisponíveis para listar atividades.');
        return;
    }
    let usuario = [];
    try {
        usuario = JSON.parse(cookieDados); // Pegando os dados do usuário pelo cookie
    } catch(e){
        return; // Se não conseguir pegar os dados do usário, cancela a requisição
    }
    
    // PRECISA PEGAR AS ATIVIDADES QUE ESTÃO CADASTRADAS PELO USUÁRIO (PRECISO CRIAR UM NOVO ENDPOINT OU ALTERAR PARA PEGAR APENAS DO ANO E MES DO CALENDARIO SELECIONADO)
    fetch(`${API_BASE_URL}/tarefas/usuario/${usuario.id}/${mes_ano}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {            
            const tarefas = response.data || [];  // VEIO OS DADOS EM JSON ESPECIFICO PARA O MES E ANO
            let tarefasPorDia = {};
           
            if (tarefas){
                tarefas.forEach(t => {
                    // BUSCAR O TD - EX: td_${ano}-${mes}-${diaF}         
                    const data_vencimento = t.data_vencimento.split('T')[0];       
                    const td_dia = $(`#td_${data_vencimento}`);
                    
                    let cor;
                    let texto_cor;
                    const vencimento = new Date(data_vencimento);
                    const hoje = new Date();

                    const diferencaDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));    

                    if (diferencaDias > 5) {
                        cor = 'rgba(52, 199, 89, 0.20)';
                        texto_cor = '#1a7a35';
                    } else if (diferencaDias < 0) {
                        cor = 'rgba(255, 59, 48, 0.20)';
                        texto_cor = '#9b1c1c';
                    } else if (diferencaDias <= 1) {
                        cor = 'rgba(255, 149, 0, 0.25)';
                        texto_cor = '#7d4e00'
                    } else {
                        cor = 'rgba(255, 204, 0, 0.25)';
                        texto_cor = '#856404';
                    }              
                    
                    let hora = t.hora_vencimento.replace(/:/g, '-'); // tarefa_2026-06-26T00:00:00_19-39-00
                    let idTarefa = `tarefa_${data_vencimento}_${hora}`; // tarefa_2026-01-01_12-30               

                    // INSTANCIANDO O OBJETO
                    if(!tarefasPorDia[data_vencimento]){
                        tarefasPorDia[data_vencimento] = {}
                    }

                    tarefasPorDia[data_vencimento][t.id] = {
                        titulo: t.titulo,
                        background_cor: cor,
                        cor_texto: texto_cor
                    }

                    // VERIFICANDO QUANTAS ATIVIDADES TEM NO DIA
                    let qtd = Object.keys(tarefasPorDia[data_vencimento]).length;
                    if (qtd <= 2){ 
                        td_dia.append(`<span class="atividades_${data_vencimento}" onclick="exibir_atividade(event, ${t.id});"  style="z-index: 1; display: block;width: calc(100% - 8px);margin: 2px 4px;padding: 3px 6px;border-radius: 6px;background-color: ${cor};color: ${texto_cor};font-size: 12px;font-weight: 500;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;cursor: pointer;" >${t.titulo}</span>`);
                    }
                    // Exibindo a quantidade de tarefas por dia
                    const campo_qtd_tarefas_dias = document.getElementById(`qtd_tarefas_${data_vencimento}`);
                    if (campo_qtd_tarefas_dias) {
                        campo_qtd_tarefas_dias.innerHTML = qtd;
                    }
                });         
            }                        
        } else {
            console.error('Erro mapeado pelo servidor:', response.message);
        }
    })
    .catch(err => console.error('Erro de rede ao buscar matérias:', err));
}
// lucas
function exibir_atividade(event, tarefa_id){
    // EXIBIR A MODAL DA ATIVIDADE
    event.stopPropagation(); // Serve para não exutar a função do td, que esta englobando a ficha de atividade

    // PRECISO BUSCAR OS DADOS DA ATIVIDADE E PREENCHER OS CAMPOS
    const cookieDados = obterCookie('gnosis_user');
    if (!cookieDados) {
        console.warn('Sessão ou dados do usuário indisponíveis para listar atividades.');
        return;
    }
    let usuario = [];
    try {
        usuario = JSON.parse(cookieDados); // Pegando os dados do usuário pelo cookie
    } catch(e){
        return; // Se não conseguir pegar os dados do usário, cancela a requisição
    } fetch(`${API_BASE_URL}/tarefas/usuario/tarefaSelecionada/${usuario.id}/${tarefa_id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            const modal = new bootstrap.Modal('#editar_atividade');    
            modal.show();
        } else {

        }
    });



    
}
// =========================================================================================================
//                                             CONTROLE DE DADOS - HOME
// =========================================================================================================
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

// =========================================================================================================
//                                             MATÉRIA
// =========================================================================================================

function exibir_cadastrar_materia(){ 
    const modal = new bootstrap.Modal('#cadastrar_materia');
    modal.show();
}

function carregarMaterias() {
    const select = document.getElementById('idMaterias_cadastrar_atividade');
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