function aplicarFiltros(lista, { filtroAtual, filtroPeriodo, materiasSelecionadas, termoBusca }) {
    return lista.filter((t) => {
        const dataStr = t.data_vencimento || t.data_entrega || t.dataEntrega || t.data;
        const statusNorm = normalizarStatus(t.status, dataStr);

        // 1. Filtro por aba
        const passaAba =
            filtroAtual === 'todas' ||
            (filtroAtual === 'pendentes' && statusNorm === 'pendente') ||
            (filtroAtual === 'feitas'    && statusNorm === 'feita') ||
            (filtroAtual === 'nao-feitas' && statusNorm === 'nao-feita');

        if (!passaAba) return false;

        // 2. Filtro por período
        if (filtroPeriodo !== 'todos') {
            if (!dataStr) return false;
            const dTarefa = new Date(dataStr);
            const dHoje = new Date();
            dTarefa.setHours(0, 0, 0, 0);
            dHoje.setHours(0, 0, 0, 0);
            const dias = Math.ceil((dTarefa - dHoje) / (1000 * 60 * 60 * 24));

            if (filtroPeriodo === 'hoje'   && dTarefa.getTime() !== dHoje.getTime()) return false;
            if (filtroPeriodo === 'semana' && (dias < 0 || dias > 7))  return false;
            if (filtroPeriodo === 'mes'    && (dias < 0 || dias > 30)) return false;
        }

        // CORREÇÃO: Reaproveitamos o obterDisciplina do render.js pra garantir igualdade de dados
        const materiasTarefa = obterMaterias(t);
        const disciplinaTarefa = obterDisciplina(t);

        // 3. Filtro por matéria
        if (materiasSelecionadas.length > 0) {
            if (!materiasSelecionadas.some(materia => materiasTarefa.includes(materia))) return false;
        }

        // 4. Busca livre
        if (!termoBusca) return true;

        const texto = [disciplinaTarefa, t.disciplina, t.titulo, t.descricao, t.status]
            .filter(Boolean).join(' ').toLowerCase();

        return texto.includes(termoBusca);
    });
}
