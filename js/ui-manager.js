// Gestor de interfaz de usuario
if (typeof window.UIManager === 'undefined') {
class UIManager {
    constructor(authManager, navigationManager) {
        this.authManager = authManager;
        this.navigationManager = navigationManager;
        this.contentLoaders = {
            dashboard: () => this.getDashboardContent(),
            subjects: () => this.getSubjectsContent(),
            grades: () => this.getGradesContent(),
            reports: () => this.loadReportsContent(),
            users: () => this.getUsersContent(),
            messages: () => this.getMessagesContent(),
            schedules: () => this.getSchedulesContent(),
            attendance: () => this.getAttendanceContent(),
            assignments: () => this.getAssignmentsContent()
        };
    }

    async loadSectionContent(section) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        const loader = this.contentLoaders[section];
        if (loader) {
            try {
                if (section === 'reports') {
                    await LoadingManager.wrap(
                        () => loader(),
                        contentArea,
                        'Cargando reportes...'
                    );
                    this.setupReportsEvents();
                } else {
                    // Carga inmediata sin loading manager para mejor rendimiento
                    const content = loader();
                    contentArea.innerHTML = content;
                    
                    // Setup events de forma asíncrona
                    requestAnimationFrame(() => {
                        this.setupSectionEvents(section);
                        // Mantener información del usuario actualizada
                        this.updateUserDisplay();
                    });
                }
            } catch (error) {
                LoadingManager.hide(contentArea);
                contentArea.innerHTML = '<div class="alert alert-danger">Error al cargar la sección</div>';
            }
        } else {
            contentArea.innerHTML = '<div class="alert alert-info">Sección en desarrollo</div>';
        }
        
        // Asegurar que la información del usuario se mantenga
        this.updateUserDisplay();
    }

    setupSectionEvents(section) {
        switch (section) {
            case 'dashboard':
                this.setupDashboardEvents();
                break;
            case 'subjects':
                this.setupSubjectsEvents();
                break;
            case 'grades':
                this.setupGradesEvents();
                break;
            case 'users':
                this.setupUsersEvents();
                break;
            case 'messages':
                this.setupMessagesEvents();
                break;
            case 'schedules':
                this.setupSchedulesEvents();
                break;
            case 'attendance':
                this.setupAttendanceEvents();
                break;
            case 'assignments':
                this.setupAssignmentsEvents();
                break;
        }
    }
    
    setupDashboardEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Inicializar calendario de forma lazy
        requestIdleCallback(() => {
            if (window.CalendarManager) {
                window.calendarManager = new CalendarManager();
                requestAnimationFrame(() => {
                    window.calendarManager.renderCalendar();
                    this.loadUpcomingEvents();
                });
            }
        });
        
        // Actualizar estado del botón según tema actual
        this.updateThemeButton();
    }
    
    loadUpcomingEvents() {
        if (!window.calendarManager) return;
        
        const upcomingEvents = window.calendarManager.getUpcomingEvents(7);
        const container = document.getElementById('upcoming-events');
        
        if (container) {
            if (upcomingEvents.length === 0) {
                container.innerHTML = '<div class="empty-state">No hay eventos próximos</div>';
            } else {
                container.innerHTML = upcomingEvents.map(event => `
                    <div class="event-item">
                        <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
                        <div class="event-content">
                            <div class="event-title">${event.title}</div>
                            <div class="event-type">${this.getEventTypeLabel(event.type)}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    getEventTypeLabel(type) {
        const labels = {
            exam: 'Examen',
            assignment: 'Tarea',
            event: 'Evento'
        };
        return labels[type] || type;
    }
    
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        this.updateThemeButton();
    }
    
    updateThemeButton() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const isDark = document.body.classList.contains('dark-theme');
            themeToggle.innerHTML = isDark ? 
                '<i class="fas fa-sun"></i> Modo Claro' : 
                '<i class="fas fa-moon"></i> Modo Oscuro';
        }
    }

    getDashboardContent() {
        const user = this.authManager.getCurrentUser();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const grades = JSON.parse(localStorage.getItem('grades') || '[]');

        switch (user.role) {
            case 'admin':
                return this.getAdminDashboard(users, subjects, grades);
            case 'teacher':
                return this.getTeacherDashboard(user, users, subjects, grades);
            case 'student':
                return this.getStudentDashboard(user, subjects, grades);
            default:
                return '<div class="alert alert-warning">Dashboard no disponible</div>';
        }
    }
    
    getAdminDashboard(users, subjects, grades) {
        const studentsCount = users.filter(u => u.role === 'student').length;
        const teachersCount = users.filter(u => u.role === 'teacher').length;
        const avgGrade = grades.length > 0 ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2) : 0;
        const recentUsers = users.slice(-5).reverse();
        
        return `
            <div class="dashboard-header animated-gradient">
                <div class="header-content">
                    <h2 class="typing-effect"><i class="fas fa-crown"></i> Panel de Administración</h2>
                    <p class="header-subtitle">Bienvenido al sistema de gestión académica</p>
                </div>
                <div class="header-actions">
                    <button id="theme-toggle" class="btn btn-outline">
                        <i class="fas fa-moon"></i> <span>Modo Oscuro</span>
                    </button>
                </div>
            </div>
            
            <div class="dashboard-widgets">
                <div class="widget-row">
                    <div class="widget stat-widget pulse">
                        <div class="widget-icon admin"><i class="fas fa-users"></i></div>
                        <div class="widget-content">
                            <h3 class="counter" data-target="${users.length}">${users.length}</h3>
                            <p>Total Usuarios</p>
                            <div class="widget-trend">+12% este mes</div>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon student"><i class="fas fa-user-graduate"></i></div>
                        <div class="widget-content">
                            <h3>${studentsCount}</h3>
                            <p>Estudiantes</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon teacher"><i class="fas fa-chalkboard-teacher"></i></div>
                        <div class="widget-content">
                            <h3>${teachersCount}</h3>
                            <p>Profesores</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon grade"><i class="fas fa-chart-line"></i></div>
                        <div class="widget-content">
                            <h3>${avgGrade}</h3>
                            <p>Promedio General</p>
                        </div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget calendar-widget">
                        <h4><i class="fas fa-calendar"></i> Calendario Académico</h4>
                        <div id="calendar-container"></div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget list-widget">
                        <h4><i class="fas fa-user-plus"></i> Usuarios Recientes</h4>
                        <div class="widget-list">
                            ${recentUsers.map(user => `
                                <div class="list-item">
                                    <div class="item-avatar">${user.name.charAt(0).toUpperCase()}</div>
                                    <div class="item-content">
                                        <div class="item-title">${user.name}</div>
                                        <div class="item-subtitle">${this.getRoleLabel(user.role)}</div>
                                    </div>
                                    <div class="item-date">${new Date(user.created_at).toLocaleDateString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="widget quick-actions">
                        <h4><i class="fas fa-bolt"></i> Acciones Rápidas</h4>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="window.app.navigateToSection('messages')">
                                <i class="fas fa-comments"></i> Mensajes
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('schedules')">
                                <i class="fas fa-calendar"></i> Horarios
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('users')">
                                <i class="fas fa-users"></i> Usuarios
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('attendance')">
                                <i class="fas fa-check-circle"></i> Asistencia
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getTeacherDashboard(user, users, subjects, grades) {
        const mySubjects = subjects.filter(s => s.teacher === user.name);
        const myGrades = grades.filter(g => {
            const subject = subjects.find(s => s.id === g.subjectId);
            return subject && subject.teacher === user.name;
        });
        const avgGrade = myGrades.length > 0 ? (myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length).toFixed(2) : 0;
        const students = users.filter(u => u.role === 'student');
        
        return `
            <div class="dashboard-header">
                <h2><i class="fas fa-chalkboard-teacher"></i> Panel del Profesor</h2>
                <div class="theme-toggle">
                    <button id="theme-toggle" class="btn btn-outline">
                        <i class="fas fa-moon"></i> Modo Oscuro
                    </button>
                </div>
            </div>
            
            <div class="dashboard-widgets">
                <div class="widget-row">
                    <div class="widget stat-widget">
                        <div class="widget-icon teacher"><i class="fas fa-book"></i></div>
                        <div class="widget-content">
                            <h3>${mySubjects.length}</h3>
                            <p>Mis Materias</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon student"><i class="fas fa-users"></i></div>
                        <div class="widget-content">
                            <h3>${students.length}</h3>
                            <p>Estudiantes</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon grade"><i class="fas fa-star"></i></div>
                        <div class="widget-content">
                            <h3>${myGrades.length}</h3>
                            <p>Notas Asignadas</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon grade"><i class="fas fa-chart-line"></i></div>
                        <div class="widget-content">
                            <h3>${avgGrade}</h3>
                            <p>Promedio Mis Clases</p>
                        </div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget list-widget">
                        <h4><i class="fas fa-book-open"></i> Mis Materias</h4>
                        <div class="widget-list">
                            ${mySubjects.length === 0 ? 
                                '<div class="empty-state">No tienes materias asignadas</div>' :
                                mySubjects.map(subject => `
                                    <div class="list-item">
                                        <div class="item-avatar"><i class="fas fa-book"></i></div>
                                        <div class="item-content">
                                            <div class="item-title">${subject.name}</div>
                                            <div class="item-subtitle">${subject.code} - ${subject.credits} créditos</div>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                    
                    <div class="widget quick-actions">
                        <h4><i class="fas fa-bolt"></i> Acciones Rápidas</h4>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="window.app.navigateToSection('assignments')">
                                <i class="fas fa-tasks"></i> Tareas
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('attendance')">
                                <i class="fas fa-check-circle"></i> Asistencia
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('messages')">
                                <i class="fas fa-comments"></i> Mensajes
                            </button>
                            <button class="action-btn" onclick="window.app.navigateToSection('schedules')">
                                <i class="fas fa-calendar"></i> Horarios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStudentDashboard(user, subjects, grades) {
        const myGrades = grades.filter(g => g.studentId === user.id);
        const avgGrade = myGrades.length > 0 ? (myGrades.reduce((sum, g) => sum + g.score, 0) / myGrades.length).toFixed(2) : 0;
        const passedGrades = myGrades.filter(g => g.score >= 3).length;
        const recentGrades = myGrades.slice(-5).reverse();
        
        return `
            <div class="dashboard-header">
                <h2><i class="fas fa-user-graduate"></i> Mi Panel Estudiantil</h2>
                <div class="theme-toggle">
                    <button id="theme-toggle" class="btn btn-outline">
                        <i class="fas fa-moon"></i> Modo Oscuro
                    </button>
                </div>
            </div>
            
            <div class="dashboard-widgets">
                <div class="widget-row">
                    <div class="widget stat-widget">
                        <div class="widget-icon grade"><i class="fas fa-star"></i></div>
                        <div class="widget-content">
                            <h3>${myGrades.length}</h3>
                            <p>Total Notas</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon student"><i class="fas fa-chart-line"></i></div>
                        <div class="widget-content">
                            <h3>${avgGrade}</h3>
                            <p>Mi Promedio</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon teacher"><i class="fas fa-check-circle"></i></div>
                        <div class="widget-content">
                            <h3>${passedGrades}</h3>
                            <p>Materias Aprobadas</p>
                        </div>
                    </div>
                    <div class="widget stat-widget">
                        <div class="widget-icon admin"><i class="fas fa-book"></i></div>
                        <div class="widget-content">
                            <h3>${subjects.length}</h3>
                            <p>Materias Disponibles</p>
                        </div>
                    </div>
                </div>
                
                <div class="widget-row">
                    <div class="widget list-widget">
                        <h4><i class="fas fa-history"></i> Notas Recientes</h4>
                        <div class="widget-list">
                            ${recentGrades.length === 0 ? 
                                '<div class="empty-state">No tienes notas registradas</div>' :
                                recentGrades.map(grade => {
                                    const subject = subjects.find(s => s.id === grade.subjectId);
                                    return `
                                        <div class="list-item">
                                            <div class="item-avatar grade-${grade.score >= 3 ? 'pass' : 'fail'}">${grade.score}</div>
                                            <div class="item-content">
                                                <div class="item-title">${subject?.name || 'Materia eliminada'}</div>
                                                <div class="item-subtitle">${new Date(grade.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                    </div>
                    
                    <div class="widget progress-widget">
                        <h4><i class="fas fa-trophy"></i> Mi Progreso</h4>
                        <div class="progress-content">
                            <div class="progress-item">
                                <div class="progress-label">Promedio General</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(avgGrade / 5) * 100}%"></div>
                                </div>
                                <div class="progress-value">${avgGrade}/5.0</div>
                            </div>
                            <div class="progress-item">
                                <div class="progress-label">Tasa de Aprobación</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${myGrades.length > 0 ? (passedGrades / myGrades.length) * 100 : 0}%"></div>
                                </div>
                                <div class="progress-value">${myGrades.length > 0 ? Math.round((passedGrades / myGrades.length) * 100) : 0}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSubjectsContent() {
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const user = this.authManager.getCurrentUser();
        const canManage = user.role === 'admin' || user.role === 'teacher';
        
        return `
            <div class="section-header">
                <h2><i class="fas fa-book"></i> Materias</h2>
                ${canManage ? '<button class="btn btn-primary" id="add-subject-btn"><i class="fas fa-plus"></i> Agregar Materia</button>' : ''}
            </div>
            
            <div class="subjects-grid">
                ${subjects.length === 0 ? 
                    '<div class="alert alert-info">No hay materias registradas</div>' :
                    subjects.map(subject => `
                        <div class="card subject-card">
                            <h3>${subject.name}</h3>
                            <p><strong>Código:</strong> ${subject.code}</p>
                            <p><strong>Créditos:</strong> ${subject.credits}</p>
                            <p><strong>Profesor:</strong> ${subject.teacher || 'Sin asignar'}</p>
                            ${canManage ? `
                                <div class="card-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="window.uiManager.editSubject('${subject.id}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="window.uiManager.deleteSubject('${subject.id}')">Eliminar</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')
                }
            </div>
            
            ${canManage ? `
                <div id="subject-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <h3 id="modal-title">Agregar Materia</h3>
                        <form id="subject-form">
                            <input type="hidden" id="subject-id">
                            <div class="form-group">
                                <label>Nombre:</label>
                                <input type="text" id="subject-name" required class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Código:</label>
                                <input type="text" id="subject-code" required class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Créditos:</label>
                                <input type="number" id="subject-credits" min="1" max="10" required class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Profesor:</label>
                                <input type="text" id="subject-teacher" class="form-control">
                            </div>
                            <div class="modal-actions">
                                <button type="submit" class="btn btn-primary">Guardar</button>
                                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeSubjectModal()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            ` : ''}
        `;
    }

    getGradesContent() {
        const grades = JSON.parse(localStorage.getItem('grades') || '[]');
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = this.authManager.getCurrentUser();
        const canManage = user.role === 'admin' || user.role === 'teacher';
        
        let filteredGrades = grades;
        if (user.role === 'student') {
            filteredGrades = grades.filter(g => g.studentId === user.id);
        }
        
        return `
            <div class="section-header">
                <h2><i class="fas fa-chart-line"></i> Notas</h2>
                ${canManage ? '<button class="btn btn-primary" id="add-grade-btn"><i class="fas fa-plus"></i> Agregar Nota</button>' : ''}
            </div>
            
            <div class="grades-table">
                ${filteredGrades.length === 0 ? 
                    '<div class="alert alert-info">No hay notas registradas</div>' :
                    `<table class="table">
                        <thead>
                            <tr>
                                ${user.role !== 'student' ? '<th>Estudiante</th>' : ''}
                                <th>Materia</th>
                                <th>Nota</th>
                                <th>Fecha</th>
                                ${canManage ? '<th>Acciones</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredGrades.map(grade => {
                                const student = users.find(u => u.id === grade.studentId);
                                const subject = subjects.find(s => s.id === grade.subjectId);
                                return `
                                    <tr>
                                        ${user.role !== 'student' ? `<td>${student?.name || 'Desconocido'}</td>` : ''}
                                        <td>${subject?.name || 'Materia eliminada'}</td>
                                        <td><span class="grade-badge grade-${grade.score >= 3 ? 'pass' : 'fail'}">${grade.score}</span></td>
                                        <td>${new Date(grade.date).toLocaleDateString()}</td>
                                        ${canManage ? `
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="window.uiManager.editGrade('${grade.id}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="window.uiManager.deleteGrade('${grade.id}')">Eliminar</button>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>`
                }
            </div>
            
            ${canManage ? `
                <div id="grade-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <h3 id="grade-modal-title">Agregar Nota</h3>
                        <form id="grade-form">
                            <input type="hidden" id="grade-id">
                            <div class="form-group">
                                <label>Estudiante:</label>
                                <select id="grade-student" required class="form-control">
                                    <option value="">Seleccionar estudiante</option>
                                    ${users.filter(u => u.role === 'student').map(student => 
                                        `<option value="${student.id}">${student.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Materia:</label>
                                <select id="grade-subject" required class="form-control">
                                    <option value="">Seleccionar materia</option>
                                    ${subjects.map(subject => 
                                        `<option value="${subject.id}">${subject.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Nota (0-5):</label>
                                <input type="number" id="grade-score" min="0" max="5" step="0.1" required class="form-control">
                            </div>
                            <div class="modal-actions">
                                <button type="submit" class="btn btn-primary">Guardar</button>
                                <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeGradeModal()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            ` : ''}
        `;
    }

    getUsersContent() {
        if (!this.authManager.hasPermission('manage_users')) {
            return '<div class="alert alert-danger">No tienes permisos para acceder a esta sección</div>';
        }
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        return `
            <div class="section-header">
                <h2><i class="fas fa-users"></i> Gestión de Usuarios</h2>
                <button class="btn btn-primary" id="add-user-btn"><i class="fas fa-user-plus"></i> Agregar Usuario</button>
            </div>
            
            <div class="users-table">
                ${users.length === 0 ? 
                    '<div class="alert alert-info">No hay usuarios registrados</div>' :
                    `<table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td><span class="role-badge role-${user.role}">${this.getRoleLabel(user.role)}</span></td>
                                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary" onclick="window.uiManager.editUser('${user.id}')">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.uiManager.deleteUser('${user.id}')">Eliminar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
            
            <div id="user-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h3 id="user-modal-title">Agregar Usuario</h3>
                    <form id="user-form">
                        <input type="hidden" id="user-id">
                        <div class="form-group">
                            <label>Nombre:</label>
                            <input type="text" id="user-name" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" id="user-email" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Contraseña:</label>
                            <input type="password" id="user-password" class="form-control">
                            <small class="form-text text-muted">Dejar vacío para mantener la contraseña actual (solo edición)</small>
                        </div>
                        <div class="form-group">
                            <label>Rol:</label>
                            <select id="user-role" required class="form-control">
                                <option value="">Seleccionar rol</option>
                                <option value="student">Estudiante</option>
                                <option value="teacher">Profesor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Guardar</button>
                            <button type="button" class="btn btn-secondary" onclick="window.uiManager.closeUserModal()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    async loadReportsContent() {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            const grades = JSON.parse(localStorage.getItem('grades') || '[]');
            const students = users.filter(u => u.role === 'student');
            const teachers = users.filter(u => u.role === 'teacher');
            
            // Calcular estadísticas
            const avgGrade = grades.length > 0 ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2) : 0;
            const passedGrades = grades.filter(g => g.score >= 3).length;
            const passRate = grades.length > 0 ? ((passedGrades / grades.length) * 100).toFixed(1) : 0;

            contentArea.innerHTML = `
                <div class="section-header">
                    <h2><i class="fas fa-chart-bar"></i> Reportes y Estadísticas</h2>
                </div>
                
                <!-- Estadísticas generales -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <h3>${users.length}</h3>
                            <p>Total Usuarios</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-user-graduate"></i></div>
                        <div class="stat-content">
                            <h3>${students.length}</h3>
                            <p>Estudiantes</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                        <div class="stat-content">
                            <h3>${teachers.length}</h3>
                            <p>Profesores</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-book"></i></div>
                        <div class="stat-content">
                            <h3>${subjects.length}</h3>
                            <p>Materias</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-content">
                            <h3>${avgGrade}</h3>
                            <p>Promedio General</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-percentage"></i></div>
                        <div class="stat-content">
                            <h3>${passRate}%</h3>
                            <p>Tasa Aprobación</p>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <h4>Distribución de Roles</h4>
                        <canvas id="rolesChart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-card">
                        <h4>Distribución de Notas</h4>
                        <canvas id="gradesChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <!-- Reportes individuales -->
                <div class="reports-section">
                    <h3>Reportes Individuales</h3>
                    <div class="report-controls">
                        <select id="studentSelect" class="form-control">
                            <option value="">Seleccionar estudiante...</option>
                            ${students.map(student => 
                                `<option value="${student.id}">${student.name}</option>`
                            ).join('')}
                        </select>
                        <button class="btn btn-primary" data-action="generate-student-report">
                            <i class="fas fa-file-alt"></i> Generar Reporte
                        </button>
                        <button class="btn btn-success" data-action="export-data">
                            <i class="fas fa-download"></i> Exportar Datos
                        </button>
                    </div>
                </div>
                
                <div id="reportResult" class="report-result mt-4"></div>
            `;
            
            // Generar gráficos
            this.generateCharts(users, grades);
        } catch (error) {
            contentArea.innerHTML = '<div class="alert alert-danger">Error al cargar los reportes</div>';
        }
    }

    setupReportsEvents() {
        const generateBtn = document.querySelector('[data-action="generate-student-report"]');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateStudentReport());
        }
        
        const exportBtn = document.querySelector('[data-action="export-data"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }
    
    generateCharts(users, grades) {
        // Gráfico de roles
        const rolesCtx = document.getElementById('rolesChart');
        if (rolesCtx) {
            const rolesCounts = {
                admin: users.filter(u => u.role === 'admin').length,
                teacher: users.filter(u => u.role === 'teacher').length,
                student: users.filter(u => u.role === 'student').length
            };
            
            this.createPieChart(rolesCtx, {
                labels: ['Administradores', 'Profesores', 'Estudiantes'],
                data: [rolesCounts.admin, rolesCounts.teacher, rolesCounts.student],
                colors: ['#dc3545', '#007bff', '#28a745']
            });
        }
        
        // Gráfico de notas
        const gradesCtx = document.getElementById('gradesChart');
        if (gradesCtx) {
            const gradeRanges = {
                '0-1': grades.filter(g => g.score >= 0 && g.score < 1).length,
                '1-2': grades.filter(g => g.score >= 1 && g.score < 2).length,
                '2-3': grades.filter(g => g.score >= 2 && g.score < 3).length,
                '3-4': grades.filter(g => g.score >= 3 && g.score < 4).length,
                '4-5': grades.filter(g => g.score >= 4 && g.score <= 5).length
            };
            
            this.createBarChart(gradesCtx, {
                labels: ['0-1', '1-2', '2-3', '3-4', '4-5'],
                data: Object.values(gradeRanges),
                colors: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997']
            });
        }
    }
    
    createPieChart(ctx, data) {
        const canvas = ctx;
        const context = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        let total = data.data.reduce((sum, val) => sum + val, 0);
        let currentAngle = -Math.PI / 2;
        
        data.data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            context.closePath();
            context.fillStyle = data.colors[index];
            context.fill();
            
            currentAngle += sliceAngle;
        });
        
        // Leyenda simple
        data.labels.forEach((label, index) => {
            context.fillStyle = data.colors[index];
            context.fillRect(10, 10 + index * 20, 15, 15);
            context.fillStyle = '#333';
            context.font = '12px Arial';
            context.fillText(`${label}: ${data.data[index]}`, 30, 22 + index * 20);
        });
    }
    
    createBarChart(ctx, data) {
        const canvas = ctx;
        const context = canvas.getContext('2d');
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        const barWidth = chartWidth / data.labels.length;
        const maxValue = Math.max(...data.data);
        
        // Limpiar canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar barras
        data.data.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * barWidth + barWidth * 0.1;
            const y = canvas.height - padding - barHeight;
            const width = barWidth * 0.8;
            
            context.fillStyle = data.colors[index];
            context.fillRect(x, y, width, barHeight);
            
            // Etiquetas
            context.fillStyle = '#333';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.fillText(data.labels[index], x + width/2, canvas.height - 10);
            context.fillText(value.toString(), x + width/2, y - 5);
        });
    }
    
    exportData() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const grades = JSON.parse(localStorage.getItem('grades') || '[]');
        
        const data = {
            users: users.map(u => ({...u, password: '[OCULTA]'})),
            subjects,
            grades,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `datos_academicos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.notificationManager) {
            window.notificationManager.success('Datos exportados correctamente');
        }
    }

    async generateStudentReport() {
        const studentId = document.getElementById('studentSelect').value;
        if (!studentId) {
            this.navigationManager.showAlert('Por favor selecciona un estudiante', 'warning');
            return;
        }

        const reportResult = document.getElementById('reportResult');
        
        try {
            await LoadingManager.wrap(async () => {
                const student = await window.dbAdapter.getUserById(studentId);
                const grades = await window.dbAdapter.getGradesByStudent(studentId);
            
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
                        <p><strong>Total Notas:</strong> ${grades.length}</p>
                    </div>
                </div>
            `;

            const resultDiv = document.getElementById('reportResult');
                if (reportResult) {
                    reportResult.innerHTML = reportHTML;
                    reportResult.scrollIntoView({ behavior: 'smooth' });
                }
            }, reportResult, 'Generando reporte...');
        } catch (error) {
            this.navigationManager.showAlert('Error al generar el reporte', 'danger');
        }
    }

    setupSubjectsEvents() {
        const addBtn = document.getElementById('add-subject-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showSubjectModal());
        }
        
        const form = document.getElementById('subject-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveSubject(e));
        }
    }

    setupGradesEvents() {
        const addBtn = document.getElementById('add-grade-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showGradeModal());
        }
        
        const form = document.getElementById('grade-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveGrade(e));
        }
        
        // Agregar filtros a la tabla
        requestAnimationFrame(() => {
            const table = document.querySelector('.grades-table .table');
            if (table && window.TableFilters) {
                this.gradesTableFilter = new TableFilters('.grades-table .table', {
                    searchPlaceholder: 'Buscar notas...'
                });
            }
        });
    }
    
    showSubjectModal(subjectId = null) {
        const modal = document.getElementById('subject-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('subject-form');
        
        if (subjectId) {
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            const subject = subjects.find(s => s.id === subjectId);
            if (subject) {
                title.textContent = 'Editar Materia';
                document.getElementById('subject-id').value = subject.id;
                document.getElementById('subject-name').value = subject.name;
                document.getElementById('subject-code').value = subject.code;
                document.getElementById('subject-credits').value = subject.credits;
                document.getElementById('subject-teacher').value = subject.teacher || '';
            }
        } else {
            title.textContent = 'Agregar Materia';
            form.reset();
        }
        
        modal.style.display = 'block';
    }
    
    closeSubjectModal() {
        document.getElementById('subject-modal').style.display = 'none';
    }
    
    saveSubject(e) {
        e.preventDefault();
        
        const id = document.getElementById('subject-id').value;
        const name = document.getElementById('subject-name').value;
        const code = document.getElementById('subject-code').value;
        const credits = parseInt(document.getElementById('subject-credits').value);
        const teacher = document.getElementById('subject-teacher').value;
        
        let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        
        if (id) {
            const index = subjects.findIndex(s => s.id === id);
            if (index !== -1) {
                subjects[index] = { id, name, code, credits, teacher };
            }
        } else {
            const newSubject = {
                id: Date.now().toString(),
                name, code, credits, teacher
            };
            subjects.push(newSubject);
        }
        
        localStorage.setItem('subjects', JSON.stringify(subjects));
        this.closeSubjectModal();
        this.loadSectionContent('subjects');
    }
    
    editSubject(id) {
        this.showSubjectModal(id);
    }
    
    deleteSubject(id) {
        if (confirm('¿Estás seguro de eliminar esta materia?')) {
            let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            subjects = subjects.filter(s => s.id !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            this.loadSectionContent('subjects');
        }
    }
    
    showGradeModal(gradeId = null) {
        const modal = document.getElementById('grade-modal');
        const title = document.getElementById('grade-modal-title');
        const form = document.getElementById('grade-form');
        
        if (gradeId) {
            const grades = JSON.parse(localStorage.getItem('grades') || '[]');
            const grade = grades.find(g => g.id === gradeId);
            if (grade) {
                title.textContent = 'Editar Nota';
                document.getElementById('grade-id').value = grade.id;
                document.getElementById('grade-student').value = grade.studentId;
                document.getElementById('grade-subject').value = grade.subjectId;
                document.getElementById('grade-score').value = grade.score;
            }
        } else {
            title.textContent = 'Agregar Nota';
            form.reset();
        }
        
        modal.style.display = 'block';
    }
    
    closeGradeModal() {
        document.getElementById('grade-modal').style.display = 'none';
    }
    
    saveGrade(e) {
        e.preventDefault();
        
        const id = document.getElementById('grade-id').value;
        const studentId = document.getElementById('grade-student').value;
        const subjectId = document.getElementById('grade-subject').value;
        const score = parseFloat(document.getElementById('grade-score').value);
        
        let grades = JSON.parse(localStorage.getItem('grades') || '[]');
        
        if (id) {
            const index = grades.findIndex(g => g.id === id);
            if (index !== -1) {
                grades[index] = { id, studentId, subjectId, score, date: new Date().toISOString() };
            }
        } else {
            const newGrade = {
                id: Date.now().toString(),
                studentId, subjectId, score,
                date: new Date().toISOString()
            };
            grades.push(newGrade);
        }
        
        localStorage.setItem('grades', JSON.stringify(grades));
        this.closeGradeModal();
        this.loadSectionContent('grades');
    }
    
    editGrade(id) {
        this.showGradeModal(id);
    }
    
    deleteGrade(id) {
        if (confirm('¿Estás seguro de eliminar esta nota?')) {
            let grades = JSON.parse(localStorage.getItem('grades') || '[]');
            grades = grades.filter(g => g.id !== id);
            localStorage.setItem('grades', JSON.stringify(grades));
            this.loadSectionContent('grades');
        }
    }

    setupUsersEvents() {
        const addBtn = document.getElementById('add-user-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showUserModal());
        }
        
        const form = document.getElementById('user-form');
        if (form) {
            form.addEventListener('submit', (e) => this.saveUser(e));
        }
        
        // Agregar filtros a la tabla
        requestAnimationFrame(() => {
            const table = document.querySelector('.users-table .table');
            if (table && window.TableFilters) {
                this.usersTableFilter = new TableFilters('.users-table .table', {
                    searchPlaceholder: 'Buscar usuarios...'
                });
            }
        });
    }
    
    getRoleLabel(role) {
        const labels = {
            admin: 'Administrador',
            teacher: 'Profesor',
            student: 'Estudiante'
        };
        return labels[role] || role;
    }
    
    showUserModal(userId = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        const passwordField = document.getElementById('user-password');
        
        if (userId) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.id === userId);
            if (user) {
                title.textContent = 'Editar Usuario';
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-email').value = user.email;
                document.getElementById('user-role').value = user.role;
                passwordField.required = false;
                passwordField.placeholder = 'Dejar vacío para no cambiar';
            }
        } else {
            title.textContent = 'Agregar Usuario';
            form.reset();
            passwordField.required = true;
            passwordField.placeholder = '';
        }
        
        modal.style.display = 'block';
    }
    
    closeUserModal() {
        document.getElementById('user-modal').style.display = 'none';
    }
    
    async saveUser(e) {
        e.preventDefault();
        
        const id = document.getElementById('user-id').value;
        const name = document.getElementById('user-name').value;
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const role = document.getElementById('user-role').value;
        
        try {
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Verificar email único
            const existingUser = users.find(u => u.email === email && u.id !== id);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }
            
            if (id) {
                // Editar usuario existente
                const index = users.findIndex(u => u.id === id);
                if (index !== -1) {
                    users[index].name = name;
                    users[index].email = email;
                    users[index].role = role;
                    
                    // Solo actualizar contraseña si se proporcionó una nueva
                    if (password) {
                        users[index].password = await SecurityUtils.hashPassword(password);
                    }
                }
            } else {
                // Crear nuevo usuario
                if (!password) {
                    throw new Error('La contraseña es obligatoria para nuevos usuarios');
                }
                
                const hashedPassword = await SecurityUtils.hashPassword(password);
                const newUser = {
                    id: Date.now().toString(),
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    created_at: new Date().toISOString()
                };
                users.push(newUser);
            }
            
            localStorage.setItem('users', JSON.stringify(users));
            this.closeUserModal();
            this.loadSectionContent('users');
            
            if (window.notificationManager) {
                window.notificationManager.success(id ? 'Usuario actualizado' : 'Usuario creado');
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.error(error.message);
            } else {
                alert(error.message);
            }
        }
    }
    
    editUser(id) {
        this.showUserModal(id);
    }
    
    deleteUser(id) {
        const currentUser = this.authManager.getCurrentUser();
        if (currentUser.id === id) {
            if (window.notificationManager) {
                window.notificationManager.error('No puedes eliminar tu propio usuario');
            } else {
                alert('No puedes eliminar tu propio usuario');
            }
            return;
        }
        
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            let users = JSON.parse(localStorage.getItem('users') || '[]');
            users = users.filter(u => u.id !== id);
            localStorage.setItem('users', JSON.stringify(users));
            this.loadSectionContent('users');
            
            if (window.notificationManager) {
                window.notificationManager.success('Usuario eliminado');
            }
        }
    }

    updateUserDisplay() {
        const user = this.authManager.getCurrentUser();
        if (user) {
            const userNameElement = document.getElementById('user-name');
            const userRoleElement = document.getElementById('user-role');
            
            if (userNameElement) userNameElement.textContent = user.name;
            if (userRoleElement) {
                userRoleElement.textContent = this.getRoleLabel(user.role);
                userRoleElement.className = `user-role ${user.role}`;
            }

            // Mostrar elementos según rol
            document.querySelectorAll('.admin-only').forEach(el => {
                if (user.role === 'admin') {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            });
            
            document.querySelectorAll('.teacher-only').forEach(el => {
                if (user.role === 'teacher' || user.role === 'admin') {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            });
            
            document.querySelectorAll('.student-only').forEach(el => {
                if (user.role === 'student') {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            });
        }
    }

    // === FUNCIONALIDADES ACADÉMICAS ===
    
    getMessagesContent() {
        return `
            <div class="section-header">
                <h2><i class="fas fa-comments"></i> Mensajes</h2>
            </div>
            
            <div class="messages-container">
                <div class="chat-users-list" id="chat-users-list">
                    <h4>Contactos</h4>
                    <div id="users-list"></div>
                </div>
                
                <div class="chat-container" id="chat-container">
                    <div class="chat-placeholder">
                        <i class="fas fa-comments"></i>
                        <p>Selecciona un contacto para iniciar una conversación</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSchedulesContent() {
        const user = this.authManager.getCurrentUser();
        return `
            <div class="section-header">
                <h2><i class="fas fa-calendar"></i> Horarios de Clases</h2>
                ${['admin', 'teacher'].includes(user.role) ? `
                    <button class="btn btn-primary" onclick="window.academicManager.showCreateScheduleModal()">
                        <i class="fas fa-plus"></i> Nuevo Horario
                    </button>
                ` : ''}
            </div>
            
            <div id="schedule-container"></div>
        `;
    }
    
    getAttendanceContent() {
        const user = this.authManager.getCurrentUser();
        if (!['admin', 'teacher'].includes(user.role)) {
            return '<div class="alert alert-danger">No tienes permisos para acceder a esta sección</div>';
        }
        
        return `
            <div class="section-header">
                <h2><i class="fas fa-check-circle"></i> Control de Asistencia</h2>
                <div class="attendance-controls">
                    <input type="date" id="attendance-date" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    <select id="attendance-subject" class="form-control">
                        <option value="">Seleccionar materia</option>
                    </select>
                    <button class="btn btn-primary" onclick="window.academicManager.loadAttendanceForDate()">Cargar</button>
                </div>
            </div>
            
            <div id="attendance-list"></div>
        `;
    }
    
    getAssignmentsContent() {
        const user = this.authManager.getCurrentUser();
        return `
            <div class="section-header">
                <h2><i class="fas fa-tasks"></i> Tareas y Proyectos</h2>
                ${['admin', 'teacher'].includes(user.role) ? `
                    <button class="btn btn-primary" onclick="window.academicManager.showCreateAssignmentModal()">
                        <i class="fas fa-plus"></i> Nueva Tarea
                    </button>
                ` : ''}
            </div>
            
            <div id="assignments-list"></div>
        `;
    }
    
    setupMessagesEvents() {
        this.loadChatUsers();
    }
    
    setupSchedulesEvents() {
        this.loadSchedules();
    }
    
    setupAttendanceEvents() {
        this.loadSubjectsForAttendance();
    }
    
    setupAssignmentsEvents() {
        this.loadAssignments();
    }
    
    async loadChatUsers() {
        try {
            const users = await window.apiClient.getUsers();
            const currentUser = this.authManager.getCurrentUser();
            const otherUsers = users.filter(u => u.id !== currentUser.id);
            
            const container = document.getElementById('users-list');
            if (container) {
                container.innerHTML = otherUsers.map(user => `
                    <div class="chat-user" data-user-id="${user.id}" data-user-name="${user.name}">
                        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <div class="user-name">${user.name}</div>
                            <div class="user-role">${this.getRoleLabel(user.role)}</div>
                        </div>
                    </div>
                `).join('');
                
                // Agregar event listeners
                setTimeout(() => {
                    document.querySelectorAll('.chat-user').forEach(userEl => {
                        userEl.addEventListener('click', () => {
                            const userId = userEl.dataset.userId;
                            const userName = userEl.dataset.userName;
                            console.log('Click en usuario:', userId, userName);
                            if (window.academicManager) {
                                window.academicManager.openChat(userId, userName);
                            }
                        });
                    });
                }, 100);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        }
    }
    
    async loadSchedules() {
        try {
            const user = this.authManager.getCurrentUser();
            let schedules;
            
            if (user.role === 'teacher') {
                // Solo horarios de las materias del profesor
                const subjects = await window.apiClient.getSubjects();
                const teacherSubjects = subjects.filter(s => s.teacher_id === user.id);
                schedules = [];
                for (const subject of teacherSubjects) {
                    const subjectSchedules = await window.apiClient.getSchedules(subject.id);
                    schedules.push(...subjectSchedules);
                }
            } else if (user.role === 'student') {
                // Solo horarios de materias inscritas
                schedules = await window.apiClient.getSchedules();
                // TODO: Filtrar por inscripciones del estudiante
            } else {
                // Admin ve todos
                schedules = await window.apiClient.getSchedules();
            }
            
            if (window.academicManager) {
                window.academicManager.renderWeeklySchedule(schedules, 'schedule-container');
            }
        } catch (error) {
            console.error('Error cargando horarios:', error);
        }
    }
    
    async loadSubjectsForAttendance() {
        try {
            const subjects = await window.apiClient.getSubjects();
            const user = this.authManager.getCurrentUser();
            
            // Filtrar materias según el rol
            let filteredSubjects = subjects;
            if (user.role === 'teacher') {
                filteredSubjects = subjects.filter(s => s.teacher_id === user.id);
            }
            
            const select = document.getElementById('attendance-subject');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar materia</option>' +
                    filteredSubjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    }
    
    async loadAssignments() {
        try {
            const user = this.authManager.getCurrentUser();
            let assignments;
            
            if (user.role === 'teacher') {
                // Solo tareas de las materias del profesor
                const subjects = await window.apiClient.getSubjects();
                const teacherSubjects = subjects.filter(s => s.teacher_id === user.id);
                const subjectIds = teacherSubjects.map(s => s.id);
                assignments = await window.apiClient.getAssignments();
                assignments = assignments.filter(a => subjectIds.includes(a.subject_id));
            } else if (user.role === 'student') {
                // Solo tareas de materias inscritas
                assignments = await window.apiClient.getAssignments();
                // TODO: Filtrar por inscripciones del estudiante
            } else {
                // Admin ve todas
                assignments = await window.apiClient.getAssignments();
            }
            
            if (window.academicManager) {
                window.academicManager.renderAssignmentsList(assignments, user.role);
            }
        } catch (error) {
            console.error('Error cargando tareas:', error);
        }
    }
}

// Hacer métodos accesibles globalmente para onclick
window.UIManager = UIManager;
if (!window.uiManager) {
    window.uiManager = null; // Se inicializará en app-minimal.js
}
}