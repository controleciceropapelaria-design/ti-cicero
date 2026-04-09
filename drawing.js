// ============================================
// EDITOR DE PLANTA - drawing.js
// ============================================

class DrawingEditor {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.history = [];
        this.currentTool = 'rect';
        this.fillColor = '#1f2937';
        this.shapes = [];
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadPlanta();
    }

    setupCanvas() {
        const wrapper = document.querySelector('.drawing-canvas-wrapper');
        this.canvas.setAttribute('width', wrapper.clientWidth);
        this.canvas.setAttribute('height', wrapper.clientHeight);
    }

    setupEventListeners() {
        // Ferramentas
        document.querySelectorAll('input[name="tool"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.currentTool = e.target.value;
            });
        });

        // Cor
        document.getElementById('fillColor').addEventListener('change', (e) => {
            this.fillColor = e.target.value;
        });

        // Canvas eventos
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', (e) => this.stopDrawing(e));
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
        this.canvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));

        // Botões
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('savePlantaBtn').addEventListener('click', () => this.savePlanta());

        // Redimensionar canvas
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.redraw();
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;

        // Salvar estado anterior
        this.saveToHistory();
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        this.redraw();
        this.drawShape(this.startX, this.startY, currentX, currentY, true);
    }

    stopDrawing(e) {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        if (e) {
            const rect = this.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;

            // Adicionar à lista de shapes
            if (this.currentTool === 'text') {
                const text = prompt('Digite o texto:');
                if (text) {
                    this.shapes.push({
                        type: 'text',
                        x: this.startX,
                        y: this.startY,
                        text: text,
                        color: this.fillColor
                    });
                }
            } else {
                this.shapes.push({
                    type: this.currentTool,
                    x1: this.startX,
                    y1: this.startY,
                    x2: endX,
                    y2: endY,
                    color: this.fillColor
                });
            }
        }

        this.redraw();
    }

    handleTouch(e, type) {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(
            type === 'start' ? 'mousedown' : type === 'move' ? 'mousemove' : 'mouseup',
            {
                clientX: touch.clientX,
                clientY: touch.clientY
            }
        );
        this.canvas.dispatchEvent(mouseEvent);
    }

    drawShape(x1, y1, x2, y2, isPreview = false) {
        const ctx = this.canvas;

        switch (this.currentTool) {
            case 'rect':
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', Math.min(x1, x2));
                rect.setAttribute('y', Math.min(y1, y2));
                rect.setAttribute('width', Math.abs(x2 - x1));
                rect.setAttribute('height', Math.abs(y2 - y1));
                rect.setAttribute('fill', this.fillColor);
                rect.setAttribute('stroke', '#60a5fa');
                rect.setAttribute('stroke-width', '2');
                if (!isPreview) {
                    ctx.appendChild(rect);
                } else {
                    const preview = document.getElementById('preview-shape');
                    if (preview) preview.remove();
                    rect.id = 'preview-shape';
                    ctx.appendChild(rect);
                }
                break;

            case 'circle':
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                circle.setAttribute('cx', centerX);
                circle.setAttribute('cy', centerY);
                circle.setAttribute('r', radius);
                circle.setAttribute('fill', this.fillColor);
                circle.setAttribute('stroke', '#60a5fa');
                circle.setAttribute('stroke-width', '2');
                if (!isPreview) {
                    ctx.appendChild(circle);
                } else {
                    const preview = document.getElementById('preview-shape');
                    if (preview) preview.remove();
                    circle.id = 'preview-shape';
                    ctx.appendChild(circle);
                }
                break;

            case 'line':
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', this.fillColor);
                line.setAttribute('stroke-width', '3');
                line.setAttribute('stroke-linecap', 'round');
                if (!isPreview) {
                    ctx.appendChild(line);
                } else {
                    const preview = document.getElementById('preview-shape');
                    if (preview) preview.remove();
                    line.id = 'preview-shape';
                    ctx.appendChild(line);
                }
                break;
        }
    }

    redraw() {
        // Limpar canvas
        while (this.canvas.firstChild) {
            this.canvas.removeChild(this.canvas.firstChild);
        }

        // Redesenhar todos os shapes
        this.shapes.forEach(shape => {
            if (shape.type === 'rect') {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', Math.min(shape.x1, shape.x2));
                rect.setAttribute('y', Math.min(shape.y1, shape.y2));
                rect.setAttribute('width', Math.abs(shape.x2 - shape.x1));
                rect.setAttribute('height', Math.abs(shape.y2 - shape.y1));
                rect.setAttribute('fill', shape.color);
                rect.setAttribute('stroke', '#60a5fa');
                rect.setAttribute('stroke-width', '2');
                this.canvas.appendChild(rect);
            } else if (shape.type === 'circle') {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const radius = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2)) / 2;
                const centerX = (shape.x1 + shape.x2) / 2;
                const centerY = (shape.y1 + shape.y2) / 2;
                circle.setAttribute('cx', centerX);
                circle.setAttribute('cy', centerY);
                circle.setAttribute('r', radius);
                circle.setAttribute('fill', shape.color);
                circle.setAttribute('stroke', '#60a5fa');
                circle.setAttribute('stroke-width', '2');
                this.canvas.appendChild(circle);
            } else if (shape.type === 'line') {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', shape.x1);
                line.setAttribute('y1', shape.y1);
                line.setAttribute('x2', shape.x2);
                line.setAttribute('y2', shape.y2);
                line.setAttribute('stroke', shape.color);
                line.setAttribute('stroke-width', '3');
                line.setAttribute('stroke-linecap', 'round');
                this.canvas.appendChild(line);
            } else if (shape.type === 'text') {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', shape.x);
                text.setAttribute('y', shape.y);
                text.setAttribute('fill', shape.color);
                text.setAttribute('font-size', '16');
                text.setAttribute('font-family', 'Arial');
                text.textContent = shape.text;
                this.canvas.appendChild(text);
            }
        });
    }

    saveToHistory() {
        this.history.push(JSON.stringify(this.shapes));
        if (this.history.length > 20) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0) return;

        this.history.pop(); // Remove o estado atual
        const previousState = this.history[this.history.length - 1];

        if (previousState) {
            this.shapes = JSON.parse(previousState);
        } else {
            this.shapes = [];
        }

        this.redraw();
    }

    clear() {
        if (confirm('Deseja limpar todo o desenho?')) {
            this.saveToHistory();
            this.shapes = [];
            this.redraw();
        }
    }

    savePlanta() {
        if (this.shapes.length === 0) {
            alert('Desenhe algo antes de salvar!');
            return;
        }

        // Criar SVG completo
        const svgContent = this.canvas.outerHTML;

        // Salvar em localStorage
        localStorage.setItem('ti_cicero_planta', svgContent);

        // Também fazer download
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `planta-${new Date().toISOString().split('T')[0]}.svg`;
        link.click();
        URL.revokeObjectURL(url);

        alert('✅ Planta salva com sucesso!');
    }

    loadPlanta() {
        const saved = localStorage.getItem('ti_cicero_planta');
        if (saved) {
            this.canvas.innerHTML = saved;
            // Extrair shapes do SVG salvo
            // Para simplicidade, apenas mostrar o SVG
        }
    }

    exportToMap() {
        const svgContent = this.canvas.outerHTML;
        const mapSvg = document.getElementById('mapSvg');
        if (mapSvg) {
            mapSvg.innerHTML = svgContent;
            alert('✅ Planta carregada no mapa!');
        }
    }
}

// Inicializar editor quando a página de desenho for aberta
let drawingEditor = null;

document.addEventListener('DOMContentLoaded', () => {
    // Monitorar mudança de página
    const observer = new MutationObserver(() => {
        const desenhoPage = document.getElementById('page-desenho');
        if (desenhoPage && desenhoPage.style.display !== 'none' && !drawingEditor) {
            drawingEditor = new DrawingEditor();
        } else if (desenhoPage && desenhoPage.style.display === 'none' && drawingEditor) {
            // Página escondida
        }
    });

    observer.observe(document.body, { subtree: true, attributes: true });
});

// Inicializar quando página ficar visível
function initializeDrawingEditor() {
    if (!drawingEditor) {
        setTimeout(() => {
            drawingEditor = new DrawingEditor();
        }, 100);
    }
}
