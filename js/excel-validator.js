class ExcelValidator {
    constructor() {
        this.validationRules = {
            required: [],
            dataTypes: {},
            customValidators: {},
            ranges: {}
        };
        this.errors = [];
        this.warnings = [];
    }

    // Configurar reglas de validación
    setValidationRules(rules) {
        this.validationRules = { ...this.validationRules, ...rules };
        return this;
    }

    // Validar archivo Excel completo
    async validateExcelFile(file) {
        this.errors = [];
        this.warnings = [];
        
        try {
            // Validar formato de archivo
            if (!this.isValidExcelFile(file)) {
                this.errors.push({
                    type: 'FILE_FORMAT',
                    message: 'El archivo debe ser .xlsx o .xls',
                    severity: 'error'
                });
                return this.getValidationResult();
            }

            // Leer archivo Excel
            const workbook = await this.readExcelFile(file);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Validar estructura
            this.validateStructure(data);
            
            // Validar datos fila por fila
            this.validateData(data);
            
            // Validar integridad referencial
            this.validateReferentialIntegrity(data);
            
            return this.getValidationResult();
            
        } catch (error) {
            this.errors.push({
                type: 'PROCESSING_ERROR',
                message: `Error procesando archivo: ${error.message}`,
                severity: 'error'
            });
            return this.getValidationResult();
        }
    }

    // Validar formato de archivo
    isValidExcelFile(file) {
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
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

    // Validar estructura del Excel
    validateStructure(data) {
        if (!data || data.length === 0) {
            this.errors.push({
                type: 'EMPTY_FILE',
                message: 'El archivo está vacío',
                severity: 'error'
            });
            return;
        }

        // Validar headers
        const headers = data[0];
        const requiredHeaders = this.validationRules.required || [];
        
        requiredHeaders.forEach(requiredHeader => {
            if (!headers.includes(requiredHeader)) {
                this.errors.push({
                    type: 'MISSING_HEADER',
                    message: `Columna requerida faltante: ${requiredHeader}`,
                    severity: 'error',
                    column: requiredHeader
                });
            }
        });

        // Validar duplicados en headers
        const duplicateHeaders = headers.filter((header, index) => 
            headers.indexOf(header) !== index
        );
        
        if (duplicateHeaders.length > 0) {
            this.errors.push({
                type: 'DUPLICATE_HEADERS',
                message: `Headers duplicados: ${duplicateHeaders.join(', ')}`,
                severity: 'error'
            });
        }
    }

    // Validar datos fila por fila
    validateData(data) {
        const headers = data[0];
        const rows = data.slice(1);

        rows.forEach((row, rowIndex) => {
            const actualRowNumber = rowIndex + 2; // +2 porque empezamos desde fila 1 y saltamos header
            
            headers.forEach((header, colIndex) => {
                const cellValue = row[colIndex];
                this.validateCell(cellValue, header, actualRowNumber, colIndex + 1);
            });
        });
    }

    // Validar celda individual
    validateCell(value, columnName, row, col) {
        const rules = this.validationRules;
        
        // Validar campos requeridos
        if (rules.required && rules.required.includes(columnName)) {
            if (value === undefined || value === null || value === '') {
                this.errors.push({
                    type: 'REQUIRED_FIELD',
                    message: `Campo requerido vacío en ${columnName}`,
                    severity: 'error',
                    row: row,
                    column: col,
                    columnName: columnName
                });
                return;
            }
        }

        // Si está vacío y no es requerido, skip otras validaciones
        if (value === undefined || value === null || value === '') {
            return;
        }

        // Validar tipos de datos
        if (rules.dataTypes && rules.dataTypes[columnName]) {
            this.validateDataType(value, rules.dataTypes[columnName], columnName, row, col);
        }

        // Validar rangos
        if (rules.ranges && rules.ranges[columnName]) {
            this.validateRange(value, rules.ranges[columnName], columnName, row, col);
        }

        // Validadores personalizados
        if (rules.customValidators && rules.customValidators[columnName]) {
            this.validateCustom(value, rules.customValidators[columnName], columnName, row, col);
        }
    }

    // Validar tipo de dato
    validateDataType(value, expectedType, columnName, row, col) {
        let isValid = false;
        
        switch (expectedType) {
            case 'string':
                isValid = typeof value === 'string';
                break;
            case 'number':
                isValid = !isNaN(parseFloat(value)) && isFinite(value);
                break;
            case 'email':
                isValid = this.isValidEmail(value);
                break;
            case 'date':
                isValid = this.isValidDate(value);
                break;
            case 'phone':
                isValid = this.isValidPhone(value);
                break;
            case 'dni':
                isValid = this.isValidDNI(value);
                break;
        }

        if (!isValid) {
            this.errors.push({
                type: 'INVALID_DATA_TYPE',
                message: `Tipo de dato inválido en ${columnName}. Esperado: ${expectedType}`,
                severity: 'error',
                row: row,
                column: col,
                columnName: columnName,
                value: value
            });
        }
    }

    // Validar rango de valores
    validateRange(value, range, columnName, row, col) {
        const numValue = parseFloat(value);
        
        if (range.min !== undefined && numValue < range.min) {
            this.errors.push({
                type: 'VALUE_TOO_LOW',
                message: `Valor muy bajo en ${columnName}. Mínimo: ${range.min}`,
                severity: 'error',
                row: row,
                column: col,
                columnName: columnName,
                value: value
            });
        }
        
        if (range.max !== undefined && numValue > range.max) {
            this.errors.push({
                type: 'VALUE_TOO_HIGH',
                message: `Valor muy alto en ${columnName}. Máximo: ${range.max}`,
                severity: 'error',
                row: row,
                column: col,
                columnName: columnName,
                value: value
            });
        }
    }

    // Validadores personalizados
    validateCustom(value, validator, columnName, row, col) {
        try {
            const result = validator(value, row, col);
            if (result !== true) {
                this.errors.push({
                    type: 'CUSTOM_VALIDATION',
                    message: result || `Validación personalizada falló en ${columnName}`,
                    severity: 'error',
                    row: row,
                    column: col,
                    columnName: columnName,
                    value: value
                });
            }
        } catch (error) {
            this.errors.push({
                type: 'VALIDATOR_ERROR',
                message: `Error en validador personalizado: ${error.message}`,
                severity: 'error',
                row: row,
                column: col,
                columnName: columnName
            });
        }
    }

    // Validar integridad referencial
    validateReferentialIntegrity(data) {
        // Implementar validaciones de integridad según las reglas de negocio
        // Por ejemplo: validar que los IDs de materias existan, etc.
    }

    // Utilidades de validación
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.toString().replace(/\s/g, ''));
    }

    isValidDNI(dni) {
        const dniRegex = /^\d{7,8}$/;
        return dniRegex.test(dni.toString());
    }

    // Obtener resultado de validación
    getValidationResult() {
        return {
            isValid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                criticalErrors: this.errors.filter(e => e.severity === 'error').length
            }
        };
    }

    // Generar reporte de validación
    generateValidationReport() {
        const result = this.getValidationResult();
        
        let report = '=== REPORTE DE VALIDACIÓN EXCEL ===\n\n';
        report += `Estado: ${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
        report += `Errores: ${result.summary.totalErrors}\n`;
        report += `Advertencias: ${result.summary.totalWarnings}\n\n`;
        
        if (result.errors.length > 0) {
            report += '--- ERRORES ---\n';
            result.errors.forEach((error, index) => {
                report += `${index + 1}. ${error.message}`;
                if (error.row) report += ` (Fila: ${error.row}, Columna: ${error.column})`;
                report += '\n';
            });
        }
        
        if (result.warnings.length > 0) {
            report += '\n--- ADVERTENCIAS ---\n';
            result.warnings.forEach((warning, index) => {
                report += `${index + 1}. ${warning.message}`;
                if (warning.row) report += ` (Fila: ${warning.row}, Columna: ${warning.column})`;
                report += '\n';
            });
        }
        
        return report;
    }
}

// Exportar para uso global
window.ExcelValidator = ExcelValidator;