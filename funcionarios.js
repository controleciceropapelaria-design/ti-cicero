// ============================================
// GERENCIAMENTO DE FUNCIONÁRIOS - funcionarios.js
// ============================================

import { supabase } from './supabase-config.js';

class FuncionariosManager {
    constructor() {
        this.funcionarios = [];
        this.ativos_funcionarios = [];
        this.setores = [];
        this.currentEditId = null;
        this.currentViewFuncId = null;
    }

    async init() {
        await this.loadSetores();
        await this.loadFuncionarios();
        await this.loadAtivosFuncionarios();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal: Novo Funcionário
        const modal = document.getElementById('novoFuncionarioModal');
        document.getElementById('novoFuncionarioBtn').addEventListener('click', () => this.openNovoFuncionarioModal());
        modal.querySelector('.close').addEventListener('click', () => this.closeNovoFuncionarioModal());
        document.getElementById('cancelFuncionarioBtn').addEventListener('click', () => this.closeNovoFuncionarioModal());
        document.getElementById('novoFuncionarioForm').addEventListener('submit', (e) => this.submitNovoFuncionario(e));

        // Botões dentro do modal de detalhes
        document.getElementById('editFuncionarioBtn').addEventListener('click', () => {
            this.closeFuncionarioDetalhesModal();
            this.editFuncionario(this.currentViewFuncId);
        });
        document.getElementById('deleteFuncionarioBtn').addEventListener('click', () => {
            this.deleteFuncionario(this.currentViewFuncId);
        });
        document.getElementById('atribuirAtivoBtn').addEventListener('click', () => {
            this.openAssignAssetModal();
        });

        // Modal: Atribuir Ativo
        document.getElementById('assignAssetForm').addEventListener('submit', (e) => this.submitAssignAsset(e));

        // Filtros
        document.getElementById('funcionarioSearchInput').addEventListener('input', () => this.renderFuncionarios());
        document.getElementById('setorFuncionarioFilter').addEventListener('change', () => this.renderFuncionarios());
    }

    // ===== LOAD =====

    async loadSetores() {
        try {
            const { data, error } = await supabase.from('setores').select('nome').order('nome');
            if (error) throw error;
            this.setores = data?.map(s => s.nome) || [];
            this.populateSetorSelects();
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
        }
    }

    async loadFuncionarios() {
        try {
            const { data, error } = await supabase.from('funcionarios').select('*').order('nome');
            if (error) throw error;
            this.funcionarios = data || [];
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
        }
    }

    async loadAtivosFuncionarios() {
        try {
            const { data, error } = await supabase.from('ativos_funcionarios').select('*');
            if (error) throw error;
            this.ativos_funcionarios = data || [];
        } catch (error) {
            console.error('Erro ao carregar atribuições:', error);
        }
    }

    populateSetorSelects() {
        const select = document.getElementById('funcionarioSetor');
        if (select) {
            select.innerHTML = this.setores.map(s => `<option value="${s}">${s}</option>`).join('');
        }

        const filterSelect = document.getElementById('setorFuncionarioFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Todos os setores</option>' +
                this.setores.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    }

    // ===== CRUD FUNCIONÁRIO =====

    openNovoFuncionarioModal() {
        this.currentEditId = null;
        document.getElementById('novoFuncionarioForm').reset();
        document.getElementById('novoFuncionarioModalTitle').textContent = 'Novo Funcionário';
        document.getElementById('novoFuncionarioModal').classList.add('show');
    }

    closeNovoFuncionarioModal() {
        document.getElementById('novoFuncionarioModal').classList.remove('show');
        this.currentEditId = null;
    }

    async submitNovoFuncionario(e) {
        e.preventDefault();

        const funcionario = {
            nome: document.getElementById('funcionarioNome').value.trim(),
            email: document.getElementById('funcionarioEmail').value.trim(),
            cpf: document.getElementById('funcionarioCPF').value.trim(),
            setor: document.getElementById('funcionarioSetor').value,
            cargo: document.getElementById('funcionarioCargo').value.trim()
        };

        try {
            if (this.currentEditId) {
                const { error } = await supabase.from('funcionarios').update(funcionario).eq('id', this.currentEditId);
                if (error) throw error;
                alert(`✅ ${funcionario.nome} atualizado!`);
            } else {
                const { error } = await supabase.from('funcionarios').insert([funcionario]);
                if (error) throw error;
                alert(`✅ ${funcionario.nome} cadastrado!`);
            }

            await this.loadFuncionarios();
            this.closeNovoFuncionarioModal();
            this.renderFuncionarios();
        } catch (error) {
            console.error('Erro ao salvar funcionário:', error);
            alert('Erro ao salvar funcionário: ' + error.message);
        }
    }

    editFuncionario(id) {
        const f = this.funcionarios.find(f => f.id === id);
        if (!f) return;

        this.currentEditId = id;
        document.getElementById('novoFuncionarioModalTitle').textContent = 'Editar Funcionário';
        document.getElementById('funcionarioNome').value = f.nome;
        document.getElementById('funcionarioEmail').value = f.email || '';
        document.getElementById('funcionarioCPF').value = f.cpf || '';
        document.getElementById('funcionarioSetor').value = f.setor;
        document.getElementById('funcionarioCargo').value = f.cargo || '';
        document.getElementById('novoFuncionarioModal').classList.add('show');
    }

    async deleteFuncionario(id) {
        const f = this.funcionarios.find(f => f.id === id);
        if (!f) return;
        if (!confirm(`Deseja excluir o funcionário "${f.nome}"? Todas as atribuições de ativos serão removidas.`)) return;

        try {
            // Liberar ativos em uso
            const emUso = this.ativos_funcionarios.filter(af => af.funcionario_id === id && af.status === 'em_uso');
            for (const af of emUso) {
                await supabase.from('ativos').update({ status: 'disponivel' }).eq('id', af.ativo_id);
            }

            await supabase.from('ativos_funcionarios').delete().eq('funcionario_id', id);
            const { error } = await supabase.from('funcionarios').delete().eq('id', id);
            if (error) throw error;

            await this.loadFuncionarios();
            await this.loadAtivosFuncionarios();
            this.closeFuncionarioDetalhesModal();
            this.renderFuncionarios();
            alert('✅ Funcionário excluído!');
        } catch (error) {
            console.error('Erro ao excluir funcionário:', error);
            alert('Erro ao excluir: ' + error.message);
        }
    }

    // ===== RENDER GRID =====

    renderFuncionarios() {
        const search = document.getElementById('funcionarioSearchInput').value.toLowerCase();
        const setor = document.getElementById('setorFuncionarioFilter').value;

        let filtered = this.funcionarios;

        if (search) {
            filtered = filtered.filter(f =>
                f.nome.toLowerCase().includes(search) ||
                (f.cargo && f.cargo.toLowerCase().includes(search)) ||
                (f.email && f.email.toLowerCase().includes(search))
            );
        }
        if (setor) {
            filtered = filtered.filter(f => f.setor === setor);
        }

        const grid = document.getElementById('funcionariosGrid');

        if (filtered.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); padding: 40px; text-align: center; grid-column: 1/-1;">Nenhum funcionário encontrado.</p>';
            return;
        }

        grid.innerHTML = filtered.map(f => {
            const emUso    = this.ativos_funcionarios.filter(af => af.funcionario_id === f.id && af.status === 'em_uso').length;
            const pendente = this.ativos_funcionarios.filter(af => af.funcionario_id === f.id && af.status === 'pendente').length;
            const historico= this.ativos_funcionarios.filter(af => af.funcionario_id === f.id && af.status === 'historico').length;

            return `
                <div class="funcionario-card" onclick="funcionariosManager.openFuncionarioDetalhesModal('${f.id}')">
                    <div class="funcionario-header">
                        <div class="funcionario-avatar">${f.nome.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="funcionario-name">${f.nome}</div>
                            <div class="funcionario-setor">${f.setor}</div>
                            <div class="funcionario-cargo">${f.cargo || '—'}</div>
                        </div>
                    </div>
                    <div class="funcionario-stats">
                        <div class="stat-item">
                            <span class="stat-count" style="color: var(--purple)">${emUso}</span>
                            <span class="stat-label">Em Uso</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-count" style="color: var(--orange)">${pendente}</span>
                            <span class="stat-label">Pendente</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-count" style="color: var(--text-secondary)">${historico}</span>
                            <span class="stat-label">Histórico</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== MODAL DETALHES =====

    async openFuncionarioDetalhesModal(funcId) {
        this.currentViewFuncId = funcId;
        const f = this.funcionarios.find(f => f.id === funcId);
        if (!f) return;

        document.getElementById('detalhesNomeFuncTitle').textContent = f.nome;
        document.getElementById('detalhesNomeFunc').textContent = f.nome;
        document.getElementById('detalhesSetorFunc').textContent = f.setor;
        document.getElementById('detalheCargoFunc').textContent = f.cargo || '—';
        document.getElementById('detalhesEmailFunc').textContent = f.email || '—';

        this.renderAtivosDetalhes(funcId);

        document.getElementById('funcionarioDetalhesModal').classList.add('show');
    }

    closeFuncionarioDetalhesModal() {
        document.getElementById('funcionarioDetalhesModal').classList.remove('show');
        this.currentViewFuncId = null;
    }

    renderAtivosDetalhes(funcId) {
        const render = (status, elId) => {
            const records = this.ativos_funcionarios.filter(af => af.funcionario_id === funcId && af.status === status);
            const el = document.getElementById(elId);

            if (records.length === 0) {
                el.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: var(--spacing-sm);">Nenhum ativo neste status.</p>';
                return;
            }

            el.innerHTML = records.map(af => {
                const ativo = window.ativosManager?.ativos.find(a => a.id === af.ativo_id);
                const codigo = ativo?.codigo || af.ativo_id?.slice(0, 8) || '—';
                const descricao = ativo?.descricao || '—';
                const notas = af.notas ? `<div class="ativo-notas">${af.notas}</div>` : '';
                const dataAtrib = af.data_atribuicao ? `<span style="color:var(--text-muted);font-size:0.75rem;">${af.data_atribuicao}</span>` : '';

                return `
                    <div class="ativo-item">
                        <div class="ativo-info">
                            <div class="ativo-codigo">${codigo}</div>
                            <div class="ativo-desc">${descricao}</div>
                            ${notas}
                            ${dataAtrib}
                        </div>
                        <div style="display:flex;gap:var(--spacing-sm);align-items:center;">
                            ${status !== 'historico' ? `<button class="btn btn-small" onclick="funcionariosManager.moverParaHistorico('${af.id}')">Devolver</button>` : ''}
                            <button class="btn btn-danger btn-small" onclick="funcionariosManager.unassignAsset('${af.id}')">✕</button>
                        </div>
                    </div>
                `;
            }).join('');
        };

        render('em_uso',   'ativosEmUsoDiv');
        render('pendente', 'ativosPendenteDiv');
        render('historico','ativosHistoricoDiv');
    }

    // ===== ATRIBUIR ATIVO =====

    async openAssignAssetModal() {
        // Recarregar ativos para garantir dados atualizados
        if (window.ativosManager) {
            await window.ativosManager.loadAtivos();
        }

        const todosAtivos = window.ativosManager?.ativos || [];

        // IDs já atribuídos a este funcionário como em_uso ou pendente
        const jaAtribuidos = new Set(
            this.ativos_funcionarios
                .filter(af => af.funcionario_id === this.currentViewFuncId && af.status !== 'historico')
                .map(af => af.ativo_id)
        );

        // Mostrar disponíveis + qualquer ativo não atribuído a este funcionário
        const disponiveis = todosAtivos.filter(a =>
            a.status === 'disponivel' && !jaAtribuidos.has(a.id)
        );

        const select = document.getElementById('assetSelect');

        if (disponiveis.length === 0) {
            alert('Não há ativos com status "Disponível" para atribuição.\nVerifique se os ativos foram cadastrados com o status correto.');
            return;
        }

        select.innerHTML = disponiveis.map(a =>
            `<option value="${a.id}">${a.codigo} — ${a.descricao} (${a.setor})</option>`
        ).join('');

        document.getElementById('assignAssetForm').reset();
        document.getElementById('assignAssetModal').classList.add('show');
    }

    closeAssignAssetModal() {
        document.getElementById('assignAssetModal').classList.remove('show');
    }

    async submitAssignAsset(e) {
        e.preventDefault();

        const ativoId = document.getElementById('assetSelect').value;
        const status  = document.getElementById('assignmentStatus').value;
        const notas   = document.getElementById('assignmentNotes').value.trim();

        try {
            const { error } = await supabase.from('ativos_funcionarios').insert({
                funcionario_id: this.currentViewFuncId,
                ativo_id: ativoId,
                status,
                notas: notas || null,
                data_atribuicao: new Date().toISOString().split('T')[0]
            });
            if (error) throw error;

            // Em Uso → ativo marcado como em_uso; Pendente → permanece disponivel até chegar
            if (status === 'em_uso') {
                await supabase.from('ativos').update({ status: 'em_uso' }).eq('id', ativoId);
            }

            await this.loadAtivosFuncionarios();
            await window.ativosManager?.loadAtivos();
            this.closeAssignAssetModal();
            this.renderAtivosDetalhes(this.currentViewFuncId);
            this.renderFuncionarios();
            alert('✅ Ativo atribuído com sucesso!');
        } catch (error) {
            console.error('Erro ao atribuir ativo:', error);
            alert('Erro ao atribuir ativo: ' + error.message);
        }
    }

    async moverParaHistorico(afId) {
        if (!confirm('Devolver este ativo? Ele voltará a aparecer como disponível e ficará no histórico.')) return;

        try {
            const af = this.ativos_funcionarios.find(r => r.id === afId);
            if (!af) return;

            const { error } = await supabase.from('ativos_funcionarios').update({ status: 'historico' }).eq('id', afId);
            if (error) throw error;

            await supabase.from('ativos').update({ status: 'disponivel' }).eq('id', af.ativo_id);

            await this.loadAtivosFuncionarios();
            await window.ativosManager?.loadAtivos();
            this.renderAtivosDetalhes(this.currentViewFuncId);
            this.renderFuncionarios();
        } catch (error) {
            console.error('Erro ao devolver ativo:', error);
            alert('Erro: ' + error.message);
        }
    }

    async unassignAsset(afId) {
        if (!confirm('Remover completamente esta atribuição? O ativo voltará a ficar disponível.')) return;

        try {
            const af = this.ativos_funcionarios.find(r => r.id === afId);
            if (!af) return;

            const { error } = await supabase.from('ativos_funcionarios').delete().eq('id', afId);
            if (error) throw error;

            if (af.status !== 'historico') {
                await supabase.from('ativos').update({ status: 'disponivel' }).eq('id', af.ativo_id);
            }

            await this.loadAtivosFuncionarios();
            await window.ativosManager?.loadAtivos();
            this.renderAtivosDetalhes(this.currentViewFuncId);
            this.renderFuncionarios();
        } catch (error) {
            console.error('Erro ao remover atribuição:', error);
            alert('Erro: ' + error.message);
        }
    }
}

const funcionariosManager = new FuncionariosManager();
window.funcionariosManager = funcionariosManager;
