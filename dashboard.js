// ============================================
// DASHBOARD - dashboard.js
// ============================================

function updateDashboard() {
    // Atualizar cards (dados já carregados na memória dos managers)
    if (document.getElementById('totalAtivos')) {
        document.getElementById('totalAtivos').textContent = window.chamadosManager.getTotalCount?.() || 0;
    }
    if (document.getElementById('ativosEmUso')) {
        document.getElementById('ativosEmUso').textContent = window.ativosManager?.getTotalCount?.() || 0;
    }
    if (document.getElementById('ativosDisponiveis')) {
        document.getElementById('ativosDisponiveis').textContent = window.ativosManager?.getDisponiveisCount?.() || 0;
    }
    if (document.getElementById('chamadosAbertos')) {
        document.getElementById('chamadosAbertos').textContent = window.chamadosManager?.getAbertosCount?.() || 0;
    }

    // Atualizar resumos
    updateSetoresSummary();
    updateChamadosSummary();
    updateCategoriasSummary();
}

function updateSetoresSummary() {
    const setoresEl = document.getElementById('setoresSummary');
    if (!setoresEl || !window.ativosManager) return;

    const setores = window.ativosManager.setores || [];
    const html = setores.map(setor => {
        const count = window.ativosManager.getBySetor(setor)?.length || 0;
        return `
            <div class="summary-item summary-item--link" onclick="navigateToPage('ativos')" title="Ver ativos de ${setor}">
                <span class="summary-label">${setor}</span>
                <span class="summary-value">${count}</span>
            </div>
        `;
    }).join('');

    setoresEl.innerHTML = html;
}

function updateChamadosSummary() {
    const chamadosEl = document.getElementById('chamadosSummary');
    if (!chamadosEl || !window.chamadosManager) return;

    const statuses = [
        { key: 'aberto', label: 'Abertos' },
        { key: 'em_andamento', label: 'Em Andamento' },
        { key: 'aguardando', label: 'Aguardando' },
        { key: 'fechado', label: 'Fechados' }
    ];

    const html = statuses.map(s => {
        const count = window.chamadosManager.getByStatus(s.key) || 0;
        return `
            <div class="summary-item summary-item--link" onclick="navigateToPage('chamados')" title="Ver chamados ${s.label.toLowerCase()}">
                <span class="summary-label">${s.label}</span>
                <span class="summary-value">${count}</span>
            </div>
        `;
    }).join('');

    chamadosEl.innerHTML = html;
}

function updateCategoriasSummary() {
    const categoriasEl = document.getElementById('categoriasSummary');
    if (!categoriasEl || !window.ativosManager) return;

    const categories = ['computador', 'monitor', 'periferico', 'rede_impressora', 'fonte_energia'];
    const labels = {
        'computador': 'Computadores',
        'monitor': 'Monitores',
        'periferico': 'Periféricos',
        'rede_impressora': 'Rede/Impressora',
        'fonte_energia': 'Fonte e Energia'
    };

    const html = categories.map(cat => {
        const count = window.ativosManager.getByCategory(cat) || 0;
        return `
            <div class="summary-item summary-item--link" onclick="navigateToPage('ativos')" title="Ver ${labels[cat]}">
                <span class="summary-label">${labels[cat]}</span>
                <span class="summary-value">${count}</span>
            </div>
        `;
    }).join('');

    categoriasEl.innerHTML = html;
}

// Expor para global scope (chamado de app.js)
window.updateDashboard = updateDashboard;
