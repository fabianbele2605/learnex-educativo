/**
 * Panel de control para pruebas del dashboard
 * Proporciona una interfaz visual para ejecutar y monitorear pruebas
 */

class TestControlPanel {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.currentTest = null;
        this.testHistory = [];
    }

    // === MÉTODOS PRINCIPALES ===
    
    init() {
        this.createPanel();
        this.setupKeyboardShortcuts();
        console.log('🎛️ Panel de Control de Pruebas inicializado');
        console.log('💡 Presiona Ctrl+Shift+T para abrir/cerrar el panel');
        console.log('💡 O usa: showTestPanel() / hideTestPanel()');
    }

    createPanel() {
        // Crear el panel HTML
        const panelHTML = `
            <div id="test-control-panel" class="test-panel hidden">
                <div class="test-panel-header">
                    <h3>🧪 Panel de Control de Pruebas</h3>
                    <button class="test-panel-close" onclick="window.testPanel.hide()">&times;</button>
                </div>
                
                <div class="test-panel-content">
                    <!-- Sección de configuración -->
                    <div class="test-section">
                        <h4>⚙️ Configuración</h4>
                        <div class="test-controls">
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.setupTestData()">
                                📊 Cargar Datos de Prueba
                            </button>
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.clearTestData()">
                                🧹 Limpiar Datos de Prueba
                            </button>
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.validateTestData()">
                                ✅ Validar Datos
                            </button>
                        </div>
                    </div>
                    
                    <!-- Sección de pruebas individuales -->
                    <div class="test-section">
                        <h4>🔍 Pruebas Individuales</h4>
                        <div class="test-controls">
                            <button class="test-btn test-btn-info" onclick="window.testPanel.runNavigationTests()">
                                🧭 Pruebas de Navegación
                            </button>
                            <button class="test-btn test-btn-info" onclick="window.testPanel.runFunctionalityTests()">
                                ⚙️ Pruebas de Funcionalidades
                            </button>
                            <button class="test-btn test-btn-info" onclick="window.testPanel.runRoleTests()">
                                👥 Pruebas de Roles
                            </button>
                            <button class="test-btn test-btn-info" onclick="window.testPanel.runSPATests()">
                                🔄 Pruebas SPA
                            </button>
                        </div>
                    </div>
                    
                    <!-- Sección de pruebas completas -->
                    <div class="test-section">
                        <h4>🚀 Pruebas Completas</h4>
                        <div class="test-controls">
                            <button class="test-btn test-btn-primary" onclick="window.testPanel.runAllTests()">
                                🧪 Ejecutar Todas las Pruebas
                            </button>
                            <button class="test-btn test-btn-warning" onclick="window.testPanel.stopTests()">
                                ⏹️ Detener Pruebas
                            </button>
                        </div>
                    </div>
                    
                    <!-- Sección de estado -->
                    <div class="test-section">
                        <h4>📊 Estado Actual</h4>
                        <div id="test-status" class="test-status">
                            <div class="status-item">
                                <span class="status-label">Estado:</span>
                                <span id="test-current-status" class="status-value">Listo</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Progreso:</span>
                                <div class="progress-bar">
                                    <div id="test-progress" class="progress-fill" style="width: 0%"></div>
                                </div>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Última prueba:</span>
                                <span id="test-last-result" class="status-value">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sección de resultados -->
                    <div class="test-section">
                        <h4>📈 Resultados</h4>
                        <div class="test-controls">
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.showResults()">
                                📊 Ver Resultados
                            </button>
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.exportResults()">
                                💾 Exportar Reporte
                            </button>
                            <button class="test-btn test-btn-secondary" onclick="window.testPanel.clearResults()">
                                🗑️ Limpiar Historial
                            </button>
                        </div>
                    </div>
                    
                    <!-- Log de pruebas -->
                    <div class="test-section">
                        <h4>📝 Log de Pruebas</h4>
                        <div id="test-log" class="test-log"></div>
                        <button class="test-btn test-btn-secondary" onclick="window.testPanel.clearLog()">
                            🧹 Limpiar Log
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', panelHTML);
        this.panel = document.getElementById('test-control-panel');
        
        // Agregar estilos
        this.addStyles();
    }

    addStyles() {
        const styles = `
            <style id="test-panel-styles">
                .test-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    max-height: 80vh;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .test-panel.hidden {
                    transform: translateX(420px);
                    opacity: 0;
                    pointer-events: none;
                }
                
                .test-panel-header {
                    background: #007bff;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .test-panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                }
                
                .test-panel-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .test-panel-close:hover {
                    background-color: rgba(255,255,255,0.2);
                }
                
                .test-panel-content {
                    max-height: calc(80vh - 60px);
                    overflow-y: auto;
                    padding: 0;
                }
                
                .test-section {
                    padding: 15px 20px;
                    border-bottom: 1px solid #eee;
                }
                
                .test-section:last-child {
                    border-bottom: none;
                }
                
                .test-section h4 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #333;
                }
                
                .test-controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .test-btn {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    flex: 1;
                    min-width: 120px;
                }
                
                .test-btn-primary {
                    background: #007bff;
                    color: white;
                }
                
                .test-btn-primary:hover {
                    background: #0056b3;
                }
                
                .test-btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .test-btn-secondary:hover {
                    background: #545b62;
                }
                
                .test-btn-info {
                    background: #17a2b8;
                    color: white;
                }
                
                .test-btn-info:hover {
                    background: #117a8b;
                }
                
                .test-btn-warning {
                    background: #ffc107;
                    color: #212529;
                }
                
                .test-btn-warning:hover {
                    background: #e0a800;
                }
                
                .test-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .test-status {
                    font-size: 12px;
                }
                
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .status-label {
                    font-weight: 600;
                    color: #666;
                }
                
                .status-value {
                    color: #333;
                }
                
                .progress-bar {
                    width: 150px;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: #007bff;
                    transition: width 0.3s ease;
                }
                
                .test-log {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    padding: 10px;
                    max-height: 200px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    line-height: 1.4;
                    margin-bottom: 10px;
                }
                
                .log-entry {
                    margin-bottom: 4px;
                    padding: 2px 0;
                }
                
                .log-success {
                    color: #28a745;
                }
                
                .log-error {
                    color: #dc3545;
                }
                
                .log-info {
                    color: #17a2b8;
                }
                
                .log-warning {
                    color: #ffc107;
                }
                
                @media (max-width: 768px) {
                    .test-panel {
                        width: calc(100vw - 40px);
                        right: 20px;
                        left: 20px;
                    }
                    
                    .test-panel.hidden {
                        transform: translateY(-100vh);
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T para toggle del panel
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggle();
            }
            
            // Escape para cerrar el panel
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    // === MÉTODOS DE CONTROL DEL PANEL ===
    
    show() {
        if (this.panel) {
            this.panel.classList.remove('hidden');
            this.isVisible = true;
            this.log('Panel de pruebas abierto', 'info');
        }
    }

    hide() {
        if (this.panel) {
            this.panel.classList.add('hidden');
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

    // === MÉTODOS DE PRUEBAS ===
    
    async setupTestData() {
        this.updateStatus('Cargando datos de prueba...');
        this.log('Iniciando carga de datos de prueba...', 'info');
        
        try {
            const result = await window.testDataManager.loadTestData();
            if (result) {
                this.log('✅ Datos de prueba cargados exitosamente', 'success');
                this.updateStatus('Datos de prueba cargados');
            } else {
                this.log('❌ Error cargando datos de prueba', 'error');
                this.updateStatus('Error en carga de datos');
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.updateStatus('Error en carga de datos');
        }
    }

    async clearTestData() {
        this.updateStatus('Limpiando datos de prueba...');
        this.log('Iniciando limpieza de datos de prueba...', 'info');
        
        try {
            const result = await window.testDataManager.clearTestData();
            if (result) {
                this.log('🧹 Datos de prueba limpiados exitosamente', 'success');
                this.updateStatus('Datos de prueba limpiados');
            } else {
                this.log('❌ Error limpiando datos de prueba', 'error');
                this.updateStatus('Error en limpieza de datos');
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.updateStatus('Error en limpieza de datos');
        }
    }

    async validateTestData() {
        this.updateStatus('Validando datos de prueba...');
        this.log('Iniciando validación de datos de prueba...', 'info');
        
        try {
            const result = await window.testDataManager.validateTestData();
            this.log(`📊 Usuarios: ${result.users}, Materias: ${result.subjects}, Notas: ${result.grades}`, 'info');
            
            if (result.errors.length > 0) {
                result.errors.forEach(error => this.log(`❌ ${error}`, 'error'));
            } else {
                this.log('✅ Validación completada sin errores', 'success');
            }
            
            this.updateStatus('Validación completada');
        } catch (error) {
            this.log(`❌ Error en validación: ${error.message}`, 'error');
            this.updateStatus('Error en validación');
        }
    }

    async runAllTests() {
        this.updateStatus('Ejecutando todas las pruebas...');
        this.updateProgress(0);
        this.log('🚀 Iniciando suite completa de pruebas...', 'info');
        
        try {
            this.currentTest = 'all';
            const result = await window.dashboardTests.runAllTests();
            
            this.testHistory.push({
                type: 'all',
                timestamp: new Date(),
                result: result
            });
            
            this.updateProgress(100);
            this.updateStatus(`Pruebas completadas: ${result.passed}/${result.total}`);
            this.updateLastResult(`${result.successRate}% éxito`);
            
            this.log(`✅ Pruebas completadas: ${result.passed}/${result.total} (${result.successRate}%)`, 'success');
            
        } catch (error) {
            this.log(`❌ Error ejecutando pruebas: ${error.message}`, 'error');
            this.updateStatus('Error en pruebas');
        } finally {
            this.currentTest = null;
        }
    }

    async runNavigationTests() {
        this.updateStatus('Ejecutando pruebas de navegación...');
        this.log('🧭 Iniciando pruebas de navegación...', 'info');
        
        try {
            await window.dashboardTests.runNavigationTests();
            this.log('✅ Pruebas de navegación completadas', 'success');
            this.updateStatus('Navegación probada');
        } catch (error) {
            this.log(`❌ Error en pruebas de navegación: ${error.message}`, 'error');
            this.updateStatus('Error en navegación');
        }
    }

    async runFunctionalityTests() {
        this.updateStatus('Ejecutando pruebas de funcionalidades...');
        this.log('⚙️ Iniciando pruebas de funcionalidades...', 'info');
        
        try {
            await window.dashboardTests.runFunctionalityTests();
            this.log('✅ Pruebas de funcionalidades completadas', 'success');
            this.updateStatus('Funcionalidades probadas');
        } catch (error) {
            this.log(`❌ Error en pruebas de funcionalidades: ${error.message}`, 'error');
            this.updateStatus('Error en funcionalidades');
        }
    }

    async runRoleTests() {
        this.updateStatus('Ejecutando pruebas de roles...');
        this.log('👥 Iniciando pruebas de roles...', 'info');
        
        try {
            await window.dashboardTests.runRoleBasedTests();
            this.log('✅ Pruebas de roles completadas', 'success');
            this.updateStatus('Roles probados');
        } catch (error) {
            this.log(`❌ Error en pruebas de roles: ${error.message}`, 'error');
            this.updateStatus('Error en roles');
        }
    }

    async runSPATests() {
        this.updateStatus('Ejecutando pruebas SPA...');
        this.log('🔄 Iniciando pruebas de navegación SPA...', 'info');
        
        try {
            await window.dashboardTests.runSPANavigationTests();
            this.log('✅ Pruebas SPA completadas', 'success');
            this.updateStatus('SPA probado');
        } catch (error) {
            this.log(`❌ Error en pruebas SPA: ${error.message}`, 'error');
            this.updateStatus('Error en SPA');
        }
    }

    stopTests() {
        if (this.currentTest) {
            this.log('⏹️ Deteniendo pruebas...', 'warning');
            this.updateStatus('Pruebas detenidas');
            this.currentTest = null;
        } else {
            this.log('ℹ️ No hay pruebas en ejecución', 'info');
        }
    }

    // === MÉTODOS DE RESULTADOS ===
    
    showResults() {
        if (window.dashboardTests.testResults.length === 0) {
            this.log('ℹ️ No hay resultados de pruebas disponibles', 'info');
            return;
        }
        
        const results = window.dashboardTests.testResults;
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        this.log(`📊 Resultados actuales: ${passed}/${total} pruebas exitosas`, 'info');
        
        // Mostrar últimas 5 pruebas
        const recent = results.slice(-5);
        recent.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            this.log(`${status} ${result.id}: ${result.description}`, result.passed ? 'success' : 'error');
        });
    }

    exportResults() {
        if (window.dashboardTests.testResults.length === 0) {
            this.log('ℹ️ No hay resultados para exportar', 'info');
            return;
        }
        
        try {
            window.dashboardTests.generateHTMLReport();
            this.log('💾 Reporte exportado exitosamente', 'success');
        } catch (error) {
            this.log(`❌ Error exportando reporte: ${error.message}`, 'error');
        }
    }

    clearResults() {
        window.dashboardTests.testResults = [];
        this.testHistory = [];
        this.log('🗑️ Historial de resultados limpiado', 'info');
        this.updateStatus('Listo');
        this.updateProgress(0);
        this.updateLastResult('-');
    }

    // === MÉTODOS DE INTERFAZ ===
    
    updateStatus(status) {
        const statusElement = document.getElementById('test-current-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    updateProgress(percentage) {
        const progressElement = document.getElementById('test-progress');
        if (progressElement) {
            progressElement.style.width = `${percentage}%`;
        }
    }

    updateLastResult(result) {
        const resultElement = document.getElementById('test-last-result');
        if (resultElement) {
            resultElement.textContent = result;
        }
    }

    log(message, type = 'info') {
        const logElement = document.getElementById('test-log');
        if (!logElement) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${timestamp}] ${message}`;
        
        logElement.appendChild(entry);
        logElement.scrollTop = logElement.scrollHeight;
        
        // Mantener solo las últimas 100 entradas
        const entries = logElement.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    clearLog() {
        const logElement = document.getElementById('test-log');
        if (logElement) {
            logElement.innerHTML = '';
        }
    }
}

// Inicializar el panel cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.testPanel = new TestControlPanel();
    window.testPanel.init();
});

// Funciones globales para conveniencia
window.showTestPanel = () => window.testPanel?.show();
window.hideTestPanel = () => window.testPanel?.hide();
window.toggleTestPanel = () => window.testPanel?.toggle();

console.log('🎛️ Panel de Control de Pruebas cargado');
console.log('💡 Funciones disponibles:');
console.log('- showTestPanel(): Mostrar panel');
console.log('- hideTestPanel(): Ocultar panel');
console.log('- toggleTestPanel(): Alternar panel');
console.log('- Ctrl+Shift+T: Alternar panel');