/**
 * Session Indicator - Indicador visual del estado de la sesión
 */
class SessionIndicator {
    constructor() {
        this.indicatorElement = null;
        this.updateInterval = null;
        this.warningThreshold = 5 * 60 * 1000; // 5 minutos
        this.criticalThreshold = 2 * 60 * 1000; // 2 minutos
        
        this.init();
    }

    /**
     * Inicializar el indicador de sesión
     */
    init() {
        this.createIndicator();
        this.startUpdateLoop();
        
        // Escuchar eventos de actividad del usuario
        this.bindActivityEvents();
    }

    /**
     * Crear el elemento indicador en el DOM
     */
    createIndicator() {
        // Crear contenedor del indicador
        this.indicatorElement = document.createElement('div');
        this.indicatorElement.id = 'session-indicator';
        this.indicatorElement.className = 'session-indicator';
        
        // Agregar estilos CSS si no existen
        this.addStyles();
        
        // Insertar en el header del dashboard
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(this.indicatorElement);
        }
    }

    /**
     * Agregar estilos CSS para el indicador
     */
    addStyles() {
        const existingStyles = document.getElementById('session-indicator-styles');
        if (existingStyles) return;

        const styles = document.createElement('style');
        styles.id = 'session-indicator-styles';
        styles.textContent = `
            .session-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                transition: all 0.3s ease;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .session-indicator.warning {
                background: #ffc107;
                color: #212529;
                animation: pulse 2s infinite;
            }
            
            .session-indicator.critical {
                background: #dc3545;
                color: white;
                animation: blink 1s infinite;
            }
            
            .session-indicator.expired {
                background: #6c757d;
                color: white;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.5; }
            }
            
            .session-indicator:hover {
                transform: scale(1.1);
            }
            
            .session-tooltip {
                position: absolute;
                top: 100%;
                right: 0;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                margin-top: 5px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .session-indicator:hover .session-tooltip {
                opacity: 1;
                visibility: visible;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Iniciar el bucle de actualización
     */
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.updateIndicator();
        }, 1000); // Actualizar cada segundo
    }

    /**
     * Detener el bucle de actualización
     */
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Actualizar el indicador visual
     */
    updateIndicator() {
        if (!this.indicatorElement) return;
        
        const timeRemaining = window.sessionManager.getSessionTimeRemaining();
        
        if (timeRemaining <= 0) {
            this.showExpiredState();
            return;
        }
        
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        
        // Actualizar texto
        const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        this.indicatorElement.innerHTML = `
            <span>⏱️ ${timeText}</span>
            <div class="session-tooltip">
                Tiempo restante de sesión<br>
                Haga clic para extender
            </div>
        `;
        
        // Actualizar estado visual
        this.updateVisualState(timeRemaining);
    }

    /**
     * Actualizar el estado visual según el tiempo restante
     */
    updateVisualState(timeRemaining) {
        this.indicatorElement.className = 'session-indicator';
        
        if (timeRemaining <= this.criticalThreshold) {
            this.indicatorElement.classList.add('critical');
        } else if (timeRemaining <= this.warningThreshold) {
            this.indicatorElement.classList.add('warning');
        }
    }

    /**
     * Mostrar estado de sesión expirada
     */
    showExpiredState() {
        this.indicatorElement.className = 'session-indicator expired';
        this.indicatorElement.innerHTML = `
            <span>❌ Expirada</span>
            <div class="session-tooltip">
                Sesión expirada<br>
                Inicie sesión nuevamente
            </div>
        `;
        
        this.stopUpdateLoop();
    }

    /**
     * Vincular eventos de actividad del usuario
     */
    bindActivityEvents() {
        // Eventos que indican actividad del usuario
        const activityEvents = ['click', 'keypress', 'scroll', 'mousemove'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                window.sessionManager.extendSessionOnActivity();
            }, { passive: true });
        });
        
        // Evento de clic en el indicador para extender sesión
        if (this.indicatorElement) {
            this.indicatorElement.addEventListener('click', () => {
                this.extendSession();
            });
        }
    }

    /**
     * Extender la sesión manualmente
     */
    extendSession() {
        const refreshedSession = window.sessionManager.refreshSession();
        if (refreshedSession) {
            this.showExtensionNotification();
        }
    }

    /**
     * Mostrar notificación de extensión de sesión
     */
    showExtensionNotification() {
        const notification = document.createElement('div');
        notification.className = 'session-extension-notification';
        notification.textContent = '✅ Sesión extendida';
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * Mostrar el indicador
     */
    show() {
        if (this.indicatorElement) {
            this.indicatorElement.style.display = 'block';
            this.startUpdateLoop();
        }
    }

    /**
     * Ocultar el indicador
     */
    hide() {
        if (this.indicatorElement) {
            this.indicatorElement.style.display = 'none';
            this.stopUpdateLoop();
        }
    }

    /**
     * Destruir el indicador
     */
    destroy() {
        this.stopUpdateLoop();
        if (this.indicatorElement && this.indicatorElement.parentNode) {
            this.indicatorElement.parentNode.removeChild(this.indicatorElement);
        }
    }
}

// Crear instancia global cuando el usuario esté autenticado
window.createSessionIndicator = () => {
    if (!window.sessionIndicator && window.sessionManager.isAuthenticated()) {
        window.sessionIndicator = new SessionIndicator();
    }
};

window.destroySessionIndicator = () => {
    if (window.sessionIndicator) {
        window.sessionIndicator.destroy();
        window.sessionIndicator = null;
    }
};