const express = require('express');
const path = require('path')
const cors = require('cors')

const usuarioRoutes = require('./routes/usuarioRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes')
const materiaRoutes = require('./routes/materiaRoutes');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

app.use(cors());
app.use(express.json());


// Ligação com o front end
app.use(express.static("public"));

app.use('/api/tarefas', tarefaRoutes)
app.use('/api/materias', materiaRoutes);

app.use('/api', usuarioRoutes);

// Rota de saúde só para garantir que o Express não quebrou ao iniciar
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Servidor no ar!' });
});

app.use(errorHandler);

const PORT = 3000; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor de testes rodando na porta ${PORT}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
