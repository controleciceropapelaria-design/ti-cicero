// ============================================
// MAPA INTERATIVO - map.js
// ============================================

let mapEditMode = false;
let draggedMarker = null;
let dragStartX = 0;
let dragStartY = 0;

function initializeMap() {
    const svg = document.getElementById('mapSvg');
    const markersContainer = document.getElementById('mapMarkers');
    const wrapper = document.querySelector('.map-svg-wrapper');

    // Limpar marcadores antigos
    markersContainer.innerHTML = '';

    // Definir tamanho do SVG para cobrir o container
    svg.setAttribute('width', wrapper.clientWidth);
    svg.setAttribute('height', wrapper.clientHeight);

    // Tentar carregar planta salva
    const savedPlanta = localStorage.getItem('ti_cicero_planta');
    if (savedPlanta) {
        svg.innerHTML = savedPlanta;
    } else {
        // Criar SVG base (planta)
        createBasePlanta(svg, wrapper);
    }

    // Renderizar marcadores
    renderMarkers(markersContainer);

    // Configurar botão de modo edição
    setupEditMode();

    // Configurar filtros de categoria
    setupCategoryFilters();
}

function createBasePlanta(svg, wrapper) {
    // Se o usuário carregou um SVG personalizado, ele será usado
    // Enquanto isso, criamos um background simples representando o galpão

    // Adicionar background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', '#f9f9f9');
    svg.appendChild(bg);

    // Desenhar grade
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '25%');
    line1.setAttribute('y1', '0');
    line1.setAttribute('x2', '25%');
    line1.setAttribute('y2', '100%');
    line1.setAttribute('stroke', '#ddd');
    line1.setAttribute('stroke-width', '2');
    svg.appendChild(line1);

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '50%');
    line2.setAttribute('y1', '0');
    line2.setAttribute('x2', '50%');
    line2.setAttribute('y2', '100%');
    line2.setAttribute('stroke', '#ddd');
    line2.setAttribute('stroke-width', '2');
    svg.appendChild(line2);

    const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line3.setAttribute('x1', '75%');
    line3.setAttribute('y1', '0');
    line3.setAttribute('x2', '75%');
    line3.setAttribute('y2', '100%');
    line3.setAttribute('stroke', '#ddd');
    line3.setAttribute('stroke-width', '2');
    svg.appendChild(line3);

    const hline1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hline1.setAttribute('x1', '0');
    hline1.setAttribute('y1', '33%');
    hline1.setAttribute('x2', '100%');
    hline1.setAttribute('y2', '33%');
    hline1.setAttribute('stroke', '#ddd');
    hline1.setAttribute('stroke-width', '2');
    svg.appendChild(hline1);

    const hline2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hline2.setAttribute('x1', '0');
    hline2.setAttribute('y1', '66%');
    hline2.setAttribute('x2', '100%');
    hline2.setAttribute('y2', '66%');
    hline2.setAttribute('stroke', '#ddd');
    hline2.setAttribute('stroke-width', '2');
    svg.appendChild(hline2);

    // Adicionar labels dos setores
    const sectors = ['Setor 1', 'Setor 2', 'Setor 3', 'Setor 4'];
    const positions = [
        { x: '12.5%', y: '16%' },
        { x: '37.5%', y: '16%' },
        { x: '62.5%', y: '16%' },
        { x: '87.5%', y: '16%' }
    ];

    sectors.forEach((sector, i) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', positions[i].x);
        text.setAttribute('y', positions[i].y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#999');
        text.setAttribute('opacity', '0.6');
        text.textContent = sector;
        svg.appendChild(text);
    });

    // Nota sobre carregamento de SVG personalizado
    const note = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    note.setAttribute('x', '50%');
    note.setAttribute('y', '95%');
    note.setAttribute('text-anchor', 'middle');
    note.setAttribute('font-size', '12');
    note.setAttribute('fill', '#999');
    note.textContent = '💡 Carregue sua planta do Illustrator como SVG';
    svg.appendChild(note);
}

function renderMarkers(container) {
    const devices = dataManager.devices;
    const visibleCategories = getVisibleCategories();

    devices.forEach(device => {
        if (!visibleCategories.includes(device.categoria)) {
            return;
        }

        const marker = document.createElement('div');
        marker.className = `map-marker ${device.categoria}`;
        marker.dataset.id = device.id;
        marker.dataset.categoria = device.categoria;

        const x = device.x || (Math.random() * 700 + 100);
        const y = device.y || (Math.random() * 400 + 100);

        marker.style.left = x + 'px';
        marker.style.top = y + 'px';

        // Se as posições eram aleatórias, salvar elas
        if (!device.x || !device.y) {
            device.x = x;
            device.y = y;
        }

        // Ícone
        const icon = getIconForCategory(device.categoria);
        marker.textContent = icon;

        // Eventos
        marker.addEventListener('mouseenter', () => showTooltip(device, marker));
        marker.addEventListener('mouseleave', hideTooltip);
        marker.addEventListener('click', () => showDeviceDetails(device));

        if (mapEditMode) {
            marker.addEventListener('mousedown', startDrag);
            marker.style.cursor = 'move';
        }

        container.appendChild(marker);
    });

    // Salvar posições
    dataManager.saveData();
}

function getIconForCategory(categoria) {
    const icons = {
        'computador': '💻',
        'monitor': '🖥️',
        'periferico': '🖱️',
        'rede_impressora': '🖨️'
    };
    return icons[categoria] || '📦';
}

function getVisibleCategories() {
    const visible = [];
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        if (checkbox.checked) {
            visible.push(checkbox.value);
        }
    });
    return visible;
}

function showTooltip(device, marker) {
    const tooltip = document.getElementById('tooltip');
    const rect = marker.getBoundingClientRect();
    const wrapper = document.querySelector('.map-svg-wrapper');
    const wrapperRect = wrapper.getBoundingClientRect();

    tooltip.innerHTML = `
        <strong>${device.codigo}</strong><br/>
        ${device.item}<br/>
        <small>${device.setor}</small>
    `;

    tooltip.style.display = 'block';
    tooltip.style.left = (rect.left - wrapperRect.left + 20) + 'px';
    tooltip.style.top = (rect.top - wrapperRect.top - 50) + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}

function showDeviceDetails(device) {
    const details = `
        <strong>${device.codigo}</strong><br/>
        <strong>Item:</strong> ${device.item}<br/>
        <strong>Setor:</strong> ${device.setor}<br/>
        <strong>Categoria:</strong> ${dataManager.getCategoryLabel(device.categoria)}<br/>
        <strong>Posição:</strong> X: ${Math.round(device.x)}, Y: ${Math.round(device.y)}<br/>
        <br/>
        <button class="btn btn-small" onclick="dataManager.editDevice('${device.id}')">✏️ Editar</button>
        <button class="btn btn-danger btn-small" onclick="dataManager.confirmDelete('${device.id}'); initializeMap();">🗑️ Deletar</button>
    `;

    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = details;
    tooltip.style.display = 'block';
    tooltip.style.pointerEvents = 'auto';
}

function startDrag(e) {
    if (!mapEditMode) return;

    draggedMarker = e.target.closest('.map-marker');
    if (!draggedMarker) return;

    dragStartX = e.clientX - draggedMarker.offsetLeft;
    dragStartY = e.clientY - draggedMarker.offsetTop;

    draggedMarker.classList.add('dragging');
    draggedMarker.style.zIndex = '1000';

    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', stopDrag);

    e.preventDefault();
}

function moveDrag(e) {
    if (!draggedMarker) return;

    const wrapper = document.querySelector('.map-svg-wrapper');
    const x = e.clientX - wrapper.getBoundingClientRect().left - dragStartX;
    const y = e.clientY - wrapper.getBoundingClientRect().top - dragStartY;

    draggedMarker.style.left = x + 'px';
    draggedMarker.style.top = y + 'px';
}

function stopDrag() {
    if (draggedMarker) {
        const id = draggedMarker.dataset.id;
        const x = parseFloat(draggedMarker.style.left);
        const y = parseFloat(draggedMarker.style.top);

        dataManager.updateDevice(id, { x, y });

        draggedMarker.classList.remove('dragging');
        draggedMarker.style.zIndex = '';
    }

    draggedMarker = null;
    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('mouseup', stopDrag);
}

function setupEditMode() {
    const btn = document.getElementById('toggleEdit');
    btn.addEventListener('click', () => {
        mapEditMode = !mapEditMode;
        btn.textContent = mapEditMode ? '✏️ Modo Normal' : '✏️ Modo Edição';
        btn.classList.toggle('active');

        const markers = document.querySelectorAll('.map-marker');
        markers.forEach(m => {
            m.style.cursor = mapEditMode ? 'move' : 'pointer';
            if (mapEditMode) {
                m.addEventListener('mousedown', startDrag);
            }
        });
    });
}

function setupCategoryFilters() {
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const visibleCategories = getVisibleCategories();
            const markers = document.querySelectorAll('.map-marker');

            markers.forEach(marker => {
                if (visibleCategories.includes(marker.dataset.categoria)) {
                    marker.style.display = 'flex';
                } else {
                    marker.style.display = 'none';
                }
            });
        });
    });
}

function loadCustomPlanta(svgFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const svg = document.getElementById('mapSvg');
        svg.innerHTML = e.target.result.match(/<svg[^>]*>[\s\S]*<\/svg>/i)[0];
        initializeMap();
    };
    reader.readAsText(svgFile);
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => initializeMap(), 100);
});
