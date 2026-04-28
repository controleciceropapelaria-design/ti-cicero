// ============================================
// GERENCIAMENTO DE CHAMADOS - chamados.js
// ============================================

import { supabase } from './supabase-config.js';

class ChamadosManager {
    constructor() {
        this.chamados = [];
        this.currentEditId = null;
        this.init();
    }

    async init() {
        await this.loadChamados();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal de novo chamado (colaborador)
        const novoCallBtn = document.getElementById('openNewCallModalBtn');
        const novoCallModal = document.getElementById('novoCallModal');
        const cancelBtn = document.getElementById('cancelCallBtn');
        const form = document.getElementById('novoCallForm');

        if (novoCallBtn) {
            novoCallBtn.addEventListener('click', () => this.openNovoCallModal());
        }

        if (novoCallModal) {
            const closeBtn = novoCallModal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeNovoCallModal());
            }
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeNovoCallModal());
        }

        if (form) {
            form.addEventListener('submit', (e) => this.submitNovoCall(e));
        }

        // Modal de gerenciar chamado (admin)
        const gerenciarModal = document.getElementById('gerenciarCallModal');
        if (gerenciarModal) {
            const gerenciarClose = gerenciarModal.querySelector('.close');
            const gerenciarCancel = document.getElementById('cancelGerenciarBtn');
            const gerenciarForm = document.getElementById('gerenciarCallForm');

            if (gerenciarClose) {
                gerenciarClose.addEventListener('click', () => this.closeGerenciarCallModal());
            }

            if (gerenciarCancel) {
                gerenciarCancel.addEventListener('click', () => this.closeGerenciarCallModal());
            }

            if (gerenciarForm) {
                gerenciarForm.addEventListener('submit', (e) => this.submitGerenciarCall(e));
            }
        }

        // Filtros
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.renderChamados());
        }

        const chamadoSearchInput = document.getElementById('chamadoSearchInput');
        if (chamadoSearchInput) {
            chamadoSearchInput.addEventListener('input', () => this.renderChamados());
        }
    }

    async loadChamados() {
        try {
            const { data, error } = await supabase
                .from('chamados')
                .select()
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao carregar chamados:', error);
                this.chamados = [];
                return;
            }

            this.chamados = data || [];
        } catch (e) {
            console.error('Erro ao carregar chamados:', e);
            this.chamados = [];
        }
    }

    openNovoCallModal() {
        document.getElementById('novoCallModal').classList.add('show');
        document.getElementById('novoCallForm').reset();
    }

    closeNovoCallModal() {
        document.getElementById('novoCallModal').classList.remove('show');
    }

    async submitNovoCall(e) {
        e.preventDefault();

        try {
            // Gerar código do chamado via RPC
            const { data: codigoData, error: codigoError } = await supabase
                .rpc('next_chamado_codigo');

            if (codigoError) {
                console.error('Erro ao gerar código:', codigoError);
                alert('Erro ao gerar código do chamado');
                return;
            }

            const codigo = codigoData || 'CH-00001';

            // Obter user_id da auth (se disponível)
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData?.user?.id || null;

            const chamado = {
                codigo: codigo,
                nome: document.getElementById('callName').value,
                email: document.getElementById('callEmail').value,
                titulo: document.getElementById('callTitle').value,
                descricao: document.getElementById('callDescription').value,
                prioridade: document.getElementById('callPriority').value,
                status: 'aberto',
                data: new Date().toLocaleDateString('pt-BR'),
                responsavel: '',
                resposta: '',
                tipo_chamado: document.getElementById('callCategory')?.value || '',
                campo_extra: document.getElementById('callExtraField')?.value || '',
                token: this.generateToken(),
                user_id: userId
            };

            // Inserir no Supabase
            const { data: newChamado, error: insertError } = await supabase
                .from('chamados')
                .insert([chamado])
                .select();

            if (insertError) {
                console.error('Erro ao inserir chamado:', insertError);
                alert('Erro ao criar chamado');
                return;
            }

            await this.loadChamados();
            this.closeNovoCallModal();
            this.renderChamados();

            alert(`✅ Chamado ${codigo} aberto com sucesso!`);
        } catch (error) {
            console.error('Erro ao submeter novo chamado:', error);
            alert('Erro ao criar chamado');
        }
    }

    generateToken() {
        return 'TK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    }

    async openGerenciarCallModal(id) {
        const chamado = this.chamados.find(c => c.id === id);
        if (!chamado) return;

        this.currentEditId = id;

        // Preencher detalhes do chamado
        document.getElementById('gerenciarChamadoId').textContent = chamado.codigo || chamado.id;
        document.getElementById('gerenciarChamadoNome').textContent = chamado.nome;
        document.getElementById('gerenciarChamadoEmail').textContent = chamado.email;
        document.getElementById('gerenciarChamadoSetor').textContent = chamado.setor || '—';
        document.getElementById('gerenciarChamadoCategoria').textContent = chamado.tipo_chamado ? this.getCategoryLabel(chamado.tipo_chamado) : 'N/A';

        // Campo extra (se existir)
        const campoExtraRow = document.getElementById('gerenciarChamadoCampoExtraRow');
        if (chamado.campo_extra) {
            const fieldName = this.getCategoryFieldLabel(chamado.tipo_chamado);
            document.getElementById('gerenciarChamadoCampoExtraLabel').textContent = fieldName;
            document.getElementById('gerenciarChamadoCampoExtraValor').textContent = chamado.campo_extra;
            campoExtraRow.style.display = 'flex';
        } else {
            campoExtraRow.style.display = 'none';
        }

        document.getElementById('gerenciarChamadoData').textContent = chamado.data;
        document.getElementById('gerenciarChamadoPrioridade').textContent = this.getPriorityLabel(chamado.prioridade);
        document.getElementById('gerenciarChamadoPrioridade').className = `badge-priority ${chamado.prioridade}`;
        document.getElementById('gerenciarChamadoDescricao').textContent = chamado.descricao;

        // Campos de gerenciamento
        document.getElementById('callStatusSelect').value = chamado.status;
        document.getElementById('callAssignee').value = chamado.responsavel || '';
        document.getElementById('callResponse').value = chamado.resposta || '';

        document.getElementById('gerenciarCallModal').classList.add('show');
    }

    closeGerenciarCallModal() {
        document.getElementById('gerenciarCallModal').classList.remove('show');
        this.currentEditId = null;
    }

    async submitGerenciarCall(e) {
        e.preventDefault();

        try {
            const chamado = this.chamados.find(c => c.id === this.currentEditId);
            if (!chamado) return;

            const novoStatus = document.getElementById('callStatusSelect').value;
            const novoResponsavel = document.getElementById('callAssignee').value;
            const respostaTexto = document.getElementById('callResponse').value.trim();

            // Atualizar chamado no Supabase
            const { error: updateError } = await supabase
                .from('chamados')
                .update({
                    status: novoStatus,
                    responsavel: novoResponsavel,
                    resposta: respostaTexto
                })
                .eq('id', this.currentEditId);

            if (updateError) {
                console.error('Erro ao atualizar chamado:', updateError);
                alert('Erro ao atualizar chamado');
                return;
            }

            // Adicionar resposta como mensagem se houver texto
            if (respostaTexto) {
                await this.addMensagem(this.currentEditId, 'admin', 'Admin', respostaTexto);
            }

            await this.loadChamados();
            this.closeGerenciarCallModal();
            this.renderChamados();

            alert('✅ Chamado atualizado!');
        } catch (error) {
            console.error('Erro ao submeter gerenciar chamado:', error);
            alert('Erro ao atualizar chamado');
        }
    }

    renderChamados() {
        const searchFilter = document.getElementById('chamadoSearchInput').value.toLowerCase();
        const statuses = ['aberto', 'em_andamento', 'aguardando', 'fechado'];

        // For each status column
        statuses.forEach(status => {
            let filtered = this.chamados.filter(c => c.status === status);

            // Apply search filter
            if (searchFilter) {
                filtered = filtered.filter(c =>
                    (c.codigo || c.id).toLowerCase().includes(searchFilter) ||
                    c.titulo.toLowerCase().includes(searchFilter) ||
                    c.nome.toLowerCase().includes(searchFilter)
                );
            }

            // Sort by date descending
            filtered.sort((a, b) => new Date(b.data) - new Date(a.data));

            // Update column count
            document.getElementById(`count-${status}`).textContent = filtered.length;

            // Render cards in column
            const columnCards = document.getElementById(`column-${status}`);
            columnCards.innerHTML = filtered.map(chamado => `
                <div class="kanban-card" draggable="true" data-chamado-id="${chamado.id}">
                    <div class="kanban-card-header" onclick="chamadosManager.openDetalhesModal('${chamado.id}'); event.stopPropagation();" style="cursor: pointer;">
                        <div>
                            <div class="kanban-card-id">${chamado.codigo || chamado.id}</div>
                            <h4 class="kanban-card-title">${chamado.titulo}</h4>
                        </div>
                    </div>
                    <div class="kanban-card-meta">
                        <span>${chamado.nome}</span>
                        <span>${chamado.setor || ''}</span>
                        <span>${chamado.data}</span>
                    </div>
                    <div class="kanban-card-footer">
                        <span class="badge-priority ${chamado.prioridade}">
                            ${this.getPriorityLabel(chamado.prioridade)}
                        </span>
                        <div class="kanban-card-actions">
                            <button class="btn btn-small" onclick="chamadosManager.openChatModal('${chamado.id}'); event.stopPropagation();">
                                Chat
                            </button>
                            <button class="btn btn-small" onclick="chamadosManager.openGerenciarCallModal('${chamado.id}'); event.stopPropagation();">
                                Editar
                            </button>
                            <button class="btn btn-danger btn-small" onclick="chamadosManager.deleteChamado('${chamado.id}'); event.stopPropagation();">
                                Deletar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    async deleteChamado(id) {
        if (confirm('Deseja deletar este chamado?')) {
            try {
                const { error } = await supabase
                    .from('chamados')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Erro ao deletar chamado:', error);
                    alert('Erro ao deletar chamado');
                    return;
                }

                await this.loadChamados();
                this.renderChamados();
            } catch (error) {
                console.error('Erro ao deletar chamado:', error);
                alert('Erro ao deletar chamado');
            }
        }
    }

    getStatusLabel(status) {
        const labels = {
            'aberto': 'Aberto',
            'em_andamento': 'Em Andamento',
            'aguardando': 'Aguardando Suporte',
            'fechado': 'Fechado'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority) {
        const labels = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'critica': 'Crítica'
        };
        return labels[priority] || priority;
    }

    getAbertosCount() {
        return this.chamados.filter(c => c.status === 'aberto').length;
    }

    getByStatus(status) {
        return this.chamados.filter(c => c.status === status).length;
    }

    getChamadoById(id) {
        return this.chamados.find(c => c.id === id);
    }

    async addMensagem(chamadoId, remetente, nomeRemetente, texto) {
        try {
            const mensagem = {
                chamado_id: chamadoId,
                remetente: remetente,
                nome: nomeRemetente,
                texto: texto
            };

            const { error } = await supabase
                .from('mensagens')
                .insert([mensagem]);

            if (error) {
                console.error('Erro ao adicionar mensagem:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao adicionar mensagem:', error);
            return false;
        }
    }

    async loadChatMessages(chamadoId) {
        try {
            const { data, error } = await supabase
                .from('mensagens')
                .select()
                .eq('chamado_id', chamadoId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Erro ao carregar mensagens:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            return [];
        }
    }

    async openChatModal(id) {
        try {
            const chamado = this.getChamadoById(id);
            if (!chamado) return;

            this.currentEditId = id;

            // Preencher detalhes do chamado
            document.getElementById('chatModalTitle').textContent = `Chat - ${chamado.codigo || chamado.id}`;
            document.getElementById('chatChamadoId').textContent = chamado.codigo || chamado.id;
            document.getElementById('chatChamadoNome').textContent = chamado.nome;
            document.getElementById('chatChamadoEmail').textContent = chamado.email;
            document.getElementById('chatChamadoSetor').textContent = chamado.setor || '—';
            document.getElementById('chatChamadoCategoria').textContent = chamado.tipo_chamado ? this.getCategoryLabel(chamado.tipo_chamado) : 'N/A';

            // Campo extra (se existir)
            const campoExtraRow = document.getElementById('chatChamadoCampoExtraRow');
            if (chamado.campo_extra) {
                const fieldName = this.getCategoryFieldLabel(chamado.tipo_chamado);
                document.getElementById('chatChamadoCampoExtraLabel').textContent = fieldName;
                document.getElementById('chatChamadoCampoExtraValor').textContent = chamado.campo_extra;
                campoExtraRow.style.display = 'flex';
            } else {
                campoExtraRow.style.display = 'none';
            }

            document.getElementById('chatChamadoStatus').textContent = this.getStatusLabel(chamado.status);
            document.getElementById('chatChamadoStatus').className = `badge ${chamado.status}`;
            document.getElementById('chatChamadoPrioridade').textContent = this.getPriorityLabel(chamado.prioridade);
            document.getElementById('chatChamadoPrioridade').className = `badge-priority ${chamado.prioridade}`;
            document.getElementById('chatChamadoData').textContent = chamado.data;
            document.getElementById('chatChamadoDescricao').textContent = chamado.descricao;

            // Carregar mensagens do Supabase
            const mensagens = await this.loadChatMessages(id);

            // Renderizar histórico de mensagens
            const chatHistory = document.getElementById('chatHistory');
            if (!mensagens || mensagens.length === 0) {
                chatHistory.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma mensagem ainda</p>';
            } else {
                chatHistory.innerHTML = mensagens.map(msg => `
                    <div class="chat-message ${msg.remetente}">
                        <div class="chat-message-header">
                            <strong>${msg.nome}</strong>
                            <span class="chat-message-time">${msg.data || (msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : '')}</span>
                        </div>
                        <div class="chat-message-text">${msg.texto}</div>
                    </div>
                `).join('');
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }

            // Limpar campo de entrada
            document.getElementById('chatInput').value = '';
            document.getElementById('chatModal').classList.add('show');

            // Setup realtime chat subscription
            this.setupChatRealtime(id);
        } catch (error) {
            console.error('Erro ao abrir chat:', error);
        }
    }

    setupChatRealtime(chamadoId) {
        // Remover inscrição anterior se existir
        if (window._chatChannel) {
            supabase.removeChannel(window._chatChannel);
        }

        // Criar nova inscrição para mudanças em tempo real
        window._chatChannel = supabase
            .channel(`chat-admin-${chamadoId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mensagens',
                filter: `chamado_id=eq.${chamadoId}`
            }, async (payload) => {
                // Recarregar mensagens quando uma nova for inserida
                await this.reloadChatMessages(chamadoId);
            })
            .subscribe();
    }

    async reloadChatMessages(chamadoId) {
        try {
            const mensagens = await this.loadChatMessages(chamadoId);
            const chatHistory = document.getElementById('chatHistory');

            if (!mensagens || mensagens.length === 0) {
                chatHistory.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma mensagem ainda</p>';
            } else {
                chatHistory.innerHTML = mensagens.map(msg => `
                    <div class="chat-message ${msg.remetente}">
                        <div class="chat-message-header">
                            <strong>${msg.nome}</strong>
                            <span class="chat-message-time">${msg.data || (msg.created_at ? new Date(msg.created_at).toLocaleString('pt-BR') : '')}</span>
                        </div>
                        <div class="chat-message-text">${msg.texto}</div>
                    </div>
                `).join('');
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        } catch (error) {
            console.error('Erro ao recarregar mensagens:', error);
        }
    }

    getCategoryLabel(cat) {
        const labels = {
            'e_millennium': 'e-Millennium',
            'infra_ti': 'Infra-Estrutura de TI',
            'integracao_terceiros': 'Integração com Terceiros'
        };
        return labels[cat] || cat;
    }

    getCategoryFieldLabel(cat) {
        const labels = {
            'e_millennium': 'Qual módulo?',
            'infra_ti': 'Tipo de suporte',
            'integracao_terceiros': 'Sistema terceiro'
        };
        return labels[cat] || 'Campo Extra';
    }

    closeChatModal() {
        // Remover inscrição realtime
        if (window._chatChannel) {
            supabase.removeChannel(window._chatChannel);
            window._chatChannel = null;
        }

        document.getElementById('chatModal').classList.remove('show');
        this.currentEditId = null;
    }

    async submitChatMessage(e) {
        e.preventDefault();
        const texto = document.getElementById('chatInput').value.trim();
        if (!texto) return;

        try {
            await this.addMensagem(this.currentEditId, 'admin', 'Admin', texto);
            document.getElementById('chatInput').value = '';
            await this.reloadChatMessages(this.currentEditId);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            alert('Erro ao enviar mensagem');
        }
    }

    async openDetalhesModal(id) {
        const chamado = this.getChamadoById(id);
        if (!chamado) return;

        this.currentEditId = id;

        // Preencher detalhes
        document.getElementById('detalhesId').textContent = chamado.codigo || chamado.id;
        document.getElementById('detalhesNome').textContent = chamado.nome;
        document.getElementById('detalhesEmail').textContent = chamado.email;
        document.getElementById('detalhesSetor').textContent = chamado.setor || '—';
        document.getElementById('detalhesCategoria').textContent = chamado.tipo_chamado ? this.getCategoryLabel(chamado.tipo_chamado) : 'N/A';

        // Campo extra (se existir)
        const campoExtraRow = document.getElementById('detalhesCampoExtraRow');
        if (chamado.campo_extra) {
            const fieldName = this.getCategoryFieldLabel(chamado.tipo_chamado);
            document.getElementById('detalhesCampoExtraLabel').textContent = fieldName;
            document.getElementById('detalhesCampoExtraValor').textContent = chamado.campo_extra;
            campoExtraRow.style.display = 'flex';
        } else {
            campoExtraRow.style.display = 'none';
        }

        document.getElementById('detalhesData').textContent = chamado.data;
        document.getElementById('detalhesStatus').textContent = this.getStatusLabel(chamado.status);
        document.getElementById('detalhesStatus').className = `badge ${chamado.status}`;
        document.getElementById('detalhesPrioridade').textContent = this.getPriorityLabel(chamado.prioridade);
        document.getElementById('detalhesPrioridade').className = `badge-priority ${chamado.prioridade}`;
        document.getElementById('detalhesDescricao').textContent = chamado.descricao;

        // Mostrar responsável se houver
        if (chamado.responsavel) {
            document.getElementById('detalhesResponsavelDiv').style.display = 'block';
            document.getElementById('detalhesResponsavel').textContent = chamado.responsavel;
        } else {
            document.getElementById('detalhesResponsavelDiv').style.display = 'none';
        }

        document.getElementById('detalhesChamadoModal').classList.add('show');
    }

    setupDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.column-cards');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('chamado-id', card.dataset.chamadoId);
            });

            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                column.style.backgroundColor = 'rgba(74, 158, 255, 0.05)';
            });

            column.addEventListener('dragleave', () => {
                column.style.backgroundColor = '';
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.style.backgroundColor = '';
                const chamadoId = e.dataTransfer.getData('chamado-id');
                const newStatus = column.dataset.status;

                const chamado = this.chamados.find(c => c.id === chamadoId);
                if (chamado && chamado.status !== newStatus) {
                    try {
                        // Atualizar status no Supabase
                        const { error } = await supabase
                            .from('chamados')
                            .update({ status: newStatus })
                            .eq('id', chamadoId);

                        if (error) {
                            console.error('Erro ao atualizar status:', error);
                            return;
                        }

                        await this.loadChamados();
                        this.renderChamados();
                    } catch (error) {
                        console.error('Erro ao atualizar status:', error);
                    }
                }
            });
        });
    }
}

let chamadosManager = new ChamadosManager();

// ============================================
// FUNÇÕES GLOBAIS PARA MODAL DE DETALHES
// ============================================

function fecharDetalhesChamado() {
    document.getElementById('detalhesChamadoModal').classList.remove('show');
    chamadosManager.currentEditId = null;
}

function abrirEditorDeDetalhes() {
    const id = chamadosManager.currentEditId;
    fecharDetalhesChamado();
    chamadosManager.openGerenciarCallModal(id);
}

function abrirChatDeDetalhes() {
    const id = chamadosManager.currentEditId;
    fecharDetalhesChamado();
    chamadosManager.openChatModal(id);
}

window.chamadosManager = chamadosManager;
window.fecharDetalhesChamado = fecharDetalhesChamado;
window.abrirEditorDeDetalhes = abrirEditorDeDetalhes;
window.abrirChatDeDetalhes = abrirChatDeDetalhes;
