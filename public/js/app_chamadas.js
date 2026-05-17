// Função para carregar os recursos
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

document.addEventListener('DOMContentLoaded', () => {
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

            if (!window.lottie) {
                console.error("Lottie não carregou.");
                return;
            }

            if (animacaoCarregamento) {
                animacaoCarregamento.destroy();
            }

            animacaoCarregamento = lottie.loadAnimation({
                container: lottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: './js/loading.json'
            });

            animacaoCarregamento.addEventListener('data_failed', () => {
                console.error("Erro ao carregar o arquivo loading.json. Verifique o caminho.");
            });
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || "Credenciais inválidas");
            }

            localStorage.setItem('gnosis_token', data.token);
            console.log(data.usuario)
            localStorage.setItem('dados_usuario',  JSON.stringify(data.data.usuario));
            localStorage.setItem('gnosis_user', data.usuario?.nome || "Estudante");

            window.location.href = '/home';

        } catch (error) {
            if (btnText && lottieContainer && animacaoCarregamento && btnEntrar) {
                animacaoCarregamento.destroy();
                animacaoCarregamento = null;
                lottieContainer.classList.add('d-none');
                btnText.classList.remove('d-none');
                btnEntrar.disabled = false;
            }

            alert(error.message);
            console.error('Erro no login:', error);
        }
    });
});

// MONTAR CALENDARIO
let dataAtual = new Date();
let mesAtual = dataAtual.getMonth();
let anoAtual = dataAtual.getFullYear();

document.addEventListener('DOMContentLoaded', () => {montarCalendario(mesAtual, anoAtual);});

document.getElementById('proximo-mes').addEventListener('click', () => {
    mesAtual++;

    if(mesAtual > 11){
        mesAtual = 0;
        anoAtual++;
    }

    montarCalendario(mesAtual, anoAtual);
});

document.getElementById('mes-anterior').addEventListener('click', () => {

    mesAtual--;

    if(mesAtual < 0){
        mesAtual = 11;
        anoAtual--;
    }

    montarCalendario(mesAtual, anoAtual);
});

function montarCalendario(mes, ano){
    const meses = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ];

    const diasCalendario =
        document.getElementById('dias-calendario');

    const campoMesAno =
        document.getElementById('mes-ano');

    campoMesAno.innerText =
        `${meses[mes]} ${ano}`;

    // PRIMEIRO DIA DO MÊS
    const primeiroDia =
        new Date(ano, mes, 1).getDay();

    // QUANTIDADE DE DIAS
    const totalDias =
        new Date(ano, mes + 1, 0).getDate();

    let html = '<tr>';

    // CAMPOS VAZIOS
    for(let i = 0; i < primeiroDia; i++){
        html += '<td></td>';
    }

    let contadorSemana = primeiroDia;

    // DIAS
    for(let dia = 1; dia <= totalDias; dia++){

        html += `
            <td id="dia_${dia}_${mes}_${ano}" data-bs-target="#cadastrar_atividade" data-bs-toggle="modal">
                <span style="font-size: 14px; font-weight: bold;">${dia}</span>
            </td>
        `;

        contadorSemana++;

        if(contadorSemana === 7){

            html += '</tr>';

            if(dia !== totalDias){
                html += '<tr>';
            }

            contadorSemana = 0;
        }
    }

    html += '</tr>';

    diasCalendario.innerHTML = html;
}

// CRIAR ATIVIDADE 
function popup_cadastrar_atividade(dia){
   
}