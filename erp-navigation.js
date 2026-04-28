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
        } else if (pageName === 'funcionarios') {
            funcionariosManager.renderFuncionarios();
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
        },
        'funcionarios': {
            title: 'Funcionários',
            subtitle: 'Gerencie funcionários e controle os ativos atribuídos a cada um'
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
        const total      = ativosManager.getBySetor(setor).length;
        const emUso      = ativosManager.ativos.filter(a => a.setor === setor && a.status === 'em_uso').length;
        const disponivel = ativosManager.ativos.filter(a => a.setor === setor && a.status === 'disponivel').length;
        const funcs      = (window.funcionariosManager?.funcionarios || []).filter(f => f.setor === setor).length;

        return `
            <div class="setor-card setor-card-clicavel" onclick="abrirSetorDetalhes('${setor.replace(/'/g, "\\'")}')">
                <div class="setor-header">
                    <h3>${setor}</h3>
                    <div class="setor-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-small" onclick="openEditSetorModal('${setor.replace(/'/g, "\\'")}')">Editar</button>
                        <button class="btn btn-danger btn-small" onclick="deleteSetor('${setor.replace(/'/g, "\\'")}')">Deletar</button>
                    </div>
                </div>
                <div class="setor-body">
                    <div class="setor-stat">
                        <span class="stat-label">Funcionários</span>
                        <span class="stat-value">${funcs}</span>
                    </div>
                    <div class="setor-stat">
                        <span class="stat-label">Ativos Total</span>
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

// ============================================
// DETALHES DO SETOR
// ============================================

let _setorAtual = null;

async function abrirSetorDetalhes(setor) {
    _setorAtual = setor;
    document.getElementById('setorDetalhesTitle').textContent = setor;
    setorAba('funcionarios', document.querySelector('.setor-tab'));
    document.getElementById('setorDetalhesModal').classList.add('show');
    await renderSetorFuncionarios(setor);
    await renderSetorSistemas(setor);
    // Listener do form de novo sistema
    const form = document.getElementById('novoSistemaForm');
    form.onsubmit = (e) => submitNovoSistema(e, setor);
}

function fecharSetorDetalhes() {
    document.getElementById('setorDetalhesModal').classList.remove('show');
    _setorAtual = null;
}

function setorAba(aba, btn) {
    document.getElementById('setorAbaFuncionarios').style.display = aba === 'funcionarios' ? 'block' : 'none';
    document.getElementById('setorAbaSistemas').style.display     = aba === 'sistemas'      ? 'block' : 'none';
    document.querySelectorAll('.setor-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

async function renderSetorFuncionarios(setor) {
    const funcs = (window.funcionariosManager?.funcionarios || []).filter(f => f.setor === setor);
    const afAll = window.funcionariosManager?.ativos_funcionarios || [];
    const ativos = window.ativosManager?.ativos || [];
    const el = document.getElementById('setorFuncionariosLista');

    if (funcs.length === 0) {
        el.innerHTML = '<p style="color:var(--text-muted);padding:var(--spacing-lg);">Nenhum funcionário neste setor.</p>';
        return;
    }

    el.innerHTML = funcs.map(f => {
        const atribAll = afAll.filter(af => af.funcionario_id === f.id);
        const emUso    = atribAll.filter(af => af.status === 'em_uso');
        const pendente = atribAll.filter(af => af.status === 'pendente');

        const ativosHtml = emUso.length === 0 && pendente.length === 0
            ? '<p style="color:var(--text-muted);font-size:0.8rem;margin:0;">Sem ativos atribuídos.</p>'
            : [...emUso, ...pendente].map(af => {
                const a = ativos.find(x => x.id === af.ativo_id);
                const badge = af.status === 'em_uso'
                    ? '<span style="font-size:0.7rem;background:rgba(168,85,247,0.15);color:#d8b4fe;padding:2px 6px;border-radius:4px;">Em Uso</span>'
                    : '<span style="font-size:0.7rem;background:rgba(245,158,11,0.15);color:#fcd34d;padding:2px 6px;border-radius:4px;">Pendente</span>';
                return `<div class="setor-ativo-item">
                    <span class="ativo-codigo">${a?.codigo || '—'}</span>
                    <span class="ativo-desc">${a?.descricao || '—'}</span>
                    ${badge}
                </div>`;
            }).join('');

        return `
            <div class="setor-func-card">
                <div class="setor-func-header">
                    <div class="funcionario-avatar" style="width:32px;height:32px;font-size:0.85rem;">${f.nome.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="funcionario-name" style="font-size:0.9rem;">${f.nome}</div>
                        <div class="funcionario-cargo">${f.cargo || '—'}</div>
                    </div>
                    <div style="margin-left:auto;display:flex;gap:var(--spacing-xs);">
                        <span class="stat-count" style="font-size:0.85rem;color:var(--purple);">${emUso.length}</span>
                        <span class="stat-label" style="font-size:0.75rem;align-self:center;">em uso</span>
                    </div>
                </div>
                <div class="setor-ativos-lista">${ativosHtml}</div>
            </div>
        `;
    }).join('');
}

async function renderSetorSistemas(setor) {
    const { data } = await (await import('./supabase-config.js')).supabase
        .from('setor_sistemas')
        .select('*')
        .eq('setor', setor)
        .order('nome');

    const el = document.getElementById('setorSistemasLista');
    const sistemas = data || [];

    if (sistemas.length === 0) {
        el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Nenhum sistema cadastrado para este setor.</p>';
        return;
    }

    const tipoLabel = { sistema:'Sistema', aplicativo:'Aplicativo', ferramenta:'Ferramenta', navegador:'Navegador', antivirus:'Antivírus', outro:'Outro' };
    const tipoColor = { sistema:'var(--blue)', aplicativo:'var(--purple)', ferramenta:'var(--orange)', navegador:'var(--green)', antivirus:'var(--red)', outro:'var(--text-muted)' };

    el.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead>
                <tr style="border-bottom:1px solid var(--border-color);color:var(--text-secondary);">
                    <th style="text-align:left;padding:var(--spacing-sm) var(--spacing-md);">Nome</th>
                    <th style="text-align:left;padding:var(--spacing-sm);">Tipo</th>
                    <th style="text-align:left;padding:var(--spacing-sm);">Versão</th>
                    <th style="text-align:left;padding:var(--spacing-sm);">Obs.</th>
                    <th style="padding:var(--spacing-sm);"></th>
                </tr>
            </thead>
            <tbody>
                ${sistemas.map(s => `
                    <tr style="border-bottom:1px solid var(--border-color);">
                        <td style="padding:var(--spacing-sm) var(--spacing-md);font-weight:600;color:var(--text-primary);">${s.nome}</td>
                        <td style="padding:var(--spacing-sm);">
                            <span style="font-size:0.75rem;background:rgba(255,255,255,0.06);color:${tipoColor[s.tipo]||'var(--text-muted)'};padding:2px 8px;border-radius:4px;">${tipoLabel[s.tipo]||s.tipo}</span>
                        </td>
                        <td style="padding:var(--spacing-sm);color:var(--text-secondary);">${s.versao || '—'}</td>
                        <td style="padding:var(--spacing-sm);color:var(--text-muted);">${s.observacao || ''}</td>
                        <td style="padding:var(--spacing-sm);">
                            <button class="btn btn-danger btn-small" onclick="deletarSistema('${s.id}','${setor.replace(/'/g,"\\'")}')">✕</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function submitNovoSistema(e, setor) {
    e.preventDefault();
    const nome      = document.getElementById('sistemaNome').value.trim();
    const tipo      = document.getElementById('sistemaTipo').value;
    const versao    = document.getElementById('sistemaVersao').value.trim();
    const observacao= document.getElementById('sistemaObs').value.trim();
    if (!nome) return;

    const { supabase } = await import('./supabase-config.js');
    const { error } = await supabase.from('setor_sistemas').insert({ setor, nome, tipo, versao: versao || null, observacao: observacao || null });
    if (error) { alert('Erro: ' + error.message); return; }

    document.getElementById('novoSistemaForm').reset();
    await renderSetorSistemas(setor);
}

async function deletarSistema(id, setor) {
    if (!confirm('Remover este sistema do setor?')) return;
    const { supabase } = await import('./supabase-config.js');
    await supabase.from('setor_sistemas').delete().eq('id', id);
    await renderSetorSistemas(setor);
}

// Expor funções para global scope
window.setupNavigation = setupNavigation;
window.navigateToPage = navigateToPage;
window.abrirSetorDetalhes = abrirSetorDetalhes;
window.fecharSetorDetalhes = fecharSetorDetalhes;
window.setorAba = setorAba;
window.deletarSistema = deletarSistema;
window.openNovoSetorModal = openNovoSetorModal;
window.closeNovoSetorModal = closeNovoSetorModal;
window.openEditSetorModal = openEditSetorModal;
window.closeEditSetorModal = closeEditSetorModal;
window.submitNovoSetor = submitNovoSetor;
window.submitEditSetor = submitEditSetor;
window.deleteSetor = deleteSetor;
