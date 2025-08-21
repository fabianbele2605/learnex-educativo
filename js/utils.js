// Utilidades generales para la aplicación
class Utils {
    // Validaciones mejoradas con seguridad
    static validateEmail(email) {
        if (!email) return false;
        const sanitized = SecurityUtils.sanitizeEmail(email);
        return SecurityUtils.validateEmailFormat(sanitized);
    }

    static validatePassword(password) {
        if (!password) return false;
        const validation = SecurityUtils.validatePasswordStrength(password);
        return validation.valid;
    }

    static validatePasswordWithMessage(password) {
        if (!password || password.length < 6) {
            return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres', strength: 'weak' };
        }
        
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const requirements = [
            { met: hasUpperCase, text: 'Una letra mayúscula' },
            { met: hasLowerCase, text: 'Una letra minúscula' },
            { met: hasNumbers, text: 'Un número' },
            { met: hasSpecialChar, text: 'Un carácter especial (!@#$%^&*(),.?":{}|<>)' },
            { met: password.length >= 8, text: 'Al menos 8 caracteres' }
        ];
        
        const metRequirements = requirements.filter(req => req.met).length;
        let strength = 'weak';
        let message = '';
        
        if (metRequirements >= 4) {
            strength = 'strong';
            message = 'Contraseña fuerte';
        } else if (metRequirements >= 2) {
            strength = 'medium';
            message = 'Contraseña moderada';
        } else {
            strength = 'weak';
            message = 'Contraseña débil';
        }
        
        const unmetRequirements = requirements.filter(req => !req.met);
        if (unmetRequirements.length > 0) {
            const firstUnmet = unmetRequirements[0];
            return { 
                valid: false, 
                message: `Falta: ${firstUnmet.text}`, 
                strength,
                requirements 
            };
        }
        
        return { valid: true, message, strength, requirements };
    }

    static validateRequired(value) {
        if (!value) return false;
        const sanitized = SecurityUtils.sanitizeString(value.toString());
        return sanitized.trim() !== '';
    }

    static validateScore(score) {
        return SecurityUtils.validateScore(score);
    }

    static validateStringLength(str, minLength = 1, maxLength = 255) {
        return SecurityUtils.validateStringLength(str, minLength, maxLength);
    }

    // Método para mostrar indicadores de fortaleza de contraseña
    static showPasswordStrength(inputElement, result) {
        // Remover indicadores existentes
        const existingIndicator = inputElement.parentNode.querySelector('.password-strength');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const existingRequirements = inputElement.parentNode.querySelector('.password-requirements');
        if (existingRequirements) {
            existingRequirements.remove();
        }
        
        if (!result.requirements) return;
        
        // Crear indicador de fortaleza
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = `password-strength password-strength-${result.strength}`;
        strengthIndicator.textContent = result.message;
        
        // Crear lista de requisitos
        const requirementsDiv = document.createElement('div');
        requirementsDiv.className = 'password-requirements';
        requirementsDiv.innerHTML = '<strong>Requisitos:</strong>';
        
        const requirementsList = document.createElement('ul');
        result.requirements.forEach(req => {
            const li = document.createElement('li');
            li.textContent = req.text;
            if (req.met) {
                li.className = 'requirement-met';
            }
            requirementsList.appendChild(li);
        });
        
        requirementsDiv.appendChild(requirementsList);
        
        // Insertar después del campo
        inputElement.parentNode.insertBefore(strengthIndicator, inputElement.nextSibling);
        inputElement.parentNode.insertBefore(requirementsDiv, strengthIndicator.nextSibling);
    }

    static validateRole(role) {
        return SecurityUtils.validateRole(role);
    }

    // Formateo de datos
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatScore(score) {
        return parseFloat(score).toFixed(1);
    }

    static capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Manejo de alertas
    static showAlert(message, type = 'info') {
        if (window.errorHandler) {
            switch(type) {
                case 'success':
                    return window.errorHandler.showSuccess('Éxito', message);
                case 'danger':
                case 'error':
                    return window.errorHandler.showNotification({
                        type: 'error',
                        title: 'Error',
                        message: message,
                        autoClose: 5000
                    });
                case 'warning':
                    return window.errorHandler.showWarning('Advertencia', message);
                default:
                    return window.errorHandler.showInfo('Información', message);
            }
        } else {
            // Fallback para compatibilidad
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    static showSuccess(message) {
        if (window.errorHandler) {
            return window.errorHandler.showSuccess('Éxito', message);
        }
        this.showAlert(message, 'success');
    }

    static showError(message) {
        if (window.errorHandler) {
            return window.errorHandler.showNotification({
                type: 'error',
                title: 'Error',
                message: message,
                autoClose: 5000
            });
        }
        this.showAlert(message, 'danger');
    }

    static showWarning(message) {
        if (window.errorHandler) {
            return window.errorHandler.showWarning('Advertencia', message);
        }
        this.showAlert(message, 'warning');
    }

    // Manejo de archivos Excel
    static async readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // Simular lectura de Excel - en una implementación real usarías SheetJS
                    const data = e.target.result;
                    
                    // Para esta demo, esperamos un CSV simple
                    if (file.name.endsWith('.csv')) {
                        const csvData = Utils.parseCSV(data);
                        resolve(csvData);
                    } else {
                        // Simular datos de Excel
                        const mockData = [
                            { student_id: 1, subject_id: 1, score: 4.5, period: '2024-1' },
                            { student_id: 2, subject_id: 1, score: 3.8, period: '2024-1' },
                            { student_id: 3, subject_id: 1, score: 4.2, period: '2024-1' }
                        ];
                        resolve(mockData);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    static parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                
                data.push(row);
            }
        }
        
        return data;
    }

    // Procesamiento de imágenes (OCR simulado)
    static async processImageForGrades(imageFile) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Simular procesamiento OCR
                setTimeout(() => {
                    // Datos simulados extraídos de la imagen
                    const extractedData = [
                        { student_name: 'Juan Pérez', score: 4.2 },
                        { student_name: 'María García', score: 3.8 },
                        { student_name: 'Carlos López', score: 4.5 },
                        { student_name: 'Ana Martínez', score: 3.9 }
                    ];
                    
                    resolve({
                        success: true,
                        data: extractedData,
                        image_url: e.target.result
                    });
                }, 2000); // Simular tiempo de procesamiento
            };
            
            reader.readAsDataURL(imageFile);
        });
    }

    // Generación de reportes
    static generateReportHTML(reportData, reportType) {
        let html = '';
        
        switch (reportType) {
            case 'student':
                html = this.generateStudentReportHTML(reportData);
                break;
            case 'subject':
                html = this.generateSubjectReportHTML(reportData);
                break;
            case 'teacher':
                html = this.generateTeacherReportHTML(reportData);
                break;
            case 'general':
                html = this.generateGeneralReportHTML(reportData);
                break;
            default:
                html = '<p>Tipo de reporte no válido</p>';
        }
        
        return html;
    }

    static generateStudentReportHTML(data) {
        return `
            <div class="report-header">
                <h2>Reporte de Estudiante</h2>
                <p><strong>Nombre:</strong> ${data.student.full_name}</p>
                <p><strong>Email:</strong> ${data.student.email}</p>
                <p><strong>Promedio General:</strong> ${this.formatScore(data.average)}</p>
            </div>
            <div class="report-content">
                <h3>Notas por Materia</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Nota</th>
                            <th>Período</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.grades.map(grade => `
                            <tr>
                                <td>${grade.subject_name}</td>
                                <td>${this.formatScore(grade.score)}</td>
                                <td>${grade.period}</td>
                                <td>${this.formatDate(grade.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static generateSubjectReportHTML(data) {
        return `
            <div class="report-header">
                <h2>Reporte de Materia</h2>
                <p><strong>Materia:</strong> ${data.subject.name}</p>
                <p><strong>Área:</strong> ${data.subject.area}</p>
                <p><strong>Promedio:</strong> ${this.formatScore(data.average)}</p>
                <p><strong>Total Estudiantes:</strong> ${data.total_students}</p>
            </div>
            <div class="report-content">
                <h3>Notas de Estudiantes</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            <th>Nota</th>
                            <th>Período</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.grades.map(grade => `
                            <tr>
                                <td>${grade.student_name}</td>
                                <td>${this.formatScore(grade.score)}</td>
                                <td>${grade.period}</td>
                                <td>${this.formatDate(grade.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static generateTeacherReportHTML(data) {
        return `
            <div class="report-header">
                <h2>Reporte de Profesor</h2>
                <p><strong>Nombre:</strong> ${data.teacher.full_name}</p>
                <p><strong>Email:</strong> ${data.teacher.email}</p>
                <p><strong>Total Materias:</strong> ${data.subjects.length}</p>
                <p><strong>Total Notas Registradas:</strong> ${data.total_grades}</p>
                <p><strong>Promedio General:</strong> ${this.formatScore(data.average)}</p>
            </div>
            <div class="report-content">
                <h3>Materias Asignadas</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Materia</th>
                            <th>Área</th>
                            <th>Fecha Creación</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.subjects.map(subject => `
                            <tr>
                                <td>${subject.name}</td>
                                <td>${subject.area}</td>
                                <td>${this.formatDate(subject.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static generateGeneralReportHTML(data) {
        return `
            <div class="report-header">
                <h2>Reporte General del Sistema</h2>
            </div>
            <div class="report-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${data.total_students}</h3>
                        <p>Estudiantes</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.total_teachers}</h3>
                        <p>Profesores</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.total_subjects}</h3>
                        <p>Materias</p>
                    </div>
                    <div class="stat-card">
                        <h3>${data.total_grades}</h3>
                        <p>Notas Registradas</p>
                    </div>
                    <div class="stat-card">
                        <h3>${this.formatScore(data.general_average)}</h3>
                        <p>Promedio General</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Exportar datos a CSV
    static exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    JSON.stringify(row[header] || '')
                ).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Generar datos de prueba
    static generateSampleData() {
        const sampleUsers = [
            {
                email: 'admin@escuela.com',
                password: 'admin123',
                role: 'admin',
                full_name: 'Administrador Sistema'
            },
            {
                email: 'profesor1@escuela.com',
                password: 'prof123',
                role: 'teacher',
                full_name: 'María González'
            },
            {
                email: 'profesor2@escuela.com',
                password: 'prof123',
                role: 'teacher',
                full_name: 'Carlos Rodríguez'
            },
            {
                email: 'estudiante1@escuela.com',
                password: 'est123',
                role: 'student',
                full_name: 'Juan Pérez'
            },
            {
                email: 'estudiante2@escuela.com',
                password: 'est123',
                role: 'student',
                full_name: 'Ana Martínez'
            },
            {
                email: 'estudiante3@escuela.com',
                password: 'est123',
                role: 'student',
                full_name: 'Luis García'
            }
        ];

        const sampleSubjects = [
            {
                name: 'Matemáticas',
                area: 'Ciencias Exactas',
                teacherId: 2
            },
            {
                name: 'Español',
                area: 'Humanidades',
                teacherId: 2
            },
            {
                name: 'Ciencias Naturales',
                area: 'Ciencias',
                teacherId: 3
            },
            {
                name: 'Historia',
                area: 'Sociales',
                teacherId: 3
            }
        ];

        const sampleGrades = [
            { student_id: 4, subject_id: 1, teacher_id: 2, score: 4.2, period: '2024-1' },
            { student_id: 4, subject_id: 2, teacher_id: 2, score: 3.8, period: '2024-1' },
            { student_id: 5, subject_id: 1, teacher_id: 2, score: 4.5, period: '2024-1' },
            { student_id: 5, subject_id: 3, teacher_id: 3, score: 4.0, period: '2024-1' },
            { student_id: 6, subject_id: 2, teacher_id: 2, score: 3.5, period: '2024-1' },
            { student_id: 6, subject_id: 4, teacher_id: 3, score: 4.1, period: '2024-1' }
        ];

        return {
            users: sampleUsers,
            subjects: sampleSubjects,
            grades: sampleGrades
        };
    }

    // Cargar datos de prueba
    static async loadSampleData() {
        try {
            // Usuarios con contraseñas simples para testing
            const users = [
                {
                    id: 1,
                    email: 'admin@test.com',
                    password: await SecurityUtils.hashPassword('admin123'),
                    name: 'Administrador',
                    role: 'admin',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    email: 'teacher@test.com',
                    password: await SecurityUtils.hashPassword('teacher123'),
                    name: 'Profesor Test',
                    role: 'teacher',
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    email: 'student@test.com',
                    password: await SecurityUtils.hashPassword('student123'),
                    name: 'Estudiante Test',
                    role: 'student',
                    created_at: new Date().toISOString()
                }
            ];
            
            const subjects = [
                { id: 1, name: 'Matemáticas', area: 'Ciencias', teacherId: 2 },
                { id: 2, name: 'Español', area: 'Humanidades', teacherId: 2 }
            ];
            
            const grades = [
                { id: 1, student_id: 3, subject_id: 1, score: 4.5, period: '2024-1', created_at: new Date().toISOString() },
                { id: 2, student_id: 3, subject_id: 2, score: 4.2, period: '2024-1', created_at: new Date().toISOString() }
            ];
            
            // Guardar en localStorage
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('subjects', JSON.stringify(subjects));
            localStorage.setItem('grades', JSON.stringify(grades));
            localStorage.setItem('nextUserId', '4');
            localStorage.setItem('nextSubjectId', '3');
            localStorage.setItem('nextGradeId', '3');
            
            console.log('✅ Datos de prueba cargados');
            console.log('Credenciales de prueba:');
            console.log('Admin: admin@test.com / admin123');
            console.log('Profesor: teacher@test.com / teacher123');
            console.log('Estudiante: student@test.com / student123');
            
            return true;
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            return false;
        }
    }

    // Limpiar localStorage
    static clearAllData() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
            window.db.clearAllData();
            this.showSuccess('Todos los datos han sido eliminados');
            
            // Recargar la página para resetear el estado
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
}

// Hacer Utils disponible globalmente
window.Utils = Utils;