// Manejadores de eventos y funcionalidades específicas
class AppHandlers {
    // Métodos de carga de datos
    async loadUsers() {
        try {
            const users = await window.dbAdapter.getUsers();
            const tbody = document.querySelector('#users-table tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Carga de usuarios');
        }
    }

    async loadSubjects() {
        try {
            const subjects = await window.dbAdapter.getSubjects();
            const users = await window.dbAdapter.getUsers();
            const tbody = document.querySelector('#subjects-table tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            subjects.forEach(subject => {
                const teacher = users.find(u => u.id === (subject.teacherId || subject.teacher_id));
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${subject.id}</td>
                    <td>${subject.name}</td>
                    <td>${subject.area}</td>
                    <td>${teacher ? teacher.fullName : 'Sin asignar'}</td>
                    <td>${new Date(subject.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Carga de materias');
        }
    }

    async loadGrades() {
        try {
            const grades = await window.dbAdapter.getGrades();
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();
            const tbody = document.querySelector('#grades-table tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            grades.forEach(grade => {
                const student = users.find(u => u.id === grade.student_id);
                const subject = subjects.find(s => s.id === grade.subject_id);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${grade.id}</td>
                    <td>${student ? student.fullName : 'Desconocido'}</td>
                    <td>${subject ? subject.name : 'Desconocida'}</td>
                    <td>${grade.score}</td>
                    <td>${grade.period}</td>
                    <td>${new Date(grade.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Carga de notas');
        }
    }

    // Manejadores para materias
    static showAddSubjectForm() {
        const form = document.getElementById('addSubjectForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    static hideAddSubjectForm() {
        const form = document.getElementById('addSubjectForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('subjectForm').reset();
        }
    }

    static async handleAddSubject(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Sanitizar datos de entrada
        const name = SecurityUtils.sanitizeString(formData.get('name'));
        const area = SecurityUtils.sanitizeString(formData.get('area'));
        const teacherId = SecurityUtils.sanitizeInteger(formData.get('teacherId'));

        // Validaciones mejoradas
        if (!Utils.validateStringLength(name, 2, 100)) {
            window.errorHandler?.showError('El nombre de la materia debe tener entre 2 y 100 caracteres');
            return;
        }

        if (!Utils.validateStringLength(area, 2, 100)) {
            window.errorHandler?.showError('El área debe tener entre 2 y 100 caracteres');
            return;
        }

        if (!teacherId || teacherId <= 0) {
            window.errorHandler?.handleValidationError('Debe seleccionar un profesor válido', 'teacherId');
            return;
        }

        try {
            const users = await window.dbAdapter.getUsers();
            const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
            
            if (!teacher) {
                window.errorHandler?.handleValidationError('El profesor seleccionado no existe o no tiene el rol correcto', 'teacherId');
                return;
            }

            const nextId = await window.dbAdapter.getNextId('subjects');
            
            const newSubject = {
                id: nextId,
                name,
                area,
                teacherId,
                teacher_id: teacherId, // Compatibilidad
                created_at: new Date().toISOString()
            };

            await window.dbAdapter.saveSubject(newSubject);

            Utils.showSuccess('Materia creada exitosamente');
            this.hideAddSubjectForm();
            window.app.loadSubjectsContent();
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Creación de materia');
        }
    }

    static editSubject(id) {
        const subject = db.getById('subjects', id);
        if (!subject) {
            window.errorHandler?.showError('Materia no encontrada');
            return;
        }

        // Llenar formulario con datos existentes
        document.getElementById('subjectName').value = subject.name;
        document.getElementById('subjectArea').value = subject.area;
        document.getElementById('teacherId').value = subject.teacherId;
        
        // Mostrar formulario
        this.showAddSubjectForm();
        
        // Cambiar el comportamiento del formulario para edición
        const form = document.getElementById('subjectForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
                name: formData.get('name'),
                area: formData.get('area'),
                teacherId: parseInt(formData.get('teacherId'))
            };
            
            const updated = db.updateSubject(id, updatedData);
            if (updated) {
                Utils.showSuccess('Materia actualizada exitosamente');
                this.hideAddSubjectForm();
                window.app.loadSubjectsContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al actualizar la materia'), 'Actualización de materia');
            }
        };
    }

    static deleteSubject(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
            const deleted = db.deleteSubject(id);
            if (deleted) {
                Utils.showSuccess('Materia eliminada exitosamente');
                window.app.loadSubjectsContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al eliminar la materia'), 'Eliminación de materia');
            }
        }
    }

    // Manejadores para notas
    static showAddGradeForm() {
        const form = document.getElementById('addGradeForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    static hideAddGradeForm() {
        const form = document.getElementById('addGradeForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('gradeForm').reset();
        }
    }

    static async handleAddGrade(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Sanitizar datos de entrada
        const gradeData = {
            student_id: SecurityUtils.sanitizeInteger(formData.get('student_id'), 1),
            subject_id: SecurityUtils.sanitizeInteger(formData.get('subject_id'), 1),
            teacher_id: window.app.currentUser.id,
            score: SecurityUtils.sanitizeNumeric(formData.get('score'), 0, 5),
            period: SecurityUtils.sanitizeString(formData.get('period'))
        };

        // Validaciones mejoradas
        if (!gradeData.student_id || gradeData.student_id < 1) {
            window.errorHandler?.handleValidationError('Debe seleccionar un estudiante válido', 'studentId');
            return;
        }

        if (!gradeData.subject_id || gradeData.subject_id < 1) {
            window.errorHandler?.handleValidationError('Debe seleccionar una materia válida', 'subjectId');
            return;
        }

        if (!Utils.validateScore(gradeData.score)) {
            window.errorHandler?.handleValidationError('La nota debe estar entre 0.0 y 5.0', 'grade');
            return;
        }

        if (!Utils.validateStringLength(gradeData.period, 1, 20)) {
            window.errorHandler?.handleValidationError('El período debe tener entre 1 y 20 caracteres', 'period');
            return;
        }

        try {
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();

            // Verificar que el estudiante existe
            const student = users.find(u => u.id === gradeData.student_id && u.role === 'student');
            if (!student) {
                window.errorHandler?.handleValidationError('El estudiante seleccionado no es válido', 'studentId');
                return;
            }

            // Verificar que la materia existe
            const subject = subjects.find(s => s.id === gradeData.subject_id);
            if (!subject) {
                window.errorHandler?.handleValidationError('La materia seleccionada no es válida', 'subjectId');
                return;
            }

            // Verificar que el profesor puede calificar esta materia
            if ((subject.teacherId || subject.teacher_id) !== window.app.currentUser.id && window.app.currentUser.role !== 'admin') {
                window.errorHandler?.handleAuthError('No tiene permisos para calificar esta materia');
                return;
            }

            const nextId = await window.dbAdapter.getNextId('grades');
            
            const newGrade = {
                id: nextId,
                student_id: gradeData.student_id,
                subject_id: gradeData.subject_id,
                teacher_id: gradeData.teacher_id,
                score: gradeData.score,
                period: gradeData.period,
                created_at: new Date().toISOString()
            };

            await window.dbAdapter.saveGrade(newGrade);
            
            Utils.showSuccess('Nota registrada exitosamente');
            this.hideAddGradeForm();
            window.app.loadGradesContent();
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Registro de nota');
        }
    }

    static editGrade(id) {
        const grade = db.getById('grades', id);
        if (!grade) {
            window.errorHandler?.showError('Nota no encontrada');
            return;
        }

        // Llenar formulario con datos existentes
        document.getElementById('gradeStudent').value = grade.student_id;
        document.getElementById('gradeSubject').value = grade.subject_id;
        document.getElementById('gradeScore').value = grade.score;
        document.getElementById('gradePeriod').value = grade.period;
        
        // Mostrar formulario
        this.showAddGradeForm();
        
        // Cambiar el comportamiento del formulario para edición
        const form = document.getElementById('gradeForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
                student_id: parseInt(formData.get('student_id')),
                subject_id: parseInt(formData.get('subject_id')),
                score: parseFloat(formData.get('score')),
                period: formData.get('period')
            };
            
            const updated = db.updateGrade(id, updatedData);
            if (updated) {
                Utils.showSuccess('Nota actualizada exitosamente');
                this.hideAddGradeForm();
                window.app.loadGradesContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al actualizar la nota'), 'Actualización de nota');
            }
        };
    }

    static deleteGrade(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            const deleted = db.deleteGrade(id);
            if (deleted) {
                Utils.showSuccess('Nota eliminada exitosamente');
                window.app.loadGradesContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al eliminar la nota'), 'Eliminación de nota');
            }
        }
    }

    // Manejadores para importación de Excel
    static showExcelImport() {
        const form = document.getElementById('excelImportForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    static hideExcelImport() {
        const form = document.getElementById('excelImportForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('excelFile').value = '';
        }
    }

    static async processExcelFile() {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];
        
        if (!file) {
            window.errorHandler?.handleValidationError('Debe seleccionar un archivo', 'file');
            return;
        }

        try {
            Utils.showAlert('Procesando archivo...', 'info');
            const excelData = await Utils.readExcelFile(file);
            const result = db.importGradesFromExcel(excelData);
            
            if (result.success) {
                Utils.showSuccess(`Se importaron ${result.imported_count} notas exitosamente`);
                this.hideExcelImport();
                window.app.loadGradesContent();
            } else {
                window.errorHandler?.showError(`Error al importar: ${result.error}`);
            }
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Procesamiento de archivo Excel');
        }
    }

    // Manejadores para escaneo de fotos
    static showPhotoScan() {
        const form = document.getElementById('photoScanForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    static hidePhotoScan() {
        const form = document.getElementById('photoScanForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('photoFile').value = '';
        }
    }

    static async processPhotoFile() {
        const fileInput = document.getElementById('photoFile');
        const file = fileInput.files[0];
        
        if (!file) {
            window.errorHandler?.handleValidationError('Debe seleccionar una imagen', 'photo');
            return;
        }

        try {
            Utils.showAlert('Procesando imagen... Esto puede tomar unos segundos', 'info');
            const result = await Utils.processImageForGrades(file);
            
            if (result.success) {
                // Mostrar datos extraídos para confirmación
                const confirmData = result.data.map(item => 
                    `${item.student_name}: ${item.score}`
                ).join('\n');
                
                if (confirm(`Datos extraídos:\n${confirmData}\n\n¿Desea procesar estas notas?`)) {
                    // Aquí se procesarían los datos extraídos
                    // Por ahora solo mostramos un mensaje de éxito
                    Utils.showSuccess('Datos procesados exitosamente (funcionalidad simulada)');
                    this.hidePhotoScan();
                }
            } else {
                window.errorHandler?.showError('Error al procesar la imagen');
            }
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Procesamiento de imagen');
        }
    }

    // Manejadores para usuarios
    static showAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (form) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        }
    }

    static hideAddUserForm() {
        const form = document.getElementById('addUserForm');
        if (form) {
            form.style.display = 'none';
            document.getElementById('userForm').reset();
        }
    }

    static async handleAddUser(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Sanitizar datos de entrada
        const userData = {
            full_name: SecurityUtils.sanitizeString(formData.get('full_name')),
            email: SecurityUtils.sanitizeEmail(formData.get('email')),
            password: formData.get('password'), // No sanitizar contraseña para preservar caracteres especiales
            role: SecurityUtils.sanitizeString(formData.get('role')).toLowerCase()
        };

        // Validaciones mejoradas
        if (!Utils.validateStringLength(userData.full_name, 2, 100)) {
            window.errorHandler?.handleValidationError('El nombre debe tener entre 2 y 100 caracteres', 'fullName');
            return;
        }

        if (!Utils.validateEmail(userData.email)) {
            window.errorHandler?.handleValidationError('Email no válido', 'email');
            return;
        }

        const passwordValidation = Utils.validatePasswordWithMessage(userData.password);
        if (!passwordValidation.valid) {
            window.errorHandler?.handleValidationError(passwordValidation.message, 'password');
            return;
        }

        if (!Utils.validateRole(userData.role)) {
            window.errorHandler?.handleValidationError('Rol no válido. Debe ser: student, teacher o admin', 'role');
            return;
        }

        // Verificar rate limiting
        if (!SecurityUtils.checkRateLimit('user_creation', 3, 60000)) {
            window.errorHandler?.showWarning('Demasiados intentos. Espere un minuto antes de intentar nuevamente');
            return;
        }

        try {
            // Verificar si el email ya existe
            const existingUser = await window.dbAdapter.getUserByEmail(userData.email);
            if (existingUser) {
                window.errorHandler?.handleValidationError('Ya existe un usuario con este email', 'email');
                return;
            }

            // Hash de la contraseña antes de guardar
            const hashedPassword = await SecurityUtils.hashPassword(userData.password);
            userData.password = hashedPassword;
            
            // Crear usuario
            const newUser = await window.dbAdapter.createUser(userData);
            if (newUser) {
                Utils.showSuccess('Usuario creado exitosamente');
                this.hideAddUserForm();
                window.app.loadUsersContent();
            } else {
                window.errorHandler?.showError('Error al crear el usuario');
            }
        } catch (error) {
            window.errorHandler?.handleNetworkError(error, 'Creación de usuario');
        }
    }

    static editUser(id) {
        const user = db.getById('users', id);
        if (!user) {
            window.errorHandler?.showError('Usuario no encontrado');
            return;
        }

        // Llenar formulario con datos existentes
        document.getElementById('userName').value = user.full_name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userRole').value = user.role;
        
        // Mostrar formulario
        this.showAddUserForm();
        
        // Cambiar el comportamiento del formulario para edición
        const form = document.getElementById('userForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updatedData = {
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role')
            };
            
            const updated = db.updateUser(id, updatedData);
            if (updated) {
                Utils.showSuccess('Usuario actualizado exitosamente');
                this.hideAddUserForm();
                window.app.loadUsersContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al actualizar el usuario'), 'Actualización de usuario');
            }
        };
    }

    static deleteUser(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            const deleted = db.deleteUser(id);
            if (deleted) {
                Utils.showSuccess('Usuario eliminado exitosamente');
                window.app.loadUsersContent();
            } else {
                window.errorHandler?.handleNetworkError(new Error('Error al eliminar el usuario'), 'Eliminación de usuario');
            }
        }
    }

    // Manejadores para reportes
    static generateStudentReport() {
        const studentId = document.getElementById('studentSelect').value;
        if (!studentId) {
            window.errorHandler?.handleValidationError('Debe seleccionar un estudiante', 'studentSelect');
            return;
        }

        const reportData = db.getStudentReport(parseInt(studentId));
        const reportHTML = Utils.generateReportHTML(reportData, 'student');
        
        const resultDiv = document.getElementById('reportResult');
        if (resultDiv) {
            resultDiv.innerHTML = reportHTML;
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    static generateSubjectReport() {
        const subjectId = document.getElementById('subjectSelect').value;
        if (!subjectId) {
            window.errorHandler?.handleValidationError('Debe seleccionar una materia', 'subjectSelect');
            return;
        }

        const reportData = db.getSubjectReport(parseInt(subjectId));
        const reportHTML = Utils.generateReportHTML(reportData, 'subject');
        
        const resultDiv = document.getElementById('reportResult');
        if (resultDiv) {
            resultDiv.innerHTML = reportHTML;
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    static generateTeacherReport() {
        const teacherId = document.getElementById('teacherSelect').value;
        if (!teacherId) {
            window.errorHandler?.handleValidationError('Debe seleccionar un profesor', 'teacherSelect');
            return;
        }

        const reportData = db.getTeacherReport(parseInt(teacherId));
        const reportHTML = Utils.generateReportHTML(reportData, 'teacher');
        
        const resultDiv = document.getElementById('reportResult');
        if (resultDiv) {
            resultDiv.innerHTML = reportHTML;
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    static generateGeneralReport() {
        const reportData = db.getGeneralStatistics();
        const reportHTML = Utils.generateReportHTML(reportData, 'general');
        
        const resultDiv = document.getElementById('reportResult');
        if (resultDiv) {
            resultDiv.innerHTML = reportHTML;
            resultDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Hacer los métodos disponibles globalmente para uso en onclick
window.app = window.app || {};
Object.assign(window.app, {
    loadUsers: AppHandlers.loadUsers ? AppHandlers.loadUsers.bind(AppHandlers) : () => {},
    loadSubjects: AppHandlers.loadSubjects ? AppHandlers.loadSubjects.bind(AppHandlers) : () => {},
    loadGrades: AppHandlers.loadGrades ? AppHandlers.loadGrades.bind(AppHandlers) : () => {},
    
    showAddSubjectForm: AppHandlers.showAddSubjectForm || (() => {}),
    hideAddSubjectForm: AppHandlers.hideAddSubjectForm || (() => {}),
    handleAddSubject: AppHandlers.handleAddSubject ? AppHandlers.handleAddSubject.bind(AppHandlers) : () => {},
    editSubject: AppHandlers.editSubject || (() => {}),
    deleteSubject: AppHandlers.deleteSubject || (() => {}),
    
    showAddGradeForm: AppHandlers.showAddGradeForm || (() => {}),
    hideAddGradeForm: AppHandlers.hideAddGradeForm || (() => {}),
    handleAddGrade: AppHandlers.handleAddGrade ? AppHandlers.handleAddGrade.bind(AppHandlers) : () => {},
    editGrade: AppHandlers.editGrade || (() => {}),
    deleteGrade: AppHandlers.deleteGrade || (() => {}),
    
    showExcelImport: AppHandlers.showExcelImport || (() => {}),
    hideExcelImport: AppHandlers.hideExcelImport || (() => {}),
    processExcelFile: AppHandlers.processExcelFile ? AppHandlers.processExcelFile.bind(AppHandlers) : () => {},
    
    showPhotoScan: AppHandlers.showPhotoScan || (() => {}),
    hidePhotoScan: AppHandlers.hidePhotoScan || (() => {}),
    processPhotoFile: AppHandlers.processPhotoFile ? AppHandlers.processPhotoFile.bind(AppHandlers) : () => {},
    
    showAddUserForm: AppHandlers.showAddUserForm || (() => {}),
    hideAddUserForm: AppHandlers.hideAddUserForm || (() => {}),
    handleAddUser: AppHandlers.handleAddUser ? AppHandlers.handleAddUser.bind(AppHandlers) : () => {},
    editUser: AppHandlers.editUser || (() => {}),
    deleteUser: AppHandlers.deleteUser || (() => {}),
    
    generateStudentReport: AppHandlers.generateStudentReport || (() => {}),
    generateSubjectReport: AppHandlers.generateSubjectReport || (() => {}),
    generateTeacherReport: AppHandlers.generateTeacherReport || (() => {}),
    generateGeneralReport: AppHandlers.generateGeneralReport || (() => {})
});