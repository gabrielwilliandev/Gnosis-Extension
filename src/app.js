const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path')
const cors = require('cors')
const cookieParser = require('cookie-parser');

const usuarioRoutes = require('./routes/usuarioRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes')
const materiaRoutes = require('./routes/materiaRoutes');
const authHandler = require('./middlewares/authHandler');
const errorHandler = require('./middlewares/errorHandler');
const env = require('./config/env');
const app = express();
const BUILD_ID = 'materias-hydration-v2';
const APP_VERSION = process.env.APP_VERSION || 'local';

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.set('X-Gnosis-Build', BUILD_ID);
    next();
});


// Ligação com o front end
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/tarefas', tarefaRoutes)
app.use('/api/materias', materiaRoutes);

// Rota de saúde só para garantir que o Express não quebrou ao iniciar
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Servidor no ar!', build: BUILD_ID, version: APP_VERSION });
});

app.get('/api/debug/build', (req, res) => {
    res.status(200).json({
        build: BUILD_ID,
        version: APP_VERSION,
        cwd: process.cwd(),
        appFile: __filename,
        tarefaController: require.resolve('./controllers/TarefaController.js'),
        tarefaService: require.resolve('./service/TarefaService.js'),
        tarefaRepository: require.resolve('./repositories/TarefaRepository.js')
    });
});

app.use('/api', usuarioRoutes);

app.use(errorHandler);

const PORT = env.port; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor de testes rodando na porta ${PORT}`);
    //console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Health Check: http://localhost:${PORT}`);
});

// DEFININDO AS ROTAS DE EXIBIÇÃO DAS PÁGINAS
app.get('/', (req, res) => {
    res.render('index', { title: 'Login' });
});

app.get('/home', authHandler.protegerPagina, (req, res) => {
    res.render('home');
});

module.exports = app;
