// Aplicación principal - SPA
class App {
    constructor() {
        this.authManager = new AuthManager();
        this.navigationManager = new NavigationManager(this.authManager);
        this.uiManager = new UIManager(this.authManager, this.navigationManager);
        this.init();
    }

    init() {
        if (typeof ErrorHandler !== 'undefined') {
            window.errorHandler = new ErrorHandler();
        }
        
        this.bindEvents();
        
        if (!localStorage.getItem('users')) {
            Utils.loadSampleData();
        }
        
        this.navigationManager.handleRoute();
    }



    bindEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            const passwordInput = document.getElementById('reg-password');
            if (passwordInput && window.PasswordValidator) {
                new PasswordValidator(passwordInput);
            }
        }

        const logoutBtn = document.getElementById('logout-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
        }

        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link[data-section]')) {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.navigateToSection(section);
            }
        });
    }



    loadInitialData() {
        // Cargar datos iniciales si es necesario
        if (!localStorage.getItem('users')) {
            this.initializeDefaultData();
        }
    }

    async initializeDefaultData() {
        // Crear usuarios por defecto
        const defaultUsers = [
            {
                id: 1,
                email: 'admin@codeup.com',
                password: await SecurityUtils.hashPassword('admin123'),
                name: 'Administrador',
                role: 'admin',
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                email: 'profesor@codeup.com',
                password: await SecurityUtils.hashPassword('profesor123'),
                name: 'Juan Pérez',
                role: 'teacher',
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                email: 'estudiante@codeup.com',
                password: await SecurityUtils.hashPassword('estudiante123'),
                name: 'María García',
                role: 'student',
                created_at: new Date().toISOString()
            }
        ];

        // Materias por defecto
        const defaultSubjects = [
            { id: 1, name: 'Matemáticas', area: 'Ciencias Exactas', teacherId: 2 },
            { id: 2, name: 'Español', area: 'Humanidades', teacherId: 2 },
            { id: 3, name: 'Ciencias', area: 'Ciencias Naturales', teacherId: 2 },
            { id: 4, name: 'Historia', area: 'Ciencias Sociales', teacherId: 2 },
            { id: 5, name: 'Inglés', area: 'Idiomas', teacherId: 2 }
        ];

        // Notas de ejemplo
        const defaultGrades = [
            { id: 1, student_id: 3, subject_id: 1, teacher_id: 2, score: 85.5, period: '2024-1', created_at: new Date().toISOString() },
            { id: 2, student_id: 3, subject_id: 2, teacher_id: 2, score: 92.0, period: '2024-1', created_at: new Date().toISOString() },
            { id: 3, student_id: 3, subject_id: 3, teacher_id: 2, score: 78.5, period: '2024-1', created_at: new Date().toISOString() },
            { id: 4, student_id: 3, subject_id: 4, teacher_id: 2, score: 88.0, period: '2024-1', created_at: new Date().toISOString() },
            { id: 5, student_id: 3, subject_id: 5, teacher_id: 2, score: 95.5, period: '2024-1', created_at: new Date().toISOString() }
        ];

        localStorage.setItem('users', JSON.stringify(defaultUsers));
        localStorage.setItem('subjects', JSON.stringify(defaultSubjects));
        localStorage.setItem('grades', JSON.stringify(defaultGrades));
        localStorage.setItem('nextUserId', '4');
        localStorage.setItem('nextSubjectId', '6');
        localStorage.setItem('nextGradeId', '6');
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const user = await this.authManager.login(
                formData.get('email'),
                formData.get('password')
            );
            
            this.navigationManager.navigate('/dashboard');
            this.navigationManager.showAlert('Bienvenido ' + user.name, 'success');
            this.uiManager.updateUserDisplay();
            
            setTimeout(() => window.createSessionIndicator(), 500);
        } catch (error) {
            this.navigationManager.showAlert(error.message, 'danger');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await this.authManager.register({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role')
            });
            
            this.navigationManager.showAlert('Usuario registrado exitosamente', 'success');
            this.navigationManager.navigate('/login');
            e.target.reset();
        } catch (error) {
            this.navigationManager.showAlert(error.message, 'danger');
        }
    }

    handleLogout() {
        this.authManager.logout();
        this.navigationManager.navigate('/login');
        this.navigationManager.showAlert('Sesión cerrada exitosamente', 'info');
    }



    showDashboard() {
        this.showScreen('dashboard');
        document.getElementById('user-name').textContent = this.currentUser.full_name;
        
        // Mostrar/ocultar elementos según el rol
        if (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.classList.add('show');
            });
        }
    
        // Cargar contenido inicial
        this.navigateToSection('dashboard');
    }

    navigateToSection(section) {
        this.navigationManager.navigateToSection(section);
        this.uiManager.loadSectionContent(section);
    }

    loadSectionContent(section) {
        const contentArea = document.getElementById('content-area');
        
        switch (section) {
            case 'dashboard':
                contentArea.innerHTML = this.getDashboardContent();
                break;
            case 'subjects':
                contentArea.innerHTML = this.getSubjectsContent();
                this.setupSubjectsEvents();
                break;
            case 'grades':
                contentArea.innerHTML = this.getGradesContent();
                this.setupGradesEvents();
                break;
            case 'reports':
                // Cambiamos para usar el método asíncrono
                this.loadReportsContent().then(() => {
                    this.setupReportsEvents();
                });
                break;
            case 'users':
                if (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher') {
                    contentArea.innerHTML = this.getUsersContent();
                    this.setupUsersEvents();
                } else {
                    contentArea.innerHTML = '<div class="alert alert-danger">No tienes permisos para acceder a esta sección</div>';
                }
                break;
            case 'messages':
                this.loadMessagesContent();
                break;
            default:
                contentArea.innerHTML = '<div class="alert alert-info">Sección en desarrollo</div>';
        }
    }

    // Implementamos setupReportsEvents para manejar los eventos de reportes
    setupReportsEvents() {
        // Manejador para generar reporte de estudiante
        const studentReportBtn = document.querySelector('[data-action="generate-student-report"]');
        if (studentReportBtn) {
            studentReportBtn.addEventListener('click', () => this.generateStudentReport());
        }
    
        // Manejador para generar reporte de materia
        const subjectReportBtn = document.querySelector('[data-action="generate-subject-report"]');
        if (subjectReportBtn) {
            subjectReportBtn.addEventListener('click', () => this.generateSubjectReport());
        }
    
        // Manejador para exportar reportes
        const exportReportBtn = document.querySelector('[data-action="export-report"]');
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => this.exportReport());
        }
    }

    async loadReportsContent() {
        const reportsContent = document.getElementById('content-area');
        if (!reportsContent) return;
    
        try {
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();
            const students = users.filter(u => u.role === 'student');
            const teachers = users.filter(u => u.role === 'teacher');
    
            reportsContent.innerHTML = `
                <div class="section-header">
                    <h2>Reportes Académicos</h2>
                    <p class="section-description">Genera y descarga reportes detallados del sistema</p>
                </div>
                
                <div class="reports-grid">
                    <div class="report-card">
                        <div class="report-card-header">
                            <i class="fas fa-user-graduate"></i>
                            <h3>Reporte de Estudiante</h3>
                        </div>
                        <div class="report-card-body">
                            <div class="form-group">
                                <label for="studentSelect">Seleccionar Estudiante:</label>
                                <select id="studentSelect" class="form-control">
                                    <option value="">Elegir estudiante...</option>
                                    ${students.map(student => 
                                        `<option value="${student.id}">${student.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" data-action="generate-student-report">
                                <i class="fas fa-file-alt"></i> Generar Reporte
                            </button>
                        </div>
                    </div>
                    
                    <div class="report-card">
                        <div class="report-card-header">
                            <i class="fas fa-book"></i>
                            <h3>Reporte de Materia</h3>
                        </div>
                        <div class="report-card-body">
                            <div class="form-group">
                                <label for="subjectSelect">Seleccionar Materia:</label>
                                <select id="subjectSelect" class="form-control">
                                    <option value="">Elegir materia...</option>
                                    ${subjects.map(subject => 
                                        `<option value="${subject.id}">${subject.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" data-action="generate-subject-report">
                                <i class="fas fa-file-alt"></i> Generar Reporte
                            </button>
                        </div>
                    </div>
                
                    <div class="report-card">
                        <div class="report-card-header">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <h3>Reporte de Profesor</h3>
                        </div>
                        <div class="report-card-body">
                            <div class="form-group">
                                <label for="teacherSelect">Seleccionar Profesor:</label>
                                <select id="teacherSelect" class="form-control">
                                    <option value="">Elegir profesor...</option>
                                    ${teachers.map(teacher => 
                                        `<option value="${teacher.id}">${teacher.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button class="btn btn-primary" data-action="generate-teacher-report">
                                <i class="fas fa-file-alt"></i> Generar Reporte
                            </button>
                        </div>
                    </div>
                
                    <div class="report-card">
                        <div class="report-card-header">
                            <i class="fas fa-chart-bar"></i>
                            <h3>Reporte General</h3>
                        </div>
                        <div class="report-card-body">
                            <p>Genera un reporte completo del sistema con estadísticas generales.</p>
                            <button class="btn btn-primary" data-action="generate-general-report">
                                <i class="fas fa-file-alt"></i> Generar Reporte
                            </button>
                        </div>
                    </div>
                </div>

                <div id="reportResult" class="report-result mt-4"></div>
            `;
        } catch (error) {
            console.error('Error al cargar la sección de reportes:', error);
            this.showAlert('Error al cargar los reportes', 'danger');
        }
    }

    // Métodos para generar reportes
    async generateStudentReport() {
        const studentId = document.getElementById('studentSelect').value;
        if (!studentId) {
            this.showAlert('Por favor selecciona un estudiante', 'warning');
            return;
        }
    
        try {
            const student = await window.dbAdapter.getUserById(studentId);
            const grades = await window.dbAdapter.getGradesByStudent(studentId);
            const subjects = await window.dbAdapter.getSubjects();
    
            // Calcular estadísticas
            const gradesBySubject = {};
            let totalScore = 0;
            grades.forEach(grade => {
                const subject = subjects.find(s => s.id === grade.subjectId);
                if (!gradesBySubject[grade.subjectId]) {
                    gradesBySubject[grade.subjectId] = {
                        name: subject ? subject.name : 'Materia Desconocida',
                        grades: []
                    };
                }
                gradesBySubject[grade.subjectId].grades.push(grade.score);
                totalScore += grade.score;
            });
    
            // Generar HTML del reporte
            const reportHTML = `
                <div class="report-container">
                    <div class="report-header">
                        <h3>Reporte Académico - ${student.name}</h3>
                        <p>Fecha: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="report-section">
                        <h4>Información del Estudiante</h4>
                        <p><strong>Nombre:</strong> ${student.name}</p>
                        <p><strong>Email:</strong> ${student.email}</p>
                        <p><strong>Promedio General:</strong> ${(totalScore / grades.length || 0).toFixed(2)}</p>
                    </div>
    
                    <div class="report-section">
                        <h4>Calificaciones por Materia</h4>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Materia</th>
                                    <th>Notas</th>
                                    <th>Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.values(gradesBySubject).map(subject => {
                                    const average = subject.grades.reduce((a, b) => a + b, 0) / subject.grades.length;
                                    return `
                                        <tr>
                                            <td>${subject.name}</td>
                                            <td>${subject.grades.join(', ')}</td>
                                            <td>${average.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
    
                    <div class="report-actions">
                        <button class="btn btn-secondary" data-action="export-report">
                            <i class="fas fa-download"></i> Exportar Reporte
                        </button>
                    </div>
                </div>
            `;
    
            const resultDiv = document.getElementById('reportResult');
            if (resultDiv) {
                resultDiv.innerHTML = reportHTML;
                resultDiv.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error al generar el reporte:', error);
            this.showAlert('Error al generar el reporte del estudiante', 'danger');
        }
    }

    async generateSubjectReport() {
        const subjectId = document.getElementById('subjectSelect').value;
        if (!subjectId) {
            this.showAlert('Por favor selecciona una materia', 'warning');
            return;
        }
    
        try {
            const subject = await window.dbAdapter.getSubjectById(subjectId);
            const grades = await window.dbAdapter.getGradesBySubject(subjectId);
            const users = await window.dbAdapter.getUsers();
            const teacher = users.find(u => u.id === subject.teacherId);
    
            // Calcular estadísticas
            const totalStudents = new Set(grades.map(g => g.studentId)).size;
            const averageScore = grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length || 0;
    
            // Agrupar notas por estudiante
            const gradesByStudent = {};
            grades.forEach(grade => {
                const student = users.find(u => u.id === grade.studentId);
                if (!gradesByStudent[grade.studentId]) {
                    gradesByStudent[grade.studentId] = {
                        name: student ? student.name : 'Estudiante Desconocido',
                        grades: []
                    };
                }
                gradesByStudent[grade.studentId].grades.push(grade.score);
            });
    
            const reportHTML = `
                <div class="report-container">
                    <div class="report-header">
                        <h3>Reporte de Materia - ${subject.name}</h3>
                        <p>Fecha: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="report-section">
                        <h4>Información de la Materia</h4>
                        <p><strong>Nombre:</strong> ${subject.name}</p>
                        <p><strong>Área:</strong> ${subject.area}</p>
                        <p><strong>Profesor:</strong> ${teacher ? teacher.name : 'No asignado'}</p>
                        <p><strong>Total Estudiantes:</strong> ${totalStudents}</p>
                        <p><strong>Promedio General:</strong> ${averageScore.toFixed(2)}</p>
                    </div>
    
                    <div class="report-section">
                        <h4>Calificaciones por Estudiante</h4>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Estudiante</th>
                                    <th>Notas</th>
                                    <th>Promedio</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.values(gradesByStudent).map(student => {
                                    const average = student.grades.reduce((a, b) => a + b, 0) / student.grades.length;
                                    return `
                                        <tr>
                                            <td>${student.name}</td>
                                            <td>${student.grades.join(', ')}</td>
                                            <td>${average.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
    
                    <div class="report-actions">
                        <button class="btn btn-secondary" data-action="export-report">
                            <i class="fas fa-download"></i> Exportar Reporte
                        </button>
                    </div>
                </div>
            `;
    
            const resultDiv = document.getElementById('reportResult');
            if (resultDiv) {
                resultDiv.innerHTML = reportHTML;
                resultDiv.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error al generar el reporte:', error);
            this.showAlert('Error al generar el reporte de la materia', 'danger');
        }
    }

    getDashboardContent() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const grades = JSON.parse(localStorage.getItem('grades') || '[]');

        const studentsCount = users.filter(u => u.role === 'student').length;
        const teachersCount = users.filter(u => u.role === 'teacher').length;
        const subjectsCount = subjects.length;
        const gradesCount = grades.length;

        return `
            <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
            <div class="row mt-20">
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-user-graduate"></i></h3>
                        <h2>${studentsCount}</h2>
                        <p>Estudiantes</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-chalkboard-teacher"></i></h3>
                        <h2>${teachersCount}</h2>
                        <p>Profesores</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-book"></i></h3>
                        <h2>${subjectsCount}</h2>
                        <p>Materias</p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-chart-line"></i></h3>
                        <h2>${gradesCount}</h2>
                        <p>Notas Registradas</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-calendar"></i></h3>
                        <h2>2024-1</h2>
                        <p>Período Actual</p>
                    </div>
                </div>
                <div class="col-4">
                    <div class="card text-center">
                        <h3><i class="fas fa-trophy"></i></h3>
                        <h2>87.5</h2>
                        <p>Promedio General</p>
                    </div>
                </div>
                <div class="col-4">
                    <a href="#" class="card text-center" onclick="app.loadSection('messages')">
                        <h3><i class="fas fa-comments"></i></h3>
                        <h2>Mensajes</h2>
                        <p>Mensajes Directos</p>
                    </a>
                </div>
            </div>
        `;
    }



    // Métodos placeholder para otras secciones
    getSubjectsContent() {
        return '<div class="alert alert-info">Sección de materias en desarrollo</div>';
    }

    getGradesContent() {
        return '<div class="alert alert-info">Sección de notas en desarrollo</div>';
    }

    async loadReportsContent() {
        const reportsContent = document.getElementById('content-area');
        if (!reportsContent) return;
    
        try {
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();
            const students = users.filter(u => u.role === 'student');
    
            reportsContent.innerHTML = `
                <div class="section-header">
                    <h2>Reportes Académicos</h2>
                </div>
                
                <div class="reports-options">
                    <div class="report-card">
                        <h3>Reporte de Estudiante</h3>
                        <div class="form-group">
                            <select id="studentSelect" class="form-control">
                                <option value="">Seleccionar estudiante</option>
                                ${students.map(student => 
                                    `<option value="${student.id}">${student.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateStudentReport()">
                            <i class="fas fa-file-alt"></i> Generar Reporte
                        </button>
                    </div>
                    
                    <div class="report-card">
                        <h3>Reporte de Materia</h3>
                        <div class="form-group">
                            <select id="subjectSelect" class="form-control">
                                <option value="">Seleccionar materia</option>
                                ${subjects.map(subject => 
                                    `<option value="${subject.id}">${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateSubjectReport()">
                            <i class="fas fa-file-alt"></i> Generar Reporte
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar la sección de reportes:', error);
            this.showAlert('Error al cargar los reportes', 'danger');
        }
    }

    async loadSubjectsData() {
        try {
            const subjects = await window.dbAdapter.getSubjects();
            const users = await window.dbAdapter.getUsers();
            const teachers = users.filter(u => u.role === 'teacher');

            // Actualizar la tabla de materias
            const tableBody = document.getElementById('subjects-table-body');
            if (tableBody) {
                tableBody.innerHTML = subjects.map(subject => {
                    const teacher = teachers.find(t => t.id === subject.teacherId);
                    return `
                        <tr>
                            <td>${subject.name}</td>
                            <td>${subject.area}</td>
                            <td>${teacher ? teacher.name : 'No asignado'}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" data-action="edit-subject" data-id="${subject.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" data-action="delete-subject" data-id="${subject.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            // Actualizar el select de profesores en el modal
            const teacherSelect = document.getElementById('subject-teacher');
            if (teacherSelect) {
                teacherSelect.innerHTML = `
                    <option value="">Seleccionar profesor...</option>
                    ${teachers.map(teacher => `
                        <option value="${teacher.id}">${teacher.name}</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Error al cargar datos de materias:', error);
            this.showAlert('Error al cargar las materias', 'danger');
        }
    }

    async loadGradesData() {
        try {
            const grades = await window.dbAdapter.getGrades();
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();
            
            // Filtrar notas según el rol del usuario
            let filteredGrades = grades;
            if (this.currentUser.role === 'student') {
                filteredGrades = grades.filter(g => g.studentId === this.currentUser.id);
            } else if (this.currentUser.role === 'teacher') {
                const teacherSubjects = subjects.filter(s => s.teacherId === this.currentUser.id);
                filteredGrades = grades.filter(g => teacherSubjects.some(s => s.id === g.subjectId));
            }

            // Actualizar la tabla de notas
            const tableBody = document.getElementById('grades-table-body');
            if (tableBody) {
                tableBody.innerHTML = filteredGrades.map(grade => {
                    const student = users.find(u => u.id === grade.studentId);
                    const subject = subjects.find(s => s.id === grade.subjectId);
                    return `
                        <tr>
                            <td>${student ? student.name : 'N/A'}</td>
                            <td>${subject ? subject.name : 'N/A'}</td>
                            <td>${grade.score}</td>
                            <td>${grade.period}</td>
                            <td>${new Date(grade.date).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" data-action="edit-grade" data-id="${grade.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" data-action="delete-grade" data-id="${grade.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }

            // Actualizar los selects en el modal
            if (this.currentUser.role === 'admin' || this.currentUser.role === 'teacher') {
                const studentSelect = document.getElementById('grade-student');
                const students = users.filter(u => u.role === 'student');
                if (studentSelect) {
                    studentSelect.innerHTML = `
                        <option value="">Seleccionar estudiante...</option>
                        ${students.map(student => `
                            <option value="${student.id}">${student.name}</option>
                        `).join('')}
                    `;
                }
            }

            const subjectSelect = document.getElementById('grade-subject');
            if (subjectSelect) {
                let availableSubjects = subjects;
                if (this.currentUser.role === 'teacher') {
                    availableSubjects = subjects.filter(s => s.teacherId === this.currentUser.id);
                }
                subjectSelect.innerHTML = `
                    <option value="">Seleccionar materia...</option>
                    ${availableSubjects.map(subject => `
                        <option value="${subject.id}">${subject.name}</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Error al cargar datos de notas:', error);
            this.showAlert('Error al cargar las notas', 'danger');
        }
    }

    async loadUsersData() {
        try {
            const users = await window.dbAdapter.getUsers();
            const tableBody = document.getElementById('users-table-body');
            if (tableBody) {
                tableBody.innerHTML = users.map(user => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><span class="role-badge role-${user.role}">${Utils.capitalizeFirst(user.role)}</span></td>
                        <td>${Utils.formatDate(user.created_at)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" data-action="edit-user" data-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error al cargar datos de usuarios:', error);
            this.showAlert('Error al cargar los usuarios', 'danger');
        }
    }

    async loadMessagesContent() {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        try {
            const conversations = await window.messagingService.getUserConversations();
            const contacts = await window.messagingService.getAvailableContacts();

            contentArea.innerHTML = `
                <div class="section-header">
                    <h2>Mensajes Directos</h2>
                    <button class="btn btn-primary" id="newMessageBtn">
                        <i class="fas fa-plus"></i> Nuevo Mensaje
                    </button>
                </div>

                <div class="messaging-container">
                    <div class="conversations-list">
                        ${conversations.length === 0 ? `
                            <div class="empty-state">
                                <i class="fas fa-comments"></i>
                                <p>No tienes conversaciones aún</p>
                                <button class="btn btn-secondary" id="startConversationBtn">
                                    Iniciar una conversación
                                </button>
                            </div>
                        ` : conversations.map(conv => `
                            <div class="conversation-item" data-user-id="${conv.otherUser.id}">
                                <div class="conversation-avatar">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="conversation-info">
                                    <div class="conversation-header">
                                        <h4>${conv.otherUser.name}</h4>
                                        <span class="time">${window.messagingService.formatMessageDate(conv.lastMessage.timestamp)}</span>
                                    </div>
                                    <p class="last-message ${!conv.lastMessage.isRead && conv.lastMessage.receiverId === this.currentUser.id ? 'unread' : ''}">
                                        ${conv.lastMessage.content}
                                    </p>
                                    ${conv.unreadCount > 0 ? `
                                        <span class="unread-count">${conv.unreadCount}</span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div id="chat-container" class="chat-container">
                        <div class="select-conversation-prompt">
                            <i class="fas fa-comments"></i>
                            <p>Selecciona una conversación o inicia una nueva</p>
                        </div>
                    </div>
                </div>

                <!-- Modal para nuevo mensaje -->
                <div id="newMessageModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Nuevo Mensaje</h3>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="contactSelect">Seleccionar contacto:</label>
                                <select id="contactSelect" class="form-control">
                                    <option value="">Elegir contacto...</option>
                                    ${contacts.map(contact => `
                                        <option value="${contact.id}">${contact.name} (${this.getRoleDisplay(contact.role)})</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="messageContent">Mensaje:</label>
                                <textarea id="messageContent" class="form-control" rows="4" placeholder="Escribe tu mensaje aquí..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary close-modal">Cancelar</button>
                            <button class="btn btn-primary" id="sendNewMessageBtn">Enviar</button>
                        </div>
                    </div>
                </div>
            `;

            this.setupMessagingEvents();
        } catch (error) {
            console.error('Error al cargar la sección de mensajes:', error);
            this.showAlert('Error al cargar los mensajes', 'danger');
        }
    }

    getRoleDisplay(role) {
        const roles = {
            'admin': 'Administrador',
            'teacher': 'Profesor',
            'student': 'Estudiante',
            'parent': 'Acudiente'
        };
        return roles[role] || role;
    }

    setupMessagingEvents() {
        // Evento para abrir el modal de nuevo mensaje
        const newMessageBtn = document.getElementById('newMessageBtn');
        const startConversationBtn = document.getElementById('startConversationBtn');
        const modal = document.getElementById('newMessageModal');
        const closeButtons = document.querySelectorAll('.close-modal');
        const sendNewMessageBtn = document.getElementById('sendNewMessageBtn');

        [newMessageBtn, startConversationBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.style.display = 'block';
                });
            }
        });

        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });

        // Evento para enviar nuevo mensaje
        if (sendNewMessageBtn) {
            sendNewMessageBtn.addEventListener('click', async () => {
                const contactSelect = document.getElementById('contactSelect');
                const messageContent = document.getElementById('messageContent');
                
                if (!contactSelect.value) {
                    this.showAlert('Por favor selecciona un contacto', 'warning');
                    return;
                }
                if (!messageContent.value.trim()) {
                    this.showAlert('Por favor escribe un mensaje', 'warning');
                    return;
                }

                try {
                    await window.messagingService.sendMessage(
                        contactSelect.value,
                        messageContent.value.trim()
                    );
                    modal.style.display = 'none';
                    this.loadMessagesContent(); // Recargar la lista de conversaciones
                    this.showAlert('Mensaje enviado correctamente', 'success');
                } catch (error) {
                    console.error('Error al enviar mensaje:', error);
                    this.showAlert('Error al enviar el mensaje', 'danger');
                }
            });
        }

        // Evento para seleccionar una conversación
        const conversationItems = document.querySelectorAll('.conversation-item');
        conversationItems.forEach(item => {
            item.addEventListener('click', async () => {
                const userId = item.dataset.userId;
                await this.loadConversation(userId);
            });
        });
    }

    async loadConversation(userId) {
        try {
            const chatContainer = document.getElementById('chat-container');
            const users = await window.dbAdapter.getUsers();
            const otherUser = users.find(u => u.id === userId);
            const messages = await window.messagingService.getConversation(userId);

            // Marcar la conversación como leída
            await window.messagingService.markConversationAsRead(userId);

            chatContainer.innerHTML = `
                <div class="chat-header">
                    <div class="chat-user-info">
                        <i class="fas fa-user"></i>
                        <h3>${otherUser.name}</h3>
                        <span class="user-role">${this.getRoleDisplay(otherUser.role)}</span>
                    </div>
                </div>
                <div class="messages-container">
                    ${messages.length === 0 ? `
                        <div class="no-messages">
                            <p>No hay mensajes aún</p>
                            <p>Sé el primero en enviar un mensaje</p>
                        </div>
                    ` : messages.map(msg => `
                        <div class="message ${msg.senderId === this.currentUser.id ? 'sent' : 'received'}">
                            <div class="message-content">
                                <p>${msg.content}</p>
                                <span class="message-time">${window.messagingService.formatMessageDate(msg.timestamp)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="chat-input">
                    <textarea id="messageInput" placeholder="Escribe tu mensaje..." class="form-control"></textarea>
                    <button id="sendMessageBtn" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            `;

            // Scroll al último mensaje
            const messagesContainer = chatContainer.querySelector('.messages-container');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Configurar evento de envío de mensaje
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const messageInput = document.getElementById('messageInput');

            if (sendMessageBtn && messageInput) {
                sendMessageBtn.addEventListener('click', async () => {
                    const content = messageInput.value.trim();
                    if (!content) return;

                    try {
                        await window.messagingService.sendMessage(userId, content);
                        messageInput.value = '';
                        await this.loadConversation(userId); // Recargar la conversación
                    } catch (error) {
                        console.error('Error al enviar mensaje:', error);
                        this.showAlert('Error al enviar el mensaje', 'danger');
                    }
                });

                // Enviar con Enter (Shift+Enter para nueva línea)
                messageInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessageBtn.click();
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar la conversación:', error);
            this.showAlert('Error al cargar la conversación', 'danger');
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});