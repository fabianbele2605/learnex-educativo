/**
 * Utilidades para mejorar la experiencia responsive
 * Maneja funcionalidades específicas para dispositivos móviles y tablets
 */
class ResponsiveUtils {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isTouch = this.detectTouch();
        this.screenSize = this.getScreenSize();
        this.init();
    }

    init() {
        this.setupViewportHandler();
        this.setupOrientationHandler();
        this.setupTouchHandlers();
        this.setupKeyboardHandlers();
        this.setupScrollHandlers();
        this.addDeviceClasses();
    }

    // Detección de dispositivos
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    detectTablet() {
        return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    detectTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    getScreenSize() {
        const width = window.innerWidth;
        if (width <= 480) return 'xs';
        if (width <= 768) return 'sm';
        if (width <= 1024) return 'md';
        if (width <= 1200) return 'lg';
        return 'xl';
    }

    // Configuración de manejadores
    setupViewportHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleViewportChange();
            }, 250);
        });
    }

    setupOrientationHandler() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });
    }

    setupTouchHandlers() {
        if (this.isTouch) {
            // Mejorar la experiencia táctil
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
            document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
            
            // Prevenir zoom accidental en inputs
            this.preventInputZoom();
        }
    }

    setupKeyboardHandlers() {
        if (this.isMobile) {
            // Manejar el teclado virtual en móviles
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('focus', this.handleInputFocus.bind(this));
                input.addEventListener('blur', this.handleInputBlur.bind(this));
            });
        }
    }

    setupScrollHandlers() {
        // Scroll suave para navegación interna
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // Manejadores de eventos
    handleViewportChange() {
        const newScreenSize = this.getScreenSize();
        if (newScreenSize !== this.screenSize) {
            this.screenSize = newScreenSize;
            this.updateDeviceClasses();
            this.adjustLayout();
        }
    }

    handleOrientationChange() {
        // Forzar recálculo del viewport
        document.body.style.height = '100vh';
        setTimeout(() => {
            document.body.style.height = '';
        }, 500);
        
        this.adjustLayout();
    }

    handleTouchStart(e) {
        // Añadir clase para feedback visual
        if (e.target.matches('.btn, .nav-link, .table tr')) {
            e.target.classList.add('touch-active');
        }
    }

    handleTouchEnd(e) {
        // Remover clase de feedback visual
        setTimeout(() => {
            e.target.classList.remove('touch-active');
        }, 150);
    }

    handleInputFocus(e) {
        // Scroll al input cuando se enfoca (evita que el teclado lo tape)
        if (this.isMobile) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }

    handleInputBlur(e) {
        // Restaurar viewport después de cerrar teclado
        if (this.isMobile) {
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        }
    }

    // Utilidades
    addDeviceClasses() {
        const body = document.body;
        body.classList.add(`screen-${this.screenSize}`);
        
        if (this.isMobile) body.classList.add('is-mobile');
        if (this.isTablet) body.classList.add('is-tablet');
        if (this.isTouch) body.classList.add('is-touch');
        if (!this.isTouch) body.classList.add('no-touch');
    }

    updateDeviceClasses() {
        const body = document.body;
        // Remover clases de tamaño anteriores
        body.classList.remove('screen-xs', 'screen-sm', 'screen-md', 'screen-lg', 'screen-xl');
        // Añadir nueva clase de tamaño
        body.classList.add(`screen-${this.screenSize}`);
    }

    adjustLayout() {
        // Ajustar tablas para scroll horizontal en móviles
        this.adjustTables();
        // Ajustar sidebar en móviles
        this.adjustSidebar();
        // Ajustar formularios
        this.adjustForms();
    }

    adjustTables() {
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            if (!table.closest('.table-responsive')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-responsive';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    }

    adjustSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && this.isMobile) {
            // Convertir sidebar a navegación horizontal en móviles
            const navMenu = sidebar.querySelector('.nav-menu');
            if (navMenu && !navMenu.classList.contains('mobile-adjusted')) {
                navMenu.classList.add('mobile-adjusted');
            }
        }
    }

    adjustForms() {
        // Agrupar campos de formulario en filas responsive
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const formGroups = form.querySelectorAll('.form-group');
            if (formGroups.length > 2 && !form.classList.contains('responsive-adjusted')) {
                this.createFormRows(form, formGroups);
                form.classList.add('responsive-adjusted');
            }
        });
    }

    createFormRows(form, formGroups) {
        // Crear filas de formulario para mejor organización en móviles
        let currentRow = null;
        let itemsInRow = 0;
        const maxItemsPerRow = this.isMobile ? 1 : 2;

        formGroups.forEach((group, index) => {
            if (itemsInRow === 0) {
                currentRow = document.createElement('div');
                currentRow.className = 'form-row';
                group.parentNode.insertBefore(currentRow, group);
            }

            currentRow.appendChild(group);
            itemsInRow++;

            if (itemsInRow >= maxItemsPerRow) {
                itemsInRow = 0;
                currentRow = null;
            }
        });
    }

    preventInputZoom() {
        // Prevenir zoom automático en inputs en iOS
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="number"], textarea, select');
        inputs.forEach(input => {
            if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }
        });
    }

    // Métodos públicos para uso externo
    isMobileDevice() {
        return this.isMobile;
    }

    isTabletDevice() {
        return this.isTablet;
    }

    isTouchDevice() {
        return this.isTouch;
    }

    getCurrentScreenSize() {
        return this.screenSize;
    }

    // Utilidad para mostrar/ocultar elementos según el tamaño de pantalla
    showOnMobile(element) {
        if (this.isMobile) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    }

    hideOnMobile(element) {
        if (this.isMobile) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
    }

    // Utilidad para scroll suave a elemento
    scrollToElement(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }

    // Utilidad para detectar si un elemento está visible en viewport
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Utilidad para lazy loading de imágenes
    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// CSS adicional para efectos táctiles
const touchStyles = `
.touch-active {
    opacity: 0.7;
    transform: scale(0.98);
    transition: all 0.1s ease;
}

.is-touch .btn:hover {
    transform: none;
}

.is-touch .nav-link:hover {
    background: transparent;
}

.is-mobile .table-responsive {
    border: 1px solid #dee2e6;
    border-radius: 8px;
}

.is-mobile .form-row {
    margin-bottom: 15px;
}

.is-mobile .btn-group {
    flex-direction: column;
}

.is-mobile .btn-group .btn {
    margin-bottom: 5px;
    border-radius: 8px;
}

@media (max-width: 768px) {
    .mobile-hide {
        display: none !important;
    }
    
    .mobile-show {
        display: block !important;
    }
    
    .mobile-text-center {
        text-align: center !important;
    }
}

@media (min-width: 769px) {
    .desktop-hide {
        display: none !important;
    }
    
    .desktop-show {
        display: block !important;
    }
}
`;

// Inyectar estilos
const responsiveStyleSheet = document.createElement('style');
responsiveStyleSheet.textContent = touchStyles;
document.head.appendChild(responsiveStyleSheet);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.responsiveUtils = new ResponsiveUtils();
    });
} else {
    window.responsiveUtils = new ResponsiveUtils();
}

// Exportar para uso global
window.ResponsiveUtils = ResponsiveUtils;