// ============================================
// PORTAL DE CHAMADOS - portal.js
// Refactored for Supabase Authentication & Realtime Chat
// ============================================

import { supabase } from './supabase-config.js';

// ============================================
// GLOBAL STATE
// ============================================

let currentUser = null;
let currentProfile = null;
let currentCategory = null;
let currentChamadoId = null;
let chamadosList = [];

// Definir campos extras por categoria
const categoryFields = {
    e_millennium: {
        label: 'Qual módulo?',
        options: ['Hub', 'Gateway', 'Site', 'Marketplace', 'Outro']
    },
    infra_ti: {
        label: 'Tipo de suporte',
        options: ['Hardware', 'Software', 'Rede', 'Acesso', 'Outro']
    },
    integracao_terceiros: {
        label: 'Sistema terceiro',
        options: ['ERP', 'CRM', 'API', 'Outro']
    }
};

// ============================================
// AUTHENTICATION
// ============================================

async function handlePortalLogin(e) {
    e.preventDefault();

    const email = document.getElementById('portalLoginEmail').value.trim();
    const password = document.getElementById('portalLoginPassword').value.trim();

    if (!email || !password) {
        alert('❌ Por favor, preencha email e senha.');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert(`❌ Erro ao fazer login: ${error.message}`);
            return;
        }

        currentUser = data.user;
        await loadCurrentProfile();
        showAuthenticatedUI();
        await loadSetoresForDropdown();

        document.getElementById('portalLoginForm').reset();
    } catch (err) {
        alert(`❌ Erro: ${err.message}`);
    }
}

async function handlePortalRegister(e) {
    e.preventDefault();

    const email = document.getElementById('portalRegisterEmail').value.trim();
    const password = document.getElementById('portalRegisterPassword').value.trim();
    const passwordConfirm = document.getElementById('portalRegisterPasswordConfirm').value.trim();
    const nome = document.getElementById('portalRegisterNome').value.trim();
    const setor = document.getElementById('portalRegisterSetor').value;

    if (!email || !password || !passwordConfirm || !nome || !setor) {
        alert('❌ Por favor, preencha todos os campos.');
        return;
    }

    if (password !== passwordConfirm) {
        alert('❌ As senhas não conferem.');
        return;
    }

    if (password.length < 6) {
        alert('❌ A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            alert(`❌ Erro ao registrar: ${authError.message}`);
            return;
        }

        currentUser = authData.user;

        // O trigger já criou o profile básico — apenas atualizar nome e setor
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ nome, setor, role: 'colaborador' })
            .eq('id', currentUser.id);

        if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError);
            // Não bloquear o cadastro se o update falhar — trigger já criou o profile
        }

        await loadCurrentProfile();
        showAuthenticatedUI();
        await loadSetoresForDropdown();

        document.getElementById('portalRegisterForm').reset();
    } catch (err) {
        alert(`❌ Erro: ${err.message}`);
    }
}

async function handlePortalLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`❌ Erro ao fazer logout: ${error.message}`);
            return;
        }

        currentUser = null;
        currentProfile = null;
        currentCategory = null;
        currentChamadoId = null;
        chamadosList = [];

        // Unsubscribe from realtime chat if active
        if (window._chatChannel) {
            window._chatChannel.unsubscribe();
            window._chatChannel = null;
        }

        showUnauthenticatedUI();
    } catch (err) {
        alert(`❌ Erro: ${err.message}`);
    }
}

function toggleAuthSection(e) {
    e.preventDefault();
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');

    if (loginSection.style.display !== 'none') {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    } else {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    }
}

async function loadCurrentProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;
        currentProfile = data;
    } catch (err) {
        console.error('Erro ao carregar perfil:', err.message);
    }
}

async function loadSetoresForDropdown() {
    try {
        console.log('Carregando setores...');
        const { data, error } = await supabase
            .from('setores')
            .select('nome')
            .order('nome');

        console.log('Resposta setores:', { data, error });

        if (error) {
            console.error('Erro Supabase:', error);
            throw error;
        }

        console.log('Setores recebidos:', data);

        const setorSelect = document.getElementById('portalRegisterSetor');
        if (setorSelect) {
            setorSelect.innerHTML = '<option value="">Selecione um setor</option>';
            if (data && data.length > 0) {
                data.forEach(setor => {
                    const option = document.createElement('option');
                    option.value = setor.nome;
                    option.textContent = setor.nome;
                    setorSelect.appendChild(option);
                });
                console.log('Setores carregados:', data.length);
            } else {
                console.warn('Nenhum setor encontrado!');
                setorSelect.innerHTML += '<option disabled>Nenhum setor disponível</option>';
            }
        } else {
            console.error('Elemento portalRegisterSetor não encontrado');
        }
    } catch (err) {
        console.error('Erro ao carregar setores:', err);
        alert('❌ Erro ao carregar setores: ' + err.message);
    }
}

function showAuthenticatedUI() {
    const authOverlay = document.getElementById('authOverlay');
    const portalHeader = document.getElementById('portalHeader');
    const formSection = document.getElementById('form-section');
    const chamadosSection = document.getElementById('chamados-section');

    if (authOverlay) authOverlay.style.display = 'none';
    if (portalHeader) portalHeader.style.display = 'block';
    if (formSection) formSection.style.display = 'none';
    if (chamadosSection) chamadosSection.style.display = 'block';

    // Pre-fill nome/email from profile
    if (currentProfile) {
        const nomeInput = document.getElementById('portalNome');
        const emailInput = document.getElementById('portalEmail');
        if (nomeInput) nomeInput.value = currentProfile.nome;
        if (emailInput) emailInput.value = currentProfile.email;
    }

    carregarMeusChamados();
}

function showUnauthenticatedUI() {
    const authOverlay = document.getElementById('authOverlay');
    const portalHeader = document.getElementById('portalHeader');
    const formSection = document.getElementById('form-section');
    const chamadosSection = document.getElementById('chamados-section');
    const hero = document.querySelector('.hero');
    const categoriesSection = document.querySelector('.categories-section');

    if (authOverlay) authOverlay.style.display = 'flex';
    if (portalHeader) portalHeader.style.display = 'none';
    if (formSection) formSection.style.display = 'none';
    if (chamadosSection) chamadosSection.style.display = 'none';
    if (hero) hero.style.display = 'block';
    if (categoriesSection) categoriesSection.style.display = 'grid';

    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Carregar setores ANTES de qualquer login (tela de cadastro precisa deles)
        await loadSetoresForDropdown();

        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error.message);
            showUnauthenticatedUI();
            return;
        }

        if (session && session.user) {
            currentUser = session.user;
            await loadCurrentProfile();

            // Only show authenticated UI if not admin
            if (currentProfile && currentProfile.role !== 'admin') {
                showAuthenticatedUI();
                await loadSetoresForDropdown();
            } else {
                showUnauthenticatedUI();
            }
        } else {
            showUnauthenticatedUI();
        }

        // Setup auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await loadCurrentProfile();
                if (currentProfile && currentProfile.role !== 'admin') {
                    showAuthenticatedUI();
                    await loadSetoresForDropdown();
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                currentProfile = null;
                currentCategory = null;
                currentChamadoId = null;
                chamadosList = [];

                if (window._chatChannel) {
                    window._chatChannel.unsubscribe();
                    window._chatChannel = null;
                }

                showUnauthenticatedUI();
            }
        });

        // Cleanup subscription on page unload
        window.addEventListener('beforeunload', () => {
            if (subscription) subscription.unsubscribe();
        });
    } catch (err) {
        console.error('Erro na inicialização:', err.message);
        showUnauthenticatedUI();
    }

    setupCategoryCards();
});

// ============================================
// CATEGORY SELECTION
// ============================================

function setupCategoryCards() {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            selecionarCategoria(category);
        });
    });
}

function selecionarCategoria(category) {
    currentCategory = category;

    // Definir título do formulário
    const categoryNames = {
        e_millennium: 'e-Millennium',
        infra_ti: 'Infra-Estrutura de TI',
        integracao_terceiros: 'Integração com Terceiros'
    };

    document.getElementById('form-title').textContent = categoryNames[category];

    // Mostrar/ocultar campo extra
    const campoExtraContainer = document.getElementById('campoExtraContainer');
    const campoExtra = document.getElementById('campoExtra');
    const campoExtraLabel = document.getElementById('campoExtraLabel');

    if (categoryFields[category]) {
        campoExtraLabel.textContent = categoryFields[category].label;
        campoExtra.innerHTML = categoryFields[category].options
            .map(opt => `<option value="${opt}">${opt}</option>`)
            .join('');
        campoExtraContainer.style.display = 'flex';
    } else {
        campoExtraContainer.style.display = 'none';
    }

    // Pre-fill nome/email from currentProfile
    if (currentProfile) {
        document.getElementById('portalNome').value = currentProfile.nome;
        document.getElementById('portalEmail').value = currentProfile.email;
    }

    // Limpar resto do formulário
    document.getElementById('portalAssunto').value = '';
    document.getElementById('portalDescricao').value = '';
    document.getElementById('portalPrioridade').value = 'media';

    // Esconder categorias e mostrar formulário
    document.querySelector('.categories-section').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('form-section').style.display = 'block';

    // Scroll para o formulário
    setTimeout(() => {
        document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function voltar() {
    currentCategory = null;
    document.getElementById('form-section').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'block';
    document.querySelector('.hero').style.display = 'block';
    document.getElementById('chamadoForm').reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SUBMIT CHAMADO
// ============================================

document.getElementById('chamadoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser || !currentProfile) {
        alert('❌ Você não está autenticado.');
        return;
    }

    // Recuperar dados do formulário
    const titulo = document.getElementById('portalAssunto').value.trim();
    const descricao = document.getElementById('portalDescricao').value.trim();
    const prioridade = document.getElementById('portalPrioridade').value;
    const campoExtra = document.getElementById('campoExtra').value || '';

    if (!titulo || !descricao) {
        alert('❌ Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    try {
        // Gerar código sequencial via RPC
        const { data: codigoData, error: codigoError } = await supabase.rpc('next_chamado_codigo');
        if (codigoError) {
            alert(`❌ Erro ao gerar código: ${codigoError.message}`);
            return;
        }
        const codigo = codigoData;

        const { data, error } = await supabase
            .from('chamados')
            .insert({
                user_id: currentUser.id,
                nome: currentProfile.nome,
                email: currentProfile.email,
                setor: currentProfile.setor || '',
                titulo,
                descricao,
                prioridade,
                tipo_chamado: currentCategory,
                campo_extra: campoExtra,
                status: 'aberto',
                token: generateToken(),
                codigo
            })
            .select()
            .single();

        if (error) {
            alert(`❌ Erro ao criar chamado: ${error.message}`);
            return;
        }

        alert(`✅ Chamado ${data.codigo} aberto com sucesso!\n\nVocê pode acompanhar aqui abaixo.`);

        // Voltar e limpar
        voltar();
        await carregarMeusChamados();

        // Scroll para "Meus Chamados"
        setTimeout(() => {
            document.getElementById('chamados-section').scrollIntoView({ behavior: 'smooth' });
        }, 500);
    } catch (err) {
        alert(`❌ Erro: ${err.message}`);
    }
});

function generateId() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
}

function generateToken() {
    return 'TK-' + Math.random().toString(36).substring(2, 11).toUpperCase();
}

// ============================================
// MEUS CHAMADOS
// ============================================

async function carregarMeusChamados() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('chamados')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        chamadosList = data || [];
        filtrarChamados();
    } catch (err) {
        console.error('Erro ao carregar chamados:', err.message);
        document.getElementById('chamadosLista').innerHTML = `
            <p style="text-align: center; color: #999; padding: 40px;">
                Erro ao carregar chamados.
            </p>
        `;
    }
}

function filtrarChamados() {
    if (chamadosList.length === 0) {
        document.getElementById('chamadosLista').innerHTML = `
            <p style="text-align: center; color: #999; padding: 40px;">
                Você ainda não tem nenhum chamado.
            </p>
        `;
        return;
    }

    // Renderizar chamados
    const html = chamadosList.map(chamado => `
        <div class="chamado-card" onclick="abrirChamado(${chamado.id})">
            <div class="chamado-card-header">
                <div>
                    <div class="chamado-id">${chamado.codigo}</div>
                    <h4 class="chamado-title">${chamado.titulo}</h4>
                </div>
            </div>
            <div class="chamado-meta">
                <span>📁 ${getCategoryLabel(chamado.tipo_chamado)}</span>
                <span>📅 ${new Date(chamado.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="chamado-footer">
                <span class="badge ${chamado.status}">${getStatusLabel(chamado.status)}</span>
                <span class="badge-priority ${chamado.prioridade}">${getPriorityLabel(chamado.prioridade)}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('chamadosLista').innerHTML = html;
}

function getCategoryLabel(cat) {
    const labels = {
        'e_millennium': 'e-Millennium',
        'infra_ti': 'Infra-Estrutura de TI',
        'integracao_terceiros': 'Integração com Terceiros'
    };
    return labels[cat] || cat;
}

function getStatusLabel(status) {
    const labels = {
        'aberto': 'Aberto',
        'em_andamento': 'Em Andamento',
        'aguardando': 'Aguardando Suporte',
        'fechado': 'Fechado'
    };
    return labels[status] || status;
}

function getPriorityLabel(priority) {
    const labels = {
        'baixa': 'Baixa',
        'media': 'Média',
        'alta': 'Alta',
        'critica': 'Crítica'
    };
    return labels[priority] || priority;
}

// ============================================
// MODAL CHAMADO
// ============================================

async function abrirChamado(chamadoId) {
    if (!currentUser) return;

    currentChamadoId = chamadoId;

    try {
        // Fetch chamado details
        const { data: chamado, error: chamadoError } = await supabase
            .from('chamados')
            .select('*')
            .eq('id', chamadoId)
            .eq('user_id', currentUser.id)
            .single();

        if (chamadoError) throw chamadoError;
        if (!chamado) {
            alert('❌ Chamado não encontrado.');
            return;
        }

        // Preencher informações
        document.getElementById('modalChamadoId').textContent = chamado.codigo;
        document.getElementById('modalChamadoStatus').textContent = getStatusLabel(chamado.status);
        document.getElementById('modalChamadoStatus').className = `badge ${chamado.status}`;
        document.getElementById('modalChamadoPrioridade').textContent = getPriorityLabel(chamado.prioridade);
        document.getElementById('modalChamadoPrioridade').className = `badge-priority ${chamado.prioridade}`;
        document.getElementById('modalChamadoData').textContent = new Date(chamado.created_at).toLocaleDateString('pt-BR');
        document.getElementById('modalChamadoDescricao').textContent = chamado.descricao;

        // Mostrar responsável se houver
        const responsavelRow = document.getElementById('modalResponsavelRow');
        if (chamado.responsavel) {
            document.getElementById('modalChamadoResponsavel').textContent = chamado.responsavel;
            responsavelRow.style.display = 'flex';
        } else {
            responsavelRow.style.display = 'none';
        }

        // Carregar chat
        await loadChatMessages(chamadoId);

        // Setup Realtime subscription
        setupChatRealtime(chamadoId);

        // Limpar campo de resposta
        document.getElementById('chatInputPortal').value = '';

        // Mostrar modal
        document.getElementById('chamadoModal').classList.add('show');
    } catch (err) {
        console.error('Erro ao abrir chamado:', err.message);
        alert('❌ Erro ao abrir chamado.');
    }
}

async function loadChatMessages(chamadoId) {
    try {
        const { data: mensagens, error } = await supabase
            .from('mensagens')
            .select('*')
            .eq('chamado_id', chamadoId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const chatHistory = document.getElementById('chatHistory');

        if (!mensagens || mensagens.length === 0) {
            chatHistory.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma mensagem ainda</p>';
        } else {
            chatHistory.innerHTML = mensagens.map(msg => `
                <div class="chat-message ${msg.remetente}">
                    <div class="chat-message-header">
                        <strong>${msg.nome}</strong>
                        <span class="chat-message-time">${new Date(msg.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div class="chat-message-text">${msg.texto}</div>
                </div>
            `).join('');
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    } catch (err) {
        console.error('Erro ao carregar mensagens:', err.message);
    }
}

function setupChatRealtime(chamadoId) {
    // Unsubscribe from previous channel if exists
    if (window._chatChannel) {
        window._chatChannel.unsubscribe();
    }

    // Subscribe to new messages
    window._chatChannel = supabase
        .channel(`chat-${chamadoId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'mensagens',
                filter: `chamado_id=eq.${chamadoId}`
            },
            () => {
                loadChatMessages(chamadoId);
            }
        )
        .subscribe();
}

function fecharModalChamado() {
    document.getElementById('chamadoModal').classList.remove('show');
    currentChamadoId = null;

    // Unsubscribe from realtime
    if (window._chatChannel) {
        window._chatChannel.unsubscribe();
        window._chatChannel = null;
    }
}

async function submitChamado(e) {
    e.preventDefault();

    if (!currentUser || !currentProfile) {
        alert('❌ Você precisa estar logado para abrir um chamado.');
        return;
    }

    const nome = document.getElementById('portalNome').value.trim();
    const email = document.getElementById('portalEmail').value.trim();
    const titulo = document.getElementById('portalAssunto').value.trim();
    const descricao = document.getElementById('portalDescricao').value.trim();
    const prioridade = document.getElementById('portalPrioridade').value;
    const campoExtra = document.getElementById('campoExtra').value;

    if (!nome || !email || !titulo || !descricao) {
        alert('❌ Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    try {
        // Gerar código do chamado
        const { data: codigoData, error: codigoError } = await supabase
            .rpc('next_chamado_codigo');

        if (codigoError) throw codigoError;

        const codigo = codigoData;

        // Inserir chamado
        const { error } = await supabase
            .from('chamados')
            .insert({
                codigo,
                user_id: currentUser.id,
                nome,
                email,
                titulo,
                descricao,
                prioridade,
                tipo_chamado: currentCategory || 'geral',
                campo_extra: campoExtra || null,
                status: 'aberto'
            });

        if (error) throw error;

        alert(`✅ Chamado ${codigo} aberto com sucesso!`);
        document.getElementById('chamadoForm').reset();

        // Limpar campos
        document.getElementById('campoExtraContainer').style.display = 'none';
        currentCategory = null;

        // Voltar para seção de chamados
        setTimeout(() => {
            document.getElementById('form-section').style.display = 'none';
            document.getElementById('chamados-section').style.display = 'block';
            carregarMeusChamados();
        }, 500);

    } catch (err) {
        console.error('Erro ao abrir chamado:', err.message);
        alert(`❌ Erro: ${err.message}`);
    }
}

async function submitPortalChat(e) {
    e.preventDefault();

    const texto = document.getElementById('chatInputPortal').value.trim();

    if (!texto || !currentChamadoId || !currentUser || !currentProfile) {
        alert('❌ Erro: dados incompletos.');
        return;
    }

    try {
        const { error } = await supabase
            .from('mensagens')
            .insert({
                chamado_id: currentChamadoId,
                user_id: currentUser.id,
                remetente: 'colaborador',
                nome: currentProfile.nome,
                texto
            });

        if (error) throw error;

        // Limpar input
        document.getElementById('chatInputPortal').value = '';

        // Realtime will automatically refresh chat via subscription
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err.message);
        alert(`❌ Erro ao enviar mensagem: ${err.message}`);
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    const modal = document.getElementById('chamadoModal');
    if (e.target === modal) {
        fecharModalChamado();
    }
});

// Expor funções para global scope
window.handlePortalLogin = handlePortalLogin;
window.handlePortalRegister = handlePortalRegister;
window.handlePortalLogout = handlePortalLogout;
window.toggleAuthSection = toggleAuthSection;
window.selecionarCategoria = selecionarCategoria;
window.submitChamado = submitChamado;
window.abrirChamado = abrirChamado;
window.fecharModalChamado = fecharModalChamado;
window.submitPortalChat = submitPortalChat;
window.voltar = voltar;
window.carregarMeusChamados = carregarMeusChamados;
window.filtrarChamados = filtrarChamados;
