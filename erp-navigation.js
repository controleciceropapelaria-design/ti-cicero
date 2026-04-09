// ============================================
// NAVEGAÇÃO ERP - erp-navigation.js
// ============================================

async function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.dataset.page;
            navigateToPage(pageName);
        });
    });

    // Wait for managers to be initialized
    if (window.chamadosManager && window.ativosManager) {
        chamadosManager.renderChamados();
        ativosManager.renderAtivos();
        await updateDashboard();
    }
}

function navigateToPage(pageName) {
    // Esconder todas as páginas
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });

    // Mostrar a página selecionada
    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.style.display = 'block';

        // Atualizar navegação ativa
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // Atualizar título e descrição da página
        updatePageHeader(pageName);

        // Mostrar botão de novo chamado apenas na página de chamados
        const newCallBtn = document.getElementById('newCallBtn');
        if (newCallBtn) {
            if (pageName === 'chamados') {
                newCallBtn.style.display = 'inline-flex';
                newCallBtn.addEventListener('click', () => chamadosManager.openNovoCallModal());
            } else {
                newCallBtn.style.display = 'none';
            }
        }

        // Inicializar componentes específicos
        if (pageName === 'dashboard') {
            updateDashboard();
        } else if (pageName === 'chamados') {
            chamadosManager.renderChamados();
        } else if (pageName === 'ativos') {
            ativosManager.renderAtivos();
        } else if (pageName === 'estoque') {
            renderEstoque();
        } else if (pageName === 'setores') {
            renderSetores();
        }

        // Dispatch event para outras funções
        document.dispatchEvent(new CustomEvent('pageChanged', { detail: { page: pageName } }));
    }
}

function updatePageHeader(pageName) {
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const titles = {
        'dashboard': {
            title: 'Dashboard',
            subtitle: 'Visão geral do sistema de gerenciamento de ativos'
        },
        'chamados': {
            title: 'Gerenciar Chamados',
            subtitle: 'Abra, acompanhe e responda solicitações de suporte'
        },
        'ativos': {
            title: 'Controle de Ativos',
            subtitle: 'Gerencie todos os equipamentos e periféricos por setor'
        },
        'estoque': {
            title: 'Estoque de Equipamentos',
            subtitle: 'Visualize equipamentos disponíveis para alocação'
        },
        'setores': {
            title: 'Gerenciar Setores',
            subtitle: 'Organize e configure os setores da sua empresa'
        }
    };

    const config = titles[pageName] || titles['dashboard'];
    pageTitle.textContent = config.title;
    pageSubtitle.textContent = config.subtitle;
}

function renderEstoque() {
    const disponivel = ativosManager.ativos.filter(a => a.status === 'disponivel');

    let html = '';
    if (disponivel.length === 0) {
        html = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">Nenhum equipamento disponível</p>';
    } else {
        html = disponivel.map(ativo => `
            <div class="estoque-card">
                <div class="estoque-header">
                    <h3>${ativo.codigo}</h3>
                    <span class="badge-category ${ativo.categoria}">${ativosManager.getCategoryLabel(ativo.categoria)}</span>
                </div>
                <div class="estoque-body">
                    <p><strong>${ativo.descricao}</strong></p>
                    <p>Setor: ${ativo.setor}</p>
                    <p>Valor: R$ ${ativo.valor.toFixed(2)}</p>
                </div>
                <div class="estoque-footer">
                    <button class="btn btn-small btn-primary" onclick="ativosManager.editAtivo('${ativo.id}')">Alocar</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('estoqueContent').innerHTML = html;
}

function renderSetores() {
    const html = ativosManager.setores.map(setor => {
        const total = ativosManager.getBySetor(setor).length;
        const emUso = ativosManager.ativos.filter(a => a.setor === setor && a.status === 'em_uso').length;
        const disponivel = ativosManager.ativos.filter(a => a.setor === setor && a.status === 'disponivel').length;

        return `
            <div class="setor-card">
                <div class="setor-header">
                    <h3>${setor}</h3>
                    <div class="setor-actions">
                        <button class="btn btn-small" onclick="openEditSetorModal('${setor}')">Editar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteSetor('${setor}')">Deletar</button>
                    </div>
                </div>
                <div class="setor-body">
                    <div class="setor-stat">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${total}</span>
                    </div>
                    <div class="setor-stat">
                        <span class="stat-label">Em Uso</span>
                        <span class="stat-value">${emUso}</span>
                    </div>
                    <div class="setor-stat">
                        <span class="stat-label">Disponível</span>
                        <span class="stat-value">${disponivel}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('setoresGrid').innerHTML = html;
}

function openNovoSetorModal() {
    document.getElementById('setorNome').value = '';
    document.getElementById('novoSetorModal').classList.add('show');
}

function closeNovoSetorModal() {
    document.getElementById('novoSetorModal').classList.remove('show');
}

function openEditSetorModal(setor) {
    document.getElementById('setorNomeEdit').value = setor;
    document.getElementById('editarSetorModal').dataset.oldName = setor;
    document.getElementById('editarSetorModal').classList.add('show');
}

function closeEditSetorModal() {
    document.getElementById('editarSetorModal').classList.remove('show');
    delete document.getElementById('editarSetorModal').dataset.oldName;
}

async function submitNovoSetor(e) {
    e.preventDefault();
    const nome = document.getElementById('setorNome').value.trim();
    if (!nome) return;

    const success = await ativosManager.addSetor(nome);
    if (success) {
        closeNovoSetorModal();
        await ativosManager.populateSetorSelect();
        renderSetores();
        alert(`✅ Setor '${nome}' criado com sucesso!`);
    } else {
        alert('❌ Erro ao criar setor. Verifique se já existe um com este nome.');
    }
}

async function submitEditSetor(e) {
    e.preventDefault();
    const oldName = document.getElementById('editarSetorModal').dataset.oldName;
    const newName = document.getElementById('setorNomeEdit').value.trim();
    if (!newName || !oldName) return;

    const success = await ativosManager.editSetor(oldName, newName);
    if (success) {
        closeEditSetorModal();
        await ativosManager.populateSetorSelect();
        renderSetores();
        alert(`✅ Setor renomeado para '${newName}'!`);
    } else {
        alert('❌ Erro ao editar setor.');
    }
}

async function deleteSetor(setor) {
    if (!confirm(`Tem certeza que deseja deletar o setor '${setor}'?`)) return;

    const result = await ativosManager.deleteSetor(setor);
    if (result.success) {
        await ativosManager.populateSetorSelect();
        renderSetores();
        alert('✅ ' + result.message);
    } else {
        alert('❌ ' + result.message);
    }
}

// Expor funções para global scope
window.setupNavigation = setupNavigation;
window.navigateToPage = navigateToPage;
window.openNovoSetorModal = openNovoSetorModal;
window.closeNovoSetorModal = closeNovoSetorModal;
window.openEditSetorModal = openEditSetorModal;
window.closeEditSetorModal = closeEditSetorModal;
window.submitNovoSetor = submitNovoSetor;
window.submitEditSetor = submitEditSetor;
window.deleteSetor = deleteSetor;
