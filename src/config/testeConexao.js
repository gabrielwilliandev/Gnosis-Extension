const supabase = require('./supabase'); // Conexão padrão, sempre utilizar nos códigos, adapte a pasta

async function testar() {
    console.log("Iniciando teste");
    const {data, error} = await supabase
    .from('materias')
    .select('*');

    if (error){
        console.error('Falha na conexão ou consulta!');
        console.error(error.message);
        return;
    }

    console.log('Conexão bem sucedida!');
    console.log('Retorno do banco: ', data);
    
}
testar();