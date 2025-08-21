class ReportsUI {
    constructor() {
        this.reportGenerator = window.reportGenerator;
        this.init();
    }

    init() {
        this.createReportsInterface();
        this.bindEvents();
    }

    createReportsInterface() {
        const reportsSection = document.createElement('div');
        reportsSection.id = 'reports-section';
        reportsSection.className = 'reports-container';
        reportsSection.innerHTML = `
            <div class="reports-header">
                <h2>📊 Generador de Reportes</h2>
                <p>Genera reportes detallados en PDF o Excel</p>
            </div>
            
            <div class="reports-controls">
                <div class="report-type-selector">
                    <label for="reportType">Tipo de Reporte:</label>
                    <select id="reportType" class="form-control">
                        <option value="students">Estudiantes</option>
                        <option value="grades">Calificaciones</option>
                        <option value="attendance">Asistencia</option>
                        <option value="performance">Rendimiento</option>
                        <option value="summary">Resumen Ejecutivo</option>
                    </select>
                </div>
                
                <div class="format-selector">
                    <label for="reportFormat">Formato:</label>
                    <select id="reportFormat" class="form-control">
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                    </select>
                </div>
                
                <div class="date-range">
                    <label for="startDate">Desde:</label>
                    <input type="date" id="startDate" class="form-control">
                    
                    <label for="endDate">Hasta:</label>
                    <input type="date" id="endDate" class="form-control">
                </div>
            </div>
            
            <div class="reports-options">
                <div class="option-group">
                    <h4>Opciones de Filtrado</h4>
                    <div class="filter-options">
                        <label><input type="checkbox" id="includeInactive"> Incluir inactivos</label>
                        <label><input type="checkbox" id="includeStats"> Incluir estadísticas</label>
                        <label><input type="checkbox" id="includeCharts"> Incluir gráficos</label>
                    </div>
                </div>
                
                <div class="option-group">
                    <h4>Configuración Adicional</h4>
                    <div class="config-options">
                        <label for="institutionName">Nombre Institución:</label>
                        <input type="text" id="institutionName" class="form-control" placeholder="Mi Institución">
                        
                        <label for="reportTitle">Título Personalizado:</label>
                        <input type="text" id="reportTitle" class="form-control" placeholder="Título del reporte">
                    </div>
                </div>
            </div>
            
            <div class="reports-actions">
                <button id="previewReport" class="btn btn-secondary">
                    👁️ Vista Previa
                </button>
                <button id="generateReport" class="btn btn-primary">
                    📄 Generar Reporte
                </button>
                <button id="scheduleReport" class="btn btn-info">
                    ⏰ Programar
                </button>
            </div>
            
            <div class="reports-history">
                <h4>Reportes Recientes</h4>
                <div id="reportsHistoryList" class="history-list">
                    <!-- Historial de reportes -->
                </div>
            </div>
            
            <div id="reportProgress" class="progress-container" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p class="progress-text">Generando reporte...</p>
            </div>
        `;
        
        // Insertar en el dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.appendChild(reportsSection);
        }
    }

    bindEvents() {
        document.getElementById('generateReport')?.addEventListener('click', () => {
            this.generateReport();
        });
        
        document.getElementById('previewReport')?.addEventListener('click', () => {
            this.previewReport();
        });
        
        document.getElementById('scheduleReport')?.addEventListener('click', () => {
            this.scheduleReport();
        });
        
        document.getElementById('reportType')?.addEventListener('change', () => {
            this.updateReportOptions();
        });
    }

    async generateReport() {
        try {
            this.showProgress(true);
            
            const reportType = document.getElementById('reportType').value;
            const format = document.getElementById('reportFormat').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            // Obtener datos según el tipo de reporte
            const data = await this.getReportData(reportType, { startDate, endDate });
            
            // Configuración del reporte
            const options = {
                institution: document.getElementById('institutionName').value || 'Sistema Educativo',
                title: document.getElementById('reportTitle').value || this.reportGenerator.templates[reportType],
                includeInactive: document.getElementById('includeInactive').checked,
                includeStats: document.getElementById('includeStats').checked,
                includeCharts: document.getElementById('includeCharts').checked,
                dateRange: { startDate, endDate }
            };
            
            // Generar reporte
            const result = await this.reportGenerator.generateCustomReport(reportType, data, format, options);
            
            if (result.success) {
                this.showSuccess(`Reporte generado: ${result.filename}`);
                this.addToHistory(reportType, format, result.filename);
            } else {
                this.showError(`Error: ${result.error}`);
            }
            
        } catch (error) {
            this.showError(`Error generando reporte: ${error.message}`);
        } finally {
            this.showProgress(false);
        }
    }

    async getReportData(reportType, filters = {}) {
        // Simular obtención de datos del sistema
        switch(reportType) {
            case 'students':
                return this.getStudentsData(filters);
            case 'grades':
                return this.getGradesData(filters);
            case 'attendance':
                return this.getAttendanceData(filters);
            case 'performance':
                return this.getPerformanceData(filters);
            case 'summary':
                return this.getSummaryData(filters);
            default:
                return [];
        }
    }

    getStudentsData(filters) {
        // Obtener datos de estudiantes del sistema
        const students = window.testData?.students || [];
        return students.filter(student => {
            if (filters.startDate && student.registrationDate < filters.startDate) return false;
            if (filters.endDate && student.registrationDate > filters.endDate) return false;
            return true;
        });
    }

    getGradesData(filters) {
        // Obtener calificaciones del sistema
        const grades = window.testData?.grades || [];
        return grades.filter(grade => {
            if (filters.startDate && grade.date < filters.startDate) return false;
            if (filters.endDate && grade.date > filters.endDate) return false;
            return true;
        });
    }

    showProgress(show) {
        const progressContainer = document.getElementById('reportProgress');
        if (progressContainer) {
            progressContainer.style.display = show ? 'block' : 'none';
        }
    }

    showSuccess(message) {
        // Mostrar mensaje de éxito
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.textContent = message;
        document.getElementById('reports-section').prepend(alert);
        
        setTimeout(() => alert.remove(), 5000);
    }

    showError(message) {
        // Mostrar mensaje de error
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = message;
        document.getElementById('reports-section').prepend(alert);
        
        setTimeout(() => alert.remove(), 5000);
    }

    addToHistory(type, format, filename) {
        const historyList = document.getElementById('reportsHistoryList');
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span class="report-info">${type} (${format.toUpperCase()})</span>
            <span class="report-date">${new Date().toLocaleString()}</span>
            <span class="report-file">${filename}</span>
        `;
        
        historyList.prepend(historyItem);
        
        // Mantener solo los últimos 10 reportes
        while (historyList.children.length > 10) {
            historyList.removeChild(historyList.lastChild);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.reportsUI = new ReportsUI();
});