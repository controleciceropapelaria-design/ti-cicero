// ============================================
// GERENCIAMENTO DE ATIVOS - ativos.js
// Refactored for Supabase with async database
// ============================================

import { supabase } from './supabase-config.js';

class AtivosManager {
    constructor() {
        this.ativos = [];
        this.setores = [];
        this.currentEditId = null;
    }

    async init() {
        await this.loadSetores();
        await this.loadAtivos();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal novo ativo
        const novoAtivoBtn = document.getElementById('novoAtivoBtn');
        const novoAtivoModal = document.getElementById('novoAtivoModal');
        const closeBtn = novoAtivoModal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelAtivoBtn');
        const form = document.getElementById('novoAtivoForm');

        novoAtivoBtn.addEventListener('click', () => this.openNovoAtivoModal());
        closeBtn.addEventListener('click', () => this.closeNovoAtivoModal());
        cancelBtn.addEventListener('click', () => this.closeNovoAtivoModal());
        form.addEventListener('submit', (e) => this.submitNovoAtivo(e));

        // Mostrar/esconder specs por categoria
        document.getElementById('ativoCategoria').addEventListener('change', (e) => {
            this.toggleSpecsSections(e.target.value);
        });

        // Importar
        document.getElementById('importAtivosBtn').addEventListener('click', () => {
            document.getElementById('ativosFile').click();
        });

        document.getElementById('ativosFile').addEventListener('change', (e) => {
            this.importAtivos(e.files[0]);
        });

        // Filtros
        document.getElementById('ativoSearchInput').addEventListener('input', () => this.renderAtivos());
        document.getElementById('setorAtivosFilter').addEventListener('change', () => this.renderAtivos());
        document.getElementById('statusAtivoFilter').addEventListener('change', () => this.renderAtivos());

        // Preencher select de setores
        this.populateSetorSelect();
    }

    async loadSetores() {
        try {
            const { data, error } = await supabase
                .from('setores')
                .select('nome')
                .order('nome');

            if (error) throw error;
            this.setores = data?.map(s => s.nome) || [];
        } catch (error) {
            console.error('Erro ao carregar setores:', error);
            this.setores = [];
        }
    }

    async addSetor(nome) {
        if (!nome || nome.trim() === '') return false;
        if (this.setores.includes(nome)) return false;

        try {
            const { error } = await supabase
                .from('setores')
                .insert({ nome });

            if (error) throw error;
            await this.loadSetores();
            return true;
        } catch (error) {
            console.error('Erro ao adicionar setor:', error);
            return false;
        }
    }

    async editSetor(oldName, newName) {
        if (!oldName || !newName || newName.trim() === '') return false;

        try {
            // Atualizar setor
            const { error: errorSetores } = await supabase
                .from('setores')
                .update({ nome: newName })
                .eq('nome', oldName);

            if (errorSetores) throw errorSetores;

            // Atualizar setores nos ativos existentes
            const { error: errorAtivos } = await supabase
                .from('ativos')
                .update({ setor: newName })
                .eq('setor', oldName);

            if (errorAtivos) throw errorAtivos;

            await this.loadSetores();
            await this.loadAtivos();
            return true;
        } catch (error) {
            console.error('Erro ao editar setor:', error);
            return false;
        }
    }

    async deleteSetor(nome) {
        try {
            // Verificar se setor tem ativos
            const { data, error: errorCheck } = await supabase
                .from('ativos')
                .select('id')
                .eq('setor', nome);

            if (errorCheck) throw errorCheck;

            const count = data?.length || 0;
            if (count > 0) {
                return {
                    success: false,
                    message: `Não é possível deletar. Existem ${count} ativos neste setor.`
                };
            }

            // Deletar setor
            const { error: errorDelete } = await supabase
                .from('setores')
                .delete()
                .eq('nome', nome);

            if (errorDelete) throw errorDelete;

            await this.loadSetores();
            return { success: true, message: 'Setor deletado com sucesso.' };
        } catch (error) {
            console.error('Erro ao deletar setor:', error);
            return { success: false, message: 'Erro ao deletar setor.' };
        }
    }

    async loadAtivos() {
        try {
            const { data, error } = await supabase
                .from('ativos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.ativos = data || [];
        } catch (error) {
            console.error('Erro ao carregar ativos:', error);
            this.ativos = [];
        }
    }

    populateSetorSelect() {
        const select = document.getElementById('ativoSetor');
        select.innerHTML = this.setores.map(s => `<option value="${s}">${s}</option>`).join('');

        const filterSelect = document.getElementById('setorAtivosFilter');
        filterSelect.innerHTML = '<option value="">Todos os setores</option>' +
            this.setores.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    toggleSpecsSections(categoria) {
        const sections = ['specsMonitor', 'specsPeriferico', 'specsComputador'];
        sections.forEach(id => document.getElementById(id).style.display = 'none');
        document.getElementById('compPlacaMaeGroup').style.display = 'none';

        if (categoria === 'monitor') {
            document.getElementById('specsMonitor').style.display = 'block';
        } else if (categoria === 'periferico') {
            document.getElementById('specsPeriferico').style.display = 'block';
        } else if (categoria === 'computador' || categoria === 'notebook') {
            document.getElementById('specsComputador').style.display = 'block';
            if (categoria === 'computador') {
                document.getElementById('compPlacaMaeGroup').style.display = 'block';
            }
        }
    }

    collectSpecs(categoria) {
        if (categoria === 'monitor') {
            const conexoes = ['connVGA', 'connHDMI', 'connDP', 'connDVI']
                .filter(id => document.getElementById(id).checked)
                .map(id => document.getElementById(id).value);
            return {
                marca: document.getElementById('monitorMarca').value,
                modelo: document.getElementById('monitorModelo').value,
                tamanho_tela: document.getElementById('monitorTamanho').value,
                tipo_painel: document.getElementById('monitorTipo').value,
                conexoes
            };
        }
        if (categoria === 'periferico') {
            return {
                tipo: document.getElementById('perifericoTipo').value,
                marca: document.getElementById('perifericoMarca').value,
                modelo: document.getElementById('perifericoModelo').value
            };
        }
        if (categoria === 'computador' || categoria === 'notebook') {
            const specs = {
                marca: document.getElementById('compMarca').value,
                modelo: document.getElementById('compModelo').value,
                processador: document.getElementById('compProcessador').value,
                nucleos: document.getElementById('compNucleos').value,
                memoria_tipo: document.getElementById('compMemoriaTipo').value,
                memoria_tamanho_gb: document.getElementById('compMemoriaTamanho').value,
                memoria_max_gb: document.getElementById('compMemoriaMax').value,
                sistema: document.getElementById('compSistema').value,
                gpu: document.getElementById('compGpu').value,
                hd_tipo: document.getElementById('compHdTipo').value,
                hd_tamanho_gb: document.getElementById('compHdTamanho').value
            };
            if (categoria === 'computador') {
                specs.placa_mae = document.getElementById('compPlacaMae').value;
            }
            return specs;
        }
        return null;
    }

    openNovoAtivoModal() {
        this.currentEditId = null;
        document.getElementById('novoAtivoForm').reset();
        this.toggleSpecsSections('');
        document.getElementById('novoAtivoModal').classList.add('show');
    }

    closeNovoAtivoModal() {
        document.getElementById('novoAtivoModal').classList.remove('show');
    }

    async submitNovoAtivo(e) {
        e.preventDefault();

        const categoria = document.getElementById('ativoCategoria').value;
        const ativo = {
            codigo: document.getElementById('ativoCodigo').value,
            descricao: document.getElementById('ativoDescricao').value,
            setor: document.getElementById('ativoSetor').value,
            categoria,
            status: document.getElementById('ativoStatus').value,
            valor: parseFloat(document.getElementById('ativoValor').value) || 0,
            specs: this.collectSpecs(categoria)
        };

        try {
            if (this.currentEditId) {
                const { error } = await supabase
                    .from('ativos')
                    .update(ativo)
                    .eq('id', this.currentEditId);
                if (error) throw error;
                alert(`✅ Ativo ${ativo.codigo} atualizado!`);
            } else {
                const { error } = await supabase
                    .from('ativos')
                    .insert([ativo]);
                if (error) throw error;
                alert(`✅ Ativo ${ativo.codigo} cadastrado!`);
            }

            await this.loadAtivos();
            this.closeNovoAtivoModal();
            this.renderAtivos();
        } catch (error) {
            console.error('Erro ao cadastrar ativo:', error);
            if (error.code === '23505') {
                alert(`❌ Já existe um ativo com o código "${ativo.codigo}". Use um código diferente.`);
            } else {
                alert('Erro ao cadastrar ativo: ' + error.message);
            }
        }
    }

    renderAtivos() {
        const searchFilter = document.getElementById('ativoSearchInput').value.toLowerCase();
        const setorFilter = document.getElementById('setorAtivosFilter').value;
        const statusFilter = document.getElementById('statusAtivoFilter').value;

        let filtered = this.ativos;

        if (searchFilter) {
            filtered = filtered.filter(a =>
                a.codigo.toLowerCase().includes(searchFilter) ||
                a.descricao.toLowerCase().includes(searchFilter)
            );
        }

        if (setorFilter) {
            filtered = filtered.filter(a => a.setor === setorFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(a => a.status === statusFilter);
        }

        const tbody = document.getElementById('ativosTableBody');
        tbody.innerHTML = filtered.map(ativo => `
            <tr class="status-${ativo.status}">
                <td><strong>${ativo.codigo}</strong></td>
                <td>${ativo.descricao}</td>
                <td>${ativo.setor}</td>
                <td>
                    <span class="badge-category ${ativo.categoria}">
                        ${this.getCategoryLabel(ativo.categoria)}
                    </span>
                </td>
                <td>
                    <span class="badge-status ${ativo.status}">
                        ${this.getStatusLabel(ativo.status)}
                    </span>
                </td>
                <td>R$ ${ativo.valor.toFixed(2)}</td>
                <td>
                    <button class="btn btn-small" onclick="ativosManager.editAtivo('${ativo.id}')">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="ativosManager.deleteAtivo('${ativo.id}')">Deletar</button>
                </td>
            </tr>
        `).join('');
    }

    editAtivo(id) {
        const ativo = this.ativos.find(a => a.id === id);
        if (!ativo) return;

        this.currentEditId = id;

        document.getElementById('ativoCodigo').value = ativo.codigo;
        document.getElementById('ativoDescricao').value = ativo.descricao;
        document.getElementById('ativoSetor').value = ativo.setor;
        document.getElementById('ativoCategoria').value = ativo.categoria;
        document.getElementById('ativoStatus').value = ativo.status;
        document.getElementById('ativoValor').value = ativo.valor;

        this.toggleSpecsSections(ativo.categoria);

        document.getElementById('novoAtivoModal').classList.add('show');
    }

    async deleteAtivo(id) {
        if (confirm('Deseja deletar este ativo?')) {
            try {
                const { error } = await supabase
                    .from('ativos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                await this.loadAtivos();
                this.renderAtivos();
            } catch (error) {
                console.error('Erro ao deletar ativo:', error);
                alert('Erro ao deletar ativo: ' + error.message);
            }
        }
    }

    async importAtivos(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const rows = json.map((row, idx) => ({
                    codigo: row['CODIGO'] || row['Código'] || `AT-${idx}`,
                    descricao: row['ITEM'] || row['Item'] || row['DESCRIÇÃO'] || '',
                    setor: row['SETOR'] || row['Setor'] || 'N/A',
                    categoria: this.normalizeCategoryName(row['CATEGORIA'] || row['Categoria'] || ''),
                    status: 'disponivel',
                    valor: 0
                }));

                // Upsert com base no código
                const { error } = await supabase
                    .from('ativos')
                    .upsert(rows, { onConflict: 'codigo' });

                if (error) throw error;

                await this.loadAtivos();
                this.renderAtivos();
                alert(`✅ ${json.length} ativos importados!`);
            } catch (error) {
                console.error('Erro ao importar:', error);
                alert('Erro ao importar: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    normalizeCategoryName(name) {
        const normalized = name.toLowerCase().trim();

        if (normalized.includes('notebook') || normalized.includes('laptop')) {
            return 'notebook';
        }
        if (normalized.includes('computador') || normalized.includes('desktop')) {
            return 'computador';
        }
        if (normalized.includes('monitor') || normalized.includes('tela')) {
            return 'monitor';
        }
        if (normalized.includes('teclado') || normalized.includes('mouse') || normalized.includes('headset')) {
            return 'periferico';
        }
        if (normalized.includes('impressora') || normalized.includes('scanner') || normalized.includes('switch') || normalized.includes('roteador')) {
            return 'rede_impressora';
        }
        if (normalized.includes('fonte') || normalized.includes('energia') || normalized.includes('estabilizador')) {
            return 'fonte_energia';
        }

        return 'periferico';
    }

    getCategoryLabel(cat) {
        const labels = {
            'computador': 'Computador',
            'notebook': 'Notebook',
            'monitor': 'Monitor',
            'periferico': 'Periférico',
            'rede_impressora': 'Rede/Impressora',
            'fonte_energia': 'Fonte e Energia'
        };
        return labels[cat] || cat;
    }

    getStatusLabel(status) {
        const labels = {
            'disponivel': 'Disponível',
            'em_uso': 'Em Uso',
            'manutencao': 'Manutenção',
            'descarte': 'Descarte'
        };
        return labels[status] || status;
    }

    getTotalCount() {
        return this.ativos.length;
    }

    getEmUsoCount() {
        return this.ativos.filter(a => a.status === 'em_uso').length;
    }

    getDisponiveisCount() {
        return this.ativos.filter(a => a.status === 'disponivel').length;
    }

    getBySetor(setor) {
        return this.ativos.filter(a => a.setor === setor);
    }

    getByStatus(status) {
        return this.ativos.filter(a => a.status === status).length;
    }

    getByCategory(category) {
        return this.ativos.filter(a => a.categoria === category).length;
    }
}

const ativosManager = new AtivosManager();
window.ativosManager = ativosManager;
window.ativosManager = ativosManager;
