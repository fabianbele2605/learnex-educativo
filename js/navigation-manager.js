// Gestor de navegación y routing
if (typeof window.NavigationManager === 'undefined') {
class NavigationManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.currentScreen = 'login';
        this.currentSection = 'dashboard';
        this.routes = {
            '/': 'login',
            '/login': 'login',
            '/register': 'register',
            '/dashboard': 'dashboard',
            '/subjects': 'dashboard',
            '/grades': 'dashboard',
            '/reports': 'dashboard',
            '/users': 'dashboard',
            '/messages': 'dashboard',
            '/schedules': 'dashboard',
            '/attendance': 'dashboard',
            '/assignments': 'dashboard'
        };
        this.init();
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="/"], a[href^="#/"]')) {
                e.preventDefault();
                const href = e.target.getAttribute('href').replace('#', '');
                this.navigate(href);
            }
        });
    }

    navigate(path) {
        history.pushState(null, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const screen = this.routes[path] || 'login';
        
        // Verificar autenticación
        if (screen === 'dashboard' && !this.authManager.isAuthenticated()) {
            this.navigate('/login');
            return;
        }
        
        if ((screen === 'login' || screen === 'register') && this.authManager.isAuthenticated()) {
            this.navigate('/dashboard');
            return;
        }
        
        this.showScreen(screen);
        
        if (screen === 'dashboard') {
            const section = path.substring(1) || 'dashboard';
            if (['subjects', 'grades', 'reports', 'users', 'messages', 'schedules', 'attendance', 'assignments'].includes(section)) {
                this.navigateToSection(section);
            } else {
                this.navigateToSection('dashboard');
            }
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        document.getElementById(screenName + '-screen').classList.add('active');
        this.currentScreen = screenName;
    }

    navigateToSection(section) {
        // Verificar permisos
        if (section === 'users' && !this.authManager.hasPermission('manage_users')) {
            this.showAlert('No tienes permisos para acceder a esta sección', 'danger');
            return;
        }

        // Actualizar navegación activa inmediatamente
        requestAnimationFrame(() => {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-section="${section}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        });

        this.currentSection = section;
        
        // Cargar contenido inmediatamente
        if (window.uiManager) {
            window.uiManager.loadSectionContent(section);
        }
        
        // Actualizar URL
        const currentPath = window.location.pathname;
        const expectedPath = section === 'dashboard' ? '/dashboard' : `/${section}`;
        if (currentPath !== expectedPath) {
            history.replaceState(null, '', expectedPath);
        }
    }

    showAlert(message, type = 'info') {
        // Usar sistema de notificaciones si está disponible
        if (window.notificationManager) {
            switch (type) {
                case 'success':
                    window.notificationManager.success(message);
                    break;
                case 'danger':
                case 'error':
                    window.notificationManager.error(message);
                    break;
                case 'warning':
                    window.notificationManager.warning(message);
                    break;
                default:
                    window.notificationManager.info(message);
            }
            return;
        }
        
        // Fallback al sistema anterior
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button type="button" class="alert-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    getCurrentSection() {
        return this.currentSection;
    }
}

window.NavigationManager = NavigationManager;
}