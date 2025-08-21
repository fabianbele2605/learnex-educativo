/**
 * Manejo de navegación móvil y funcionalidades responsive
 */
class MobileNavigation {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebar-overlay');
        this.mainLogoutBtn = document.getElementById('logout-btn');
        this.mainUserName = document.getElementById('user-name');
        
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.syncUserInfo();
        this.handleResize();
        
        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    bindEvents() {
        // Solo eventos esenciales sin referencias a elementos eliminados
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        if (!this.sidebar || !this.sidebarOverlay) return;
        
        this.isMenuOpen = true;
        this.sidebar.classList.add('mobile-open');
        this.sidebarOverlay.classList.add('active');
        document.body.classList.add('mobile-menu-open');
        
        // Enfocar el primer enlace para accesibilidad
        const firstLink = this.sidebar.querySelector('.nav-link');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }

    closeMobileMenu() {
        if (!this.sidebar || !this.sidebarOverlay) return;
        
        this.isMenuOpen = false;
        this.sidebar.classList.remove('mobile-open');
        this.sidebarOverlay.classList.remove('active');
        document.body.classList.remove('mobile-menu-open');
    }

    syncUserInfo() {
        // Sin sincronización móvil para evitar demoras
    }

    handleResize() {
        // Cerrar menú móvil si la pantalla se hace más grande
        if (window.innerWidth > 768 && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }

    // Método público para actualizar el nombre de usuario
    updateUserName(name) {
        if (this.mainUserName) {
            this.mainUserName.textContent = name;
        }
    }

    // Método público para obtener el estado del menú
    isMenuOpenState() {
        return this.isMenuOpen;
    }
}

// CSS adicional para la navegación móvil
const mobileNavStyles = `
/* Estilos para navegación móvil */
.mobile-menu-open {
    overflow: hidden;
}

.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.sidebar-overlay.active {
    opacity: 1;
    visibility: visible;
}

@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        top: 0;
        left: -280px;
        width: 280px;
        height: 100vh;
        z-index: 999;
        background: #fff;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        transition: left 0.3s ease;
        overflow-y: auto;
    }
    
    .sidebar.mobile-open {
        left: 0;
    }
    
    .sidebar-header {
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .sidebar-header h3 {
        margin: 0;
        font-size: 1.2rem;
        color: #2c3e50;
    }
    
    .sidebar-footer {
        padding: 20px;
        border-top: 1px solid #e9ecef;
        margin-top: auto;
    }
    
    .sidebar-footer .user-info {
        text-align: center;
    }
    
    .sidebar-footer .user-info span {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        color: #2c3e50;
    }
    
    .nav-menu {
        padding: 20px 0;
    }
    
    .nav-menu li {
        margin-bottom: 5px;
    }
    
    .nav-link {
        padding: 15px 20px;
        display: flex;
        align-items: center;
        color: #2c3e50;
        text-decoration: none;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;
    }
    
    .nav-link:hover,
    .nav-link.active {
        background: #f8f9fa;
        border-left-color: #007bff;
        color: #007bff;
    }
    
    .nav-link i {
        margin-right: 15px;
        width: 20px;
        text-align: center;
    }
    
    .main-content {
        margin-left: 0;
        width: 100%;
    }
    
    .dashboard-container {
        flex-direction: column;
    }
    
    /* Botón de menú móvil */
    #mobile-menu-toggle {
        color: #fff;
        font-size: 1.2rem;
        padding: 8px;
        margin-right: 10px;
    }
    
    #mobile-menu-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
    
    #mobile-menu-close {
        color: #6c757d;
        font-size: 1.2rem;
        padding: 5px;
    }
    
    #mobile-menu-close:hover {
        color: #495057;
    }
}

/* Animaciones para elementos táctiles */
@media (max-width: 768px) {
    .btn:active,
    .nav-link:active {
        transform: scale(0.98);
        transition: transform 0.1s ease;
    }
    
    .card {
        margin-bottom: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .form-control {
        font-size: 16px; /* Prevenir zoom en iOS */
        padding: 12px;
    }
    
    .btn {
        padding: 12px 20px;
        font-size: 16px;
        min-height: 44px; /* Tamaño mínimo táctil */
    }
    
    .table-responsive {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

/* Mejoras para accesibilidad */
.nav-link:focus,
.btn:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

/* Indicador de carga para transiciones */
.sidebar {
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-overlay {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
`;

// Inyectar estilos
const mobileStyleSheet = document.createElement('style');
mobileStyleSheet.textContent = mobileNavStyles;
document.head.appendChild(mobileStyleSheet);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileNavigation = new MobileNavigation();
    });
} else {
    window.mobileNavigation = new MobileNavigation();
}

// Exportar para uso global
window.MobileNavigation = MobileNavigation;