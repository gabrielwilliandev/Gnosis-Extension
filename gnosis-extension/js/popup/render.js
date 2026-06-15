function obterDisciplina(tarefa) {
    const arr = tarefa.materias || tarefa.tarefas_materias || tarefa.tarefa_materia || [];
    if (Array.isArray(arr) && arr.length > 0) {
        const nomes = arr.map((m) => {
            if (Array.isArray(m)) m = m[0];
            if (typeof m === 'string') return m;
            return m?.nome || m?.materia?.nome || m?.materias?.nome || m?.nome_materia;
        }).filter(Boolean);
        if (nomes.length > 0) return nomes.join(', ');
    }
    return tarefa.disciplina || tarefa.materia || 'Geral';
}

function formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}

function gerarMenuMaterias(tarefasCache, materiasSelecionadas, containerMateriasFiltro, onMudanca) {
    const unicas = new Set(tarefasCache.map(t => obterDisciplina(t).trim()).filter(Boolean));
    containerMateriasFiltro.innerHTML = '';

    if (unicas.size === 0) {
        containerMateriasFiltro.innerHTML = '<span class="text-muted italic">Nenhuma matéria</span>';
        return;
    }

    unicas.forEach((materia) => {
        const checked = materiasSelecionadas.includes(materia) ? 'checked' : '';
        const itemDiv = document.createElement('div');
        itemDiv.className = 'form-check mb-1';
        itemDiv.innerHTML = `
            <input class="form-check-input chk-materia-filtro" type="checkbox" value="${materia}" id="chk-${materia}" ${checked}>
            <label class="form-check-label text-truncate" for="chk-${materia}" style="max-width: 140px; font-size: 0.75rem; user-select: none;">
                ${materia}
            </label>`;

        itemDiv.querySelector('.chk-materia-filtro').addEventListener('change', (e) => {
            onMudanca(materia, e.target.checked);
        });

        containerMateriasFiltro.appendChild(itemDiv);
    });
}

function renderizarCard(t, onAlterarStatus) {
    const dataStr = t.data_vencimento || t.data_entrega || t.dataEntrega || t.data;
    const statusNorm = normalizarStatus(t.status, dataStr, t.hora_vencimento);
    const vencida = estaVencida(dataStr, t.hora_vencimento);
    const statusTitle = vencida ? 'Prazo encerrado: status bloqueado' : 'Clique para alterar o status';
    const statusCursor = vencida ? 'not-allowed' : 'pointer';
    const titulo = t.titulo || t.nome || 'Sem título';

    const card = document.createElement('div');
    card.className = `task-card ${statusNorm}`;
    
    // CORREÇÃO: Adicionado 'w-100 overflow-hidden' no d-flex e 'flex-shrink-0' no status-badge
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2 w-100 overflow-hidden">
            <div class="flex-grow-1" style="min-width: 0;">
                <p class="mb-1 task-meta">
                    <span class="d-inline-flex align-items-center" style="font-weight: 700;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.815 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.815 8.985.936 8 1.783"/>
                        </svg>
                        ${obterDisciplina(t)}
                    </span>
                    <span class="d-inline-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="me-1" viewBox="0 0 16 16">
                          <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                        </svg>
                        ${formatarData(dataStr) || 'Sem data'}
                    </span>
                </p>
                <h6 class="task-title" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${titulo}">${titulo}</h6>
            </div>
            <div class="status-badge flex-shrink-0 ${statusBadgeClass(statusNorm)}" style="cursor:${statusCursor};" title="${statusTitle}">
                ${getStatusIcon(statusNorm)}
                <span>${statusTexto(statusNorm)}</span>
            </div>
        </div>`;

    card.querySelector('.status-badge').addEventListener('click', (e) => {
        e.stopPropagation();
        if (vencida) return;
        onAlterarStatus(t);
    });

    return card;
}

function renderizarTarefas(tarefasCache, filtros, container, onAlterarStatus) {
    const filtradas = aplicarFiltros(tarefasCache, filtros);

    if (!filtradas.length) {
        container.innerHTML = `
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

    container.innerHTML = '';
    filtradas.forEach(t => container.appendChild(renderizarCard(t, onAlterarStatus)));
}
