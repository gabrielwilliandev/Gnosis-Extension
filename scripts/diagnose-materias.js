require('dotenv').config();

const supabase = require('../src/config/supabase');
const TarefaService = require('../src/service/TarefaService');

const args = process.argv.slice(2);

function lerArg(nome, padrao = null) {
    const indice = args.indexOf(`--${nome}`);
    if (indice === -1) return padrao;
    return args[indice + 1] || padrao;
}

function normalizarMaterias(tarefa) {
    const materias = Array.isArray(tarefa.materias) ? tarefa.materias : [];
    return materias.map((materia) => materia?.nome).filter(Boolean);
}

function agruparRelacoes(relacoes) {
    return (relacoes || []).reduce((mapa, relacao) => {
        const lista = mapa.get(relacao.tarefa_id) || [];
        const nome = relacao.materias?.nome;
        if (nome) lista.push(nome);
        mapa.set(relacao.tarefa_id, lista);
        return mapa;
    }, new Map());
}

function resumirPorTarefa(tarefas, mapaRelacoes = new Map()) {
    return (tarefas || []).map((tarefa) => ({
        id: tarefa.id,
        titulo: tarefa.titulo,
        materiasEsperadas: mapaRelacoes.get(tarefa.id) || [],
        materiasRecebidas: normalizarMaterias(tarefa)
    }));
}

function imprimirResumo(titulo, linhas) {
    console.log(`\n${titulo}`);
    console.table(linhas.map((linha) => ({
        id: linha.id,
        titulo: linha.titulo,
        esperadas: linha.materiasEsperadas.join(', ') || '-',
        recebidas: linha.materiasRecebidas.join(', ') || '-'
    })));
}

async function loginPorApi(apiUrl, email, senha) {
    let response;
    try {
        response = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
    } catch (error) {
        throw new Error(`Nao foi possivel conectar em ${apiUrl}. Inicie a API com "npm run dev" antes de testar via HTTP.`);
    }

    const payload = await response.json();
    if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Falha no login HTTP');
    }

    return {
        token: payload.data?.token,
        userId: payload.data?.usuario?.id
    };
}

async function buscarTarefasHttp(apiUrl, userId, anoMes, token) {
    let response;
    try {
        response = await fetch(`${apiUrl}/tarefas/usuario/${encodeURIComponent(userId)}/${encodeURIComponent(anoMes)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        throw new Error(`Nao foi possivel conectar em ${apiUrl}. Inicie a API com "npm run dev" antes de testar via HTTP.`);
    }

    const payload = await response.json();
    if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Falha ao buscar tarefas via HTTP');
    }

    return payload.data || [];
}

async function buscarBuildHttp(apiUrl) {
    try {
        const response = await fetch(`${apiUrl}/debug/build`);
        if (!response.ok) {
            return { status: response.status, erro: 'Endpoint de build indisponivel' };
        }

        return await response.json();
    } catch (error) {
        return { erro: error.message };
    }
}

function contarMaterias(linhas, campo) {
    return linhas.reduce((total, linha) => total + linha[campo].length, 0);
}

async function main() {
    const apiUrl = lerArg('api', 'http://localhost:3000/api');
    const anoMes = lerArg('anoMes', 'TODOS');
    const email = lerArg('email');
    const senha = lerArg('senha');
    let userId = lerArg('user');
    let token = lerArg('token');

    if ((!userId || !token) && email && senha) {
        const login = await loginPorApi(apiUrl, email, senha);
        userId = userId || login.userId;
        token = token || login.token;
    }

    if (!userId) {
        throw new Error('Informe --user <idUsuario> ou use --email <email> --senha <senha>.');
    }

    const tarefasDiretas = await supabase
        .from('tarefas')
        .select('id,titulo')
        .eq('user_id', userId);

    if (tarefasDiretas.error) throw tarefasDiretas.error;

    const idsTarefas = (tarefasDiretas.data || []).map((tarefa) => tarefa.id);
    const relacoesDiretas = idsTarefas.length > 0
        ? await supabase
            .from('tarefas_materias')
            .select('tarefa_id,materia_id,materias(id,nome)')
            .in('tarefa_id', idsTarefas)
        : { data: [], error: null };

    if (relacoesDiretas.error) throw relacoesDiretas.error;

    const mapaRelacoes = agruparRelacoes(relacoesDiretas.data);
    const serviceData = await TarefaService.listarPorUsuario(userId, anoMes);
    const resumoService = resumirPorTarefa(serviceData, mapaRelacoes);

    console.log('\nDiagnostico de materias vinculadas');
    console.log(`Usuario: ${userId}`);
    console.log(`Periodo: ${anoMes}`);
    console.log(`Tarefas no banco: ${tarefasDiretas.data.length}`);
    console.log(`Relacoes tarefas_materias no banco: ${relacoesDiretas.data.length}`);

    imprimirResumo('Service local', resumoService);

    const serviceEsperadas = contarMaterias(resumoService, 'materiasEsperadas');
    const serviceRecebidas = contarMaterias(resumoService, 'materiasRecebidas');

    if (serviceEsperadas > 0 && serviceRecebidas === 0) {
        throw new Error('O service local perdeu as materias. O problema esta no backend local.');
    }

    if (email && senha) {
        const UsuarioService = require('../src/service/UsuarioService');
        await UsuarioService.login(email, senha);

        const serviceDepoisLogin = await TarefaService.listarPorUsuario(userId, anoMes);
        const resumoDepoisLogin = resumirPorTarefa(serviceDepoisLogin, mapaRelacoes);
        const recebidasDepoisLogin = contarMaterias(resumoDepoisLogin, 'materiasRecebidas');

        imprimirResumo('Service local depois do login', resumoDepoisLogin);

        if (serviceRecebidas > 0 && recebidasDepoisLogin === 0) {
            throw new Error('O login contaminou o client do Supabase e as materias sumiram apos autenticar.');
        }
    }

    if (token) {
        const buildHttp = await buscarBuildHttp(apiUrl);
        console.log('\nBuild da API HTTP');
        console.log(JSON.stringify(buildHttp, null, 2));

        const httpData = await buscarTarefasHttp(apiUrl, userId, anoMes, token);
        const resumoHttp = resumirPorTarefa(httpData, mapaRelacoes);
        imprimirResumo('API HTTP', resumoHttp);

        const httpRecebidas = contarMaterias(resumoHttp, 'materiasRecebidas');
        if (serviceRecebidas > 0 && httpRecebidas === 0) {
            throw new Error('A API HTTP perdeu as materias, mas o service local nao. Confira o Build da API HTTP acima para ver qual pasta/arquivo esta rodando em localhost.');
        }
    } else {
        console.log('\nAPI HTTP nao testada. Informe --token <jwt> ou --email <email> --senha <senha> para comparar com a extensao.');
    }
}

main().catch((error) => {
    console.error(`\nFalha no diagnostico: ${error.message}`);
    process.exit(1);
});
