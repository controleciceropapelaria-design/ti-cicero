// ============================================
// TI-CICERO - Main App Entry Point (v2.0 Supabase)
// ============================================

import { supabase } from './supabase-config.js';
import './chamados.js';
import './ativos.js';
import './funcionarios.js';
import './dashboard.js';
import './erp-navigation.js';

let currentUser = null;
let currentProfile = null;

// ============================================
// AUTH MANAGEMENT
// ============================================

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('authErrorMsg');

    try {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            return;
        }

        // Verificar se é admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            await supabase.auth.signOut();
            errorMsg.textContent = 'Acesso negado. Apenas administradores podem acessar este painel.';
            errorMsg.style.display = 'block';
            return;
        }

        currentUser = data.user;
        currentProfile = profile;
        showApp();
    } catch (err) {
        errorMsg.textContent = 'Erro ao fazer login: ' + err.message;
        errorMsg.style.display = 'block';
    }
}

async function handleAdminLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        await supabase.auth.signOut();
        currentUser = null;
        currentProfile = null;
        showLoginOverlay();
    }
}

function showLoginOverlay() {
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('appLayout').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function showApp() {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appLayout').style.display = 'grid';
    document.getElementById('userInitial').textContent = currentProfile.nome.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = currentProfile.nome;

    // Inicializar os managers após auth confirmado
    initializeApp();
}

async function initializeApp() {
    try {
        console.log('Inicializando managers...');

        // Aguardar inicialização dos managers
        if (window.chamadosManager && window.ativosManager) {
            await Promise.all([
                window.chamadosManager.init(),
                window.ativosManager.init()
            ]);
            if (window.funcionariosManager) {
                await window.funcionariosManager.init();
            }
            console.log('Managers inicializados com sucesso');
        } else {
            console.error('Managers não encontrados no window');
            return;
        }

        // Inicializar navegação e dashboard
        console.log('Inicializando navegação...');
        if (window.setupNavigation) {
            await window.setupNavigation();
            console.log('Navegação inicializada com sucesso');
        } else {
            console.error('setupNavigation não encontrado no window');
        }

        if (window.updateDashboard) {
            window.updateDashboard();
            console.log('Dashboard atualizado');
        }
    } catch (err) {
        console.error('Erro ao inicializar app:', err);
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('TI-CICERO v2.0 - Iniciando com Supabase...');

    // Verificar sessão existente
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        // Usuário já está autenticado
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile && profile.role === 'admin') {
            currentUser = session.user;
            currentProfile = profile;
            showApp();
        } else {
            // Sessão existe mas não é admin
            await supabase.auth.signOut();
            showLoginOverlay();
        }
    } else {
        // Nenhuma sessão
        showLoginOverlay();
    }
});

// Expor funções no global scope para onclick
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.currentUser = () => currentUser;
window.currentProfile = () => currentProfile;
