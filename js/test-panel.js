// Panel de control para testing
class TestPanel {
    constructor() {
        this.isVisible = false;
        this.init();
    }

    init() {
        this.createPanel();
        this.bindEvents();
        
        // Solo mostrar en desarrollo
        if (window.location.hostname === 'localhost') {
            this.addToggleButton();
        }
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'test-panel';
        panel.className = 'test-panel';
        panel.innerHTML = `
            <div class="test-panel-header">
                <h3>🧪 Panel de Testing</h3>
                <button id="close-test-panel" class="btn-close">&times;</button>
            </div>
            <div class="test-panel-content">
                <div class="test-section">
                    <h4>Tests Unitarios</h4>
                    <button id="run-auth-tests" class="test-btn">Auth Tests</button>
                    <button id="run-security-tests" class="test-btn">Security Tests</button>
                    <button id="run-all-tests" class="test-btn primary">Ejecutar Todos</button>
                </div>
                
                <div class="test-section">
                    <h4>Herramientas</h4>
                    <button id="clear-storage" class="test-btn">Limpiar Storage</button>
                    <button id="load-sample-data" class="test-btn">Cargar Datos</button>
                    <button id="show-performance" class="test-btn">Performance</button>
                </div>
                
                <div class="test-section">
                    <h4>Búsqueda</h4>
                    <button id="init-search" class="test-btn">Inicializar Búsqueda</button>
                    <button id="rebuild-index" class="test-btn">Reconstruir Índice</button>
                </div>
                
                <div id="test-results" class="test-results"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    addToggleButton() {
        const button = document.createElement('button');
        button.id = 'toggle-test-panel';
        button.className = 'test-toggle-btn';
        button.innerHTML = '🧪';
        button.title = 'Abrir Panel de Testing';
        
        document.body.appendChild(button);
        
        button.addEventListener('click', () => this.toggle());
    }

    bindEvents() {
        // Cerrar panel
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-test-panel') {
                this.hide();
            }
        });

        // Tests
        document.addEventListener('click', (e) => {
            const id = e.target.id;
            
            switch (id) {
                case 'run-auth-tests':
                    this.runTest('Auth', () => window.runAuthTests());
                    break;
                case 'run-security-tests':
                    this.runTest('Security', () => window.runSecurityTests());
                    break;
                case 'run-all-tests':
                    this.runAllTests();
                    break;
                case 'clear-storage':
                    this.clearStorage();
                    break;
                case 'load-sample-data':
                    this.loadSampleData();
                    break;
                case 'show-performance':
                    this.showPerformance();
                    break;
                case 'init-search':
                    this.initSearch();
                    break;
                case 'rebuild-index':
                    this.rebuildSearchIndex();
                    break;
            }
        });
    }

    async runTest(name, testFn) {
        const results = document.getElementById('test-results');
        results.innerHTML = `<div class="test-running">Ejecutando ${name} tests...</div>`;
        
        try {
            await testFn();
            results.innerHTML = `<div class="test-success">✅ ${name} tests completados</div>`;
        } catch (error) {
            results.innerHTML = `<div class="test-error">❌ Error en ${name} tests: ${error.message}</div>`;
        }
    }

    async runAllTests() {
        const results = document.getElementById('test-results');
        results.innerHTML = '<div class="test-running">Ejecutando todos los tests...</div>';
        
        const tests = [
            { name: 'Auth', fn: window.runAuthTests },
            { name: 'Security', fn: window.runSecurityTests }
        ];
        
        let allPassed = true;
        const testResults = [];
        
        for (const test of tests) {
            try {
                await test.fn();
                testResults.push(`✅ ${test.name}: OK`);
            } catch (error) {
                testResults.push(`❌ ${test.name}: ${error.message}`);
                allPassed = false;
            }
        }
        
        const status = allPassed ? 'test-success' : 'test-error';
        results.innerHTML = `<div class="${status}">${testResults.join('<br>')}</div>`;
    }

    clearStorage() {
        localStorage.clear();
        sessionStorage.clear();
        
        const results = document.getElementById('test-results');
        results.innerHTML = '<div class="test-success">✅ Storage limpiado</div>';
        
        // Notificar
        if (window.notificationManager) {
            window.notificationManager.info('Storage limpiado correctamente');
        }
    }

    loadSampleData() {
        if (window.Utils && window.Utils.loadSampleData) {
            window.Utils.loadSampleData();
            
            const results = document.getElementById('test-results');
            results.innerHTML = '<div class="test-success">✅ Datos de ejemplo cargados</div>';
            
            if (window.notificationManager) {
                window.notificationManager.success('Datos de ejemplo cargados');
            }
        }
    }

    showPerformance() {
        if (window.performanceOptimizer) {
            const metrics = window.performanceOptimizer.getPerformanceMetrics();
            
            const results = document.getElementById('test-results');
            results.innerHTML = `
                <div class="performance-metrics">
                    <h5>📊 Métricas de Performance</h5>
                    <p><strong>Cache Hits:</strong> ${metrics.cacheHits}</p>
                    <p><strong>Cache Misses:</strong> ${metrics.cacheMisses}</p>
                    <p><strong>Cache Size:</strong> ${metrics.cacheSize}</p>
                    <p><strong>Image Cache:</strong> ${metrics.imageCacheSize}</p>
                    ${metrics.memoryUsage ? `
                        <p><strong>Memoria Usada:</strong> ${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB</p>
                        <p><strong>Memoria Total:</strong> ${Math.round(metrics.memoryUsage.total / 1024 / 1024)}MB</p>
                    ` : ''}
                </div>
            `;
        }
    }

    initSearch() {
        if (!window.searchManager) {
            window.searchManager = new SearchManager();
            
            const results = document.getElementById('test-results');
            results.innerHTML = '<div class="test-success">✅ Sistema de búsqueda inicializado</div>';
        } else {
            const results = document.getElementById('test-results');
            results.innerHTML = '<div class="test-info">ℹ️ Sistema de búsqueda ya está activo</div>';
        }
    }

    rebuildSearchIndex() {
        if (window.searchManager) {
            window.searchManager.buildSearchIndex();
            
            const results = document.getElementById('test-results');
            results.innerHTML = '<div class="test-success">✅ Índice de búsqueda reconstruido</div>';
        }
    }

    show() {
        const panel = document.getElementById('test-panel');
        if (panel) {
            panel.classList.add('visible');
            this.isVisible = true;
        }
    }

    hide() {
        const panel = document.getElementById('test-panel');
        if (panel) {
            panel.classList.remove('visible');
            this.isVisible = false;
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// CSS para el panel de testing
const testPanelStyles = `
.test-toggle-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #667eea;
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.test-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 500px;
    max-height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
}

.test-panel.visible {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
}

.test-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.test-panel-header h3 {
    margin: 0;
    color: #333;
}

.btn-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.test-panel-content {
    padding: 20px;
    max-height: 500px;
    overflow-y: auto;
}

.test-section {
    margin-bottom: 20px;
}

.test-section h4 {
    margin: 0 0 10px 0;
    color: #555;
    font-size: 14px;
    text-transform: uppercase;
}

.test-btn {
    padding: 8px 16px;
    margin: 4px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.test-btn:hover {
    background: #f8f9fa;
}

.test-btn.primary {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.test-results {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    font-family: monospace;
    font-size: 12px;
    min-height: 100px;
}

.test-running {
    color: #ffc107;
}

.test-success {
    color: #28a745;
}

.test-error {
    color: #dc3545;
}

.test-info {
    color: #17a2b8;
}

.performance-metrics p {
    margin: 5px 0;
    font-size: 11px;
}
`;

const testPanelStyleSheet = document.createElement('style');
testPanelStyleSheet.textContent = testPanelStyles;
document.head.appendChild(testPanelStyleSheet);

window.TestPanel = TestPanel;