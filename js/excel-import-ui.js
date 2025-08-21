class ExcelImportUI {
    constructor() {
        this.validator = new ExcelValidator();
        this.currentFile = null;
        this.validationResult = null;
        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Drag & Drop
        const dropZone = document.getElementById('excel-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
            dropZone.addEventListener('drop', this.handleDrop.bind(this));
            dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }

        // File input
        const fileInput = document.getElementById('excel-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // Botones
        const validateBtn = document.getElementById('validate-excel-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', this.validateFile.bind(this));
        }

        const importBtn = document.getElementById('import-excel-btn');
        if (importBtn) {
            importBtn.addEventListener('click', this.importFile.bind(this));
        }
    }

    // Manejar drag over
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    // Manejar drag leave
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    // Manejar drop
    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    // Manejar selección de archivo
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    // Procesar archivo seleccionado
    handleFile(file) {
        this.currentFile = file;
        this.displayFileInfo(file);
        this.enableValidationButton();
    }

    // Mostrar información del archivo
    displayFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <div class="file-details">
                    <h4>📄 Archivo Seleccionado</h4>
                    <p><strong>Nombre:</strong> ${file.name}</p>
                    <p><strong>Tamaño:</strong> ${this.formatFileSize(file.size)}</p>
                    <p><strong>Tipo:</strong> ${file.type}</p>
                    <p><strong>Última modificación:</strong> ${new Date(file.lastModified).toLocaleString()}</p>
                </div>
            `;
        }
    }

    // Formatear tamaño de archivo
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Habilitar botón de validación
    enableValidationButton() {
        const validateBtn = document.getElementById('validate-excel-btn');
        if (validateBtn) {
            validateBtn.disabled = false;
            validateBtn.classList.remove('disabled');
        }
    }

    // Validar archivo
    async validateFile() {
        if (!this.currentFile) {
            this.showError('No hay archivo seleccionado');
            return;
        }

        this.showLoading('Validando archivo...');
        
        try {
            // Configurar reglas de validación según el tipo de importación
            this.setupValidationRules();
            
            // Ejecutar validación
            this.validationResult = await this.validator.validateExcelFile(this.currentFile);
            
            // Mostrar resultados
            this.displayValidationResults();
            
        } catch (error) {
            this.showError(`Error durante la validación: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    // Configurar reglas de validación
    setupValidationRules() {
        // Reglas para importación de estudiantes
        const studentRules = {
            required: ['Nombre', 'Apellido', 'Email', 'DNI'],
            dataTypes: {
                'Nombre': 'string',
                'Apellido': 'string',
                'Email': 'email',
                'DNI': 'dni',
                'Teléfono': 'phone',
                'Fecha_Nacimiento': 'date',
                'Edad': 'number'
            },
            ranges: {
                'Edad': { min: 16, max: 80 },
                'DNI': { min: 1000000, max: 99999999 }
            },
            customValidators: {
                'Email': (value) => {
                    // Validar que el email no esté duplicado en la base de datos
                    const existingUser = window.database.getUserByEmail(value);
                    if (existingUser) {
                        return `El email ${value} ya está registrado`;
                    }
                    return true;
                },
                'DNI': (value) => {
                    // Validar que el DNI no esté duplicado
                    const existingUser = window.database.getUserByDNI(value);
                    if (existingUser) {
                        return `El DNI ${value} ya está registrado`;
                    }
                    return true;
                }
            }
        };

        this.validator.setValidationRules(studentRules);
    }

    // Mostrar resultados de validación
    displayValidationResults() {
        const resultsContainer = document.getElementById('validation-results');
        if (!resultsContainer) return;

        const result = this.validationResult;
        
        let html = `
            <div class="validation-summary ${result.isValid ? 'valid' : 'invalid'}">
                <h3>${result.isValid ? '✅ Archivo Válido' : '❌ Archivo Inválido'}</h3>
                <div class="summary-stats">
                    <span class="stat-item error">Errores: ${result.summary.totalErrors}</span>
                    <span class="stat-item warning">Advertencias: ${result.summary.totalWarnings}</span>
                </div>
            </div>
        `;

        if (result.errors.length > 0) {
            html += '<div class="errors-section">';
            html += '<h4>🚨 Errores Encontrados</h4>';
            html += '<div class="errors-list">';
            
            result.errors.forEach((error, index) => {
                html += `
                    <div class="error-item">
                        <div class="error-header">
                            <span class="error-number">#${index + 1}</span>
                            <span class="error-type">${this.getErrorTypeLabel(error.type)}</span>
                        </div>
                        <div class="error-message">${error.message}</div>
                        ${error.row ? `<div class="error-location">Fila: ${error.row}, Columna: ${error.column}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        }

        if (result.warnings.length > 0) {
            html += '<div class="warnings-section">';
            html += '<h4>⚠️ Advertencias</h4>';
            html += '<div class="warnings-list">';
            
            result.warnings.forEach((warning, index) => {
                html += `
                    <div class="warning-item">
                        <div class="warning-message">${warning.message}</div>
                        ${warning.row ? `<div class="warning-location">Fila: ${warning.row}, Columna: ${warning.column}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        }

        // Botones de acción
        html += '<div class="action-buttons">';
        
        if (result.isValid) {
            html += '<button id="import-excel-btn" class="btn btn-success">📥 Importar Datos</button>';
        }
        
        html += '<button id="download-report-btn" class="btn btn-secondary">📄 Descargar Reporte</button>';
        html += '<button id="fix-errors-btn" class="btn btn-warning">🔧 Ayuda para Corregir</button>';
        html += '</div>';

        resultsContainer.innerHTML = html;
        
        // Reconfigurar event listeners para nuevos botones
        this.setupActionButtons();
    }

    // Configurar botones de acción
    setupActionButtons() {
        const importBtn = document.getElementById('import-excel-btn');
        if (importBtn) {
            importBtn.addEventListener('click', this.importFile.bind(this));
        }

        const reportBtn = document.getElementById('download-report-btn');
        if (reportBtn) {
            reportBtn.addEventListener('click', this.downloadReport.bind(this));
        }

        const fixBtn = document.getElementById('fix-errors-btn');
        if (fixBtn) {
            fixBtn.addEventListener('click', this.showFixHelp.bind(this));
        }
    }

    // Obtener etiqueta del tipo de error
    getErrorTypeLabel(type) {
        const labels = {
            'FILE_FORMAT': 'Formato de Archivo',
            'EMPTY_FILE': 'Archivo Vacío',
            'MISSING_HEADER': 'Columna Faltante',
            'DUPLICATE_HEADERS': 'Headers Duplicados',
            'REQUIRED_FIELD': 'Campo Requerido',
            'INVALID_DATA_TYPE': 'Tipo de Dato',
            'VALUE_TOO_LOW': 'Valor Muy Bajo',
            'VALUE_TOO_HIGH': 'Valor Muy Alto',
            'CUSTOM_VALIDATION': 'Validación Personalizada',
            'PROCESSING_ERROR': 'Error de Procesamiento'
        };
        return labels[type] || type;
    }

    // Importar archivo validado
    async importFile() {
        if (!this.validationResult || !this.validationResult.isValid) {
            this.showError('El archivo debe ser validado exitosamente antes de importar');
            return;
        }

        this.showLoading('Importando datos...');
        
        try {
            // Leer datos del Excel
            const workbook = await this.readExcelFile(this.currentFile);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Procesar e importar datos
            const importResult = await this.processImportData(data);
            
            this.showSuccess(`Importación completada: ${importResult.imported} registros importados`);
            
            // Actualizar interfaz
            this.refreshDataTables();
            
        } catch (error) {
            this.showError(`Error durante la importación: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    // Leer archivo Excel
    async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Procesar datos de importación
    async processImportData(data) {
        const headers = data[0];
        const rows = data.slice(1);
        let imported = 0;
        let errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowData = {};
            
            // Mapear datos de la fila
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });

            try {
                // Crear usuario en la base de datos
                const user = {
                    name: rowData['Nombre'],
                    lastName: rowData['Apellido'],
                    email: rowData['Email'],
                    dni: rowData['DNI'],
                    phone: rowData['Teléfono'],
                    birthDate: rowData['Fecha_Nacimiento'],
                    role: 'student',
                    password: this.generateTemporaryPassword()
                };

                window.database.createUser(user);
                imported++;
                
            } catch (error) {
                errors.push({
                    row: i + 2,
                    error: error.message,
                    data: rowData
                });
            }
        }

        return { imported, errors };
    }

    // Generar contraseña temporal
    generateTemporaryPassword() {
        return Math.random().toString(36).slice(-8);
    }

    // Descargar reporte de validación
    downloadReport() {
        if (!this.validationResult) return;
        
        const report = this.validator.generateValidationReport();
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-validacion-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Mostrar ayuda para corregir errores
    showFixHelp() {
        const modal = document.getElementById('fix-help-modal');
        if (modal) {
            modal.style.display = 'block';
            this.populateFixHelp();
        }
    }

    // Poblar ayuda para corrección
    populateFixHelp() {
        const helpContent = document.getElementById('fix-help-content');
        if (!helpContent || !this.validationResult) return;

        let html = '<h3>🔧 Guía para Corregir Errores</h3>';
        
        // Agrupar errores por tipo
        const errorsByType = {};
        this.validationResult.errors.forEach(error => {
            if (!errorsByType[error.type]) {
                errorsByType[error.type] = [];
            }
            errorsByType[error.type].push(error);
        });

        // Generar ayuda por tipo de error
        Object.keys(errorsByType).forEach(type => {
            html += this.generateFixHelpForType(type, errorsByType[type]);
        });

        helpContent.innerHTML = html;
    }

    // Generar ayuda para tipo específico de error
    generateFixHelpForType(type, errors) {
        const helpTexts = {
            'MISSING_HEADER': {
                title: '📋 Columnas Faltantes',
                help: 'Asegúrate de que tu Excel tenga todas las columnas requeridas en la primera fila.'
            },
            'REQUIRED_FIELD': {
                title: '⚠️ Campos Requeridos Vacíos',
                help: 'Completa todos los campos marcados como obligatorios.'
            },
            'INVALID_DATA_TYPE': {
                title: '🔢 Tipos de Datos Incorrectos',
                help: 'Verifica que los datos estén en el formato correcto (números, fechas, emails, etc.).'
            },
            'CUSTOM_VALIDATION': {
                title: '🎯 Validaciones Específicas',
                help: 'Revisa los datos duplicados o que no cumplan las reglas de negocio.'
            }
        };

        const helpInfo = helpTexts[type] || { title: type, help: 'Revisa los datos indicados.' };
        
        let html = `
            <div class="fix-help-section">
                <h4>${helpInfo.title}</h4>
                <p>${helpInfo.help}</p>
                <div class="error-examples">
        `;
        
        errors.slice(0, 3).forEach(error => {
            html += `<div class="error-example">• ${error.message}</div>`;
        });
        
        if (errors.length > 3) {
            html += `<div class="more-errors">... y ${errors.length - 3} errores más</div>`;
        }
        
        html += '</div></div>';
        
        return html;
    }

    // Actualizar tablas de datos
    refreshDataTables() {
        // Disparar evento para actualizar las tablas
        window.dispatchEvent(new CustomEvent('dataUpdated', {
            detail: { type: 'users' }
        }));
    }

    // Utilidades de UI
    showLoading(message) {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.textContent = message;
            loader.style.display = 'block';
        }
    }

    hideLoading() {
        const loader = document.getElementById('loading-indicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showError(message) {
        window.errorHandler?.showError(message);
    }

    showSuccess(message) {
        window.errorHandler?.showSuccess(message);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.excelImportUI = new ExcelImportUI();
});