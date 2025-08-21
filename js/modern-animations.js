// Animaciones y micro-interacciones modernas
if (typeof window.ModernAnimations === 'undefined') {
class ModernAnimations {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupParallax();
    }
    
    // Animaciones al hacer scroll
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observar elementos que deben animarse
        const initAnimations = () => {
            const animateElements = document.querySelectorAll('.widget, .card, .stat-widget');
            animateElements.forEach(el => {
                el.classList.add('animate-on-scroll');
                observer.observe(el);
            });
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAnimations);
        } else {
            requestAnimationFrame(initAnimations);
        }
    }
    
    // Efectos hover avanzados
    setupHoverEffects() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.widget')) {
                this.addRippleEffect(e.target.closest('.widget'), e);
            }
            
            if (e.target.closest('.btn')) {
                this.addButtonGlow(e.target.closest('.btn'));
            }
        });
    }
    
    // Efecto ripple en widgets
    addRippleEffect(element, event) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Efecto glow en botones
    addButtonGlow(button) {
        button.classList.add('btn-glow');
        setTimeout(() => {
            button.classList.remove('btn-glow');
        }, 300);
    }
    
    // Animaciones de carga suaves
    setupLoadingAnimations() {
        const originalLoadingManager = window.LoadingManager;
        if (originalLoadingManager) {
            window.LoadingManager.show = (element, message = 'Cargando...') => {
                const overlay = document.createElement('div');
                overlay.className = 'modern-loading-overlay';
                overlay.innerHTML = `
                    <div class="modern-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <div class="loading-text">${message}</div>
                `;
                
                element.style.position = 'relative';
                element.appendChild(overlay);
                
                // Animación de entrada
                requestAnimationFrame(() => {
                    overlay.classList.add('show');
                });
            };
            
            window.LoadingManager.hide = (element) => {
                const overlay = element.querySelector('.modern-loading-overlay');
                if (overlay) {
                    overlay.classList.add('hide');
                    setTimeout(() => {
                        overlay.remove();
                    }, 300);
                }
            };
        }
    }
    
    // Efecto parallax sutil
    setupParallax() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax-bg');
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick);
    }
    
    // Animación de números contadores
    animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    // Animación de barras de progreso
    animateProgressBar(element, percentage, duration = 1000) {
        element.style.width = '0%';
        element.style.transition = `width ${duration}ms ease-out`;
        
        requestAnimationFrame(() => {
            element.style.width = percentage + '%';
        });
    }
    
    // Transiciones de página suaves
    pageTransition(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        document.body.appendChild(overlay);
        
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        setTimeout(() => {
            callback();
            overlay.classList.add('exit');
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }, 300);
    }
}

// Inicializar animaciones modernas
window.ModernAnimations = ModernAnimations;
if (!window.modernAnimations) {
    window.modernAnimations = new ModernAnimations();
}
}