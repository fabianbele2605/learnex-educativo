// Aplicación principal - SPA (Versión modularizada)
class App {
    constructor() {
        this.authManager = new AuthManager();
        this.navigationManager = new NavigationManager(this.authManager);
        this.uiManager = new UIManager(this.authManager, this.navigationManager);
        
        // Hacer uiManager accesible globalmente para eventos onclick
        window.uiManager = this.uiManager;
        
        this.init();
    }

    init() {
        if (typeof ErrorHandler !== 'undefined') {
            window.errorHandler = new ErrorHandler();
        }
        
        // Inicializar tema guardado
        this.initTheme();
        
        // Inicializar sistemas avanzados
        this.initAdvancedSystems();
        
        this.bindEvents();
        
        // Cargar datos de prueba si no existen
        if (!localStorage.getItem('users')) {
            console.log('Cargando datos de prueba...');
            Utils.loadSampleData().then(() => {
                console.log('Datos cargados, puedes usar las credenciales de prueba');
            });
        } else {
            console.log('Datos existentes encontrados');
        }
        
        this.navigationManager.handleRoute();
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
    
    initAdvancedSystems() {
        // Inicializar sistemas críticos inmediatamente
        if (window.NotificationSystem) {
            window.notificationSystem = new NotificationSystem();
        }
        
        // Inicializar sistemas no críticos de forma lazy
        requestIdleCallback(() => {
            if (window.MessagingSystem) {
                window.messagingSystem = new MessagingSystem();
            }
            
            if (window.FileSystem) {
                window.fileSystem = new FileSystem();
            }
            
            if (window.SearchManager) {
                window.searchManager = new SearchManager();
            }
            
            if (window.TestPanel && window.location.hostname === 'localhost') {
                window.testPanel = new TestPanel();
            }
        });
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
            
            // Agregar validación en tiempo real
            if (window.FormValidator) {
                const validator = new FormValidator(registerForm);
                validator.addRule('name', FormValidator.validators.required, 'El nombre es obligatorio');
                validator.addRule('name', FormValidator.validators.minLength(2), 'Mínimo 2 caracteres');
                validator.addRule('email', FormValidator.validators.required, 'El email es obligatorio');
                validator.addRule('email', FormValidator.validators.email, 'Email no válido');
                validator.addRule('role', FormValidator.validators.required, 'Selecciona un rol');
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
                // Forzar carga inmediata sin esperar
                this.navigateToSection(section);
                return false;
            }
            
            if (e.target.id === 'load-sample-data') {
                e.preventDefault();
                this.loadSampleData();
            }
        });
    }
    
    async loadSampleData() {
        try {
            const btn = document.getElementById('load-sample-data');
            btn.classList.add('loading');
            btn.disabled = true;
            
            await Utils.loadSampleData();
            
            if (window.notificationManager) {
                window.notificationManager.success('Datos de prueba cargados correctamente');
            } else {
                alert('Datos cargados. Usa: admin@test.com / admin123');
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.error('Error al cargar datos');
            } else {
                alert('Error al cargar datos');
            }
        } finally {
            const btn = document.getElementById('load-sample-data');
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            const user = await this.authManager.login(
                formData.get('email'),
                formData.get('password')
            );
            
            this.navigationManager.navigate('/dashboard');
            this.navigationManager.showAlert('Bienvenido ' + user.name, 'success');
            this.uiManager.updateUserDisplay();
            
            if (window.createSessionIndicator) window.createSessionIndicator();
        } catch (error) {
            this.navigationManager.showAlert(error.message, 'danger');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
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
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    handleLogout() {
        this.authManager.logout();
        this.navigationManager.navigate('/login');
        this.navigationManager.showAlert('Sesión cerrada exitosamente', 'info');
    }

    navigateToSection(section) {
        // Carga inmediata y forzada
        this.navigationManager.navigateToSection(section);
        // Asegurar que el contenido se carga inmediatamente
        requestAnimationFrame(() => {
            this.uiManager.loadSectionContent(section);
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});