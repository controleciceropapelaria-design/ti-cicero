// ============================================
// IMPORTAÇÃO CSV/EXCEL - import.js
// ============================================

function importCSV(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            let devices = [];

            // Detectar tipo de arquivo
            if (file.name.endsWith('.csv')) {
                devices = parseCSV(content);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                devices = parseExcel(file);
                return;
            }

            if (devices.length > 0) {
                showImportPreview(devices);
            } else {
                alert('Nenhum dispositivo encontrado no arquivo. Verifique o formato.');
            }
        } catch (error) {
            alert('Erro ao processar arquivo: ' + error.message);
            console.error(error);
        }
    };

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file, 'UTF-8');
    }
}

function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    // Assumir que primeira linha é cabeçalho
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const devices = [];

    // Encontrar índices das colunas
    const sectorIdx = headers.findIndex(h => h.includes('setor'));
    const codigoIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo'));
    const itemIdx = headers.findIndex(h => h.includes('item'));
    const categoriaIdx = headers.findIndex(h => h.includes('categoria'));

    // Processar linhas
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());

        if (values.length > 1 && values.some(v => v)) { // Verificar se há dados
            const device = {
                setor: values[sectorIdx] || 'N/A',
                codigo: values[codigoIdx] || `AUTO-${i}`,
                item: values[itemIdx] || 'Sem nome',
                categoria: normalizeCategoryName(values[categoriaIdx] || 'periferico')
            };

            if (device.codigo !== 'AUTO-0') { // Skip cabeçalho duplicado
                devices.push(device);
            }
        }
    }

    return devices;
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(worksheet);

            const devices = json.map((row, idx) => {
                return {
                    setor: row['Setor'] || row['setor'] || 'N/A',
                    codigo: row['Código'] || row['codigo'] || `AUTO-${idx}`,
                    item: row['Item'] || row['item'] || 'Sem nome',
                    categoria: normalizeCategoryName(row['Categoria'] || row['categoria'] || 'periferico')
                };
            });

            if (devices.length > 0) {
                showImportPreview(devices);
            }
        } catch (error) {
            alert('Erro ao processar Excel: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

function normalizeCategoryName(name) {
    const normalized = name.toLowerCase().trim();

    if (normalized.includes('computador') || normalized.includes('pc') || normalized.includes('desktop') || normalized.includes('notebook')) {
        return 'computador';
    }
    if (normalized.includes('monitor') || normalized.includes('tela')) {
        return 'monitor';
    }
    if (normalized.includes('mouse') || normalized.includes('teclado') || normalized.includes('headset') || normalized.includes('periferi')) {
        return 'periferico';
    }
    if (normalized.includes('switch') || normalized.includes('roteador') || normalized.includes('impressora') || normalized.includes('rede')) {
        return 'rede_impressora';
    }

    return 'periferico'; // Default
}

function showImportPreview(devices) {
    // Criar preview modal temporário
    const preview = `
        <div id="importPreviewModal" class="modal show">
            <div class="modal-content" style="max-width: 700px;">
                <span class="close" onclick="closeImportPreview()">&times;</span>
                <h2>📥 Preview de Importação</h2>
                <p>Serão importados <strong>${devices.length}</strong> dispositivos:</p>

                <div style="max-height: 400px; overflow-y: auto; margin: 20px 0; border: 1px solid #ddd; border-radius: 4px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                                <th style="padding: 10px; text-align: left;">Setor</th>
                                <th style="padding: 10px; text-align: left;">Código</th>
                                <th style="padding: 10px; text-align: left;">Item</th>
                                <th style="padding: 10px; text-align: left;">Categoria</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devices.map(d => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px;">${d.setor}</td>
                                    <td style="padding: 10px;"><strong>${d.codigo}</strong></td>
                                    <td style="padding: 10px;">${d.item}</td>
                                    <td style="padding: 10px;">
                                        <span class="category-badge ${d.categoria}" style="font-size: 0.8em;">
                                            ${dataManager.getCategoryLabel(d.categoria)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="margin: 20px 0;">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="appendOption" checked>
                        <span>Adicionar aos dispositivos existentes</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-top: 10px;">
                        <input type="checkbox" id="replaceOption">
                        <span>Substituir todos os dispositivos</span>
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="closeImportPreview()">Cancelar</button>
                    <button class="btn btn-primary" onclick="confirmImport('${JSON.stringify(devices).replace(/'/g, "&apos;")}')">✅ Importar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', preview);

    // Sincronizar checkboxes
    document.getElementById('appendOption').addEventListener('change', function () {
        if (this.checked) document.getElementById('replaceOption').checked = false;
    });
    document.getElementById('replaceOption').addEventListener('change', function () {
        if (this.checked) document.getElementById('appendOption').checked = false;
    });
}

function closeImportPreview() {
    const modal = document.getElementById('importPreviewModal');
    if (modal) modal.remove();
}

function confirmImport(devicesJson) {
    try {
        const devices = JSON.parse(devicesJson);
        const replace = document.getElementById('replaceOption').checked;

        if (replace) {
            dataManager.devices = [];
        }

        // Importar dispositivos
        devices.forEach(device => {
            // Verificar se código já existe
            const exists = dataManager.devices.some(d => d.codigo === device.codigo);
            if (!exists) {
                dataManager.addDevice(device);
            }
        });

        dataManager.updateUI();
        dataManager.filterDevices();

        // Fechar preview
        closeImportPreview();

        // Fechar input de arquivo
        document.getElementById('csvFile').value = '';

        alert(`✅ ${devices.length} dispositivos importados com sucesso!`);

        // Atualizar mapa
        if (document.getElementById('mapa').classList.contains('active')) {
            initializeMap();
        }
    } catch (error) {
        alert('Erro ao importar: ' + error.message);
    }
}
