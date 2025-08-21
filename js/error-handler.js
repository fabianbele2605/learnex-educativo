/**
 * Error Handler - Sistema robusto de manejo de errores
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.notificationContainer = null;
        
        this.init();
    }

    /**
     * Inicializar el manejador de errores
     */
    init() {
        this.createNotificationContainer();
        this.setupGlobalErrorHandlers();
        this.addStyles();
    }

    /**
     * Crear contenedor de notificaciones
     */
    createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'error-notifications';
        this.notificationContainer.className = 'error-notifications-container';
        document.body.appendChild(this.notificationContainer);
    }

    /**
     * Configurar manejadores globales de errores
     */
    setupGlobalErrorHandlers() {
        // Errores de JavaScript no capturados
        window.addEventListener('error', (event) => {
            this.handleJavaScriptError(event.error, event.filename, event.lineno, event.colno);
        });

        // Promesas rechazadas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event.reason);
        });

        // Errores de recursos (imágenes, scripts, etc.)
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event.target);
            }
        }, true);
    }

    /**
     * Agregar estilos CSS
     */
    addStyles() {
        const existingStyles = document.getElementById('error-handler-styles');
        if (existingStyles) return;

        const styles = document.createElement('style');
        styles.id = 'error-handler-styles';
        styles.textContent = `
            .error-notifications-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }
            
            .error-notification {
                background: #fff;
                border-left: 4px solid #dc3545;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                position: relative;
                animation: slideInRight 0.3s ease;
            }
            
            .error-notification.warning {
                border-left-color: #ffc107;
            }
            
            .error-notification.info {
                border-left-color: #17a2b8;
            }
            
            .error-notification.success {
                border-left-color: #28a745;
            }
            
            .error-notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .error-notification-title {
                font-weight: 600;
                color: #333;
                font-size: 14px;
            }
            
            .error-notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 18px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .error-notification-close:hover {
                color: #666;
            }
            
            .error-notification-message {
                color: #666;
                font-size: 13px;
                line-height: 1.4;
                margin-bottom: 8px;
            }
            
            .error-notification-details {
                background: #f8f9fa;
                border-radius: 3px;
                color: #666;
                font-family: monospace;
                font-size: 11px;
                margin-top: 8px;
                max-height: 100px;
                overflow-y: auto;
                padding: 8px;
            }
            
            .error-notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .error-notification-btn {
                background: #007bff;
                border: none;
                border-radius: 3px;
                color: white;
                cursor: pointer;
                font-size: 12px;
                padding: 6px 12px;
                transition: background-color 0.2s;
            }
            
            .error-notification-btn:hover {
                background: #0056b3;
            }
            
            .error-notification-btn.secondary {
                background: #6c757d;
            }
            
            .error-notification-btn.secondary:hover {
                background: #545b62;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .error-notification.removing {
                animation: slideOutRight 0.3s ease;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Manejar errores de JavaScript
     */
    handleJavaScriptError(error, filename, lineno, colno) {
        const errorInfo = {
            type: 'javascript',
            message: error?.message || 'Error de JavaScript desconocido',
            filename: filename || 'desconocido',
            line: lineno || 0,
            column: colno || 0,
            stack: error?.stack || '',
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'error',
            title: 'Error de JavaScript',
            message: `Se produjo un error inesperado: ${errorInfo.message}`,
            details: `Archivo: ${errorInfo.filename}:${errorInfo.line}:${errorInfo.column}`,
            actions: [
                {
                    text: 'Recargar página',
                    action: () => window.location.reload()
                },
                {
                    text: 'Reportar error',
                    action: () => this.reportError(errorInfo)
                }
            ]
        });
    }

    /**
     * Manejar promesas rechazadas
     */
    handlePromiseRejection(reason) {
        const errorInfo = {
            type: 'promise',
            message: reason?.message || reason || 'Promesa rechazada',
            stack: reason?.stack || '',
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'error',
            title: 'Error de operación asíncrona',
            message: `Falló una operación: ${errorInfo.message}`,
            actions: [
                {
                    text: 'Reintentar',
                    action: () => window.location.reload()
                }
            ]
        });
    }

    /**
     * Manejar errores de recursos
     */
    handleResourceError(element) {
        const errorInfo = {
            type: 'resource',
            element: element.tagName,
            source: element.src || element.href || 'desconocido',
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'warning',
            title: 'Error de carga de recurso',
            message: `No se pudo cargar: ${errorInfo.element} - ${errorInfo.source}`,
            autoClose: 5000
        });
    }

    /**
     * Manejar errores de red
     */
    handleNetworkError(error, context = '') {
        const errorInfo = {
            type: 'network',
            message: error.message || 'Error de red',
            context: context,
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'error',
            title: 'Error de conexión',
            message: `Problema de conectividad: ${errorInfo.message}`,
            details: context ? `Contexto: ${context}` : '',
            actions: [
                {
                    text: 'Reintentar',
                    action: () => window.location.reload()
                },
                {
                    text: 'Verificar conexión',
                    action: () => this.checkNetworkStatus()
                }
            ]
        });
    }

    /**
     * Manejar errores de validación
     */
    handleValidationError(field, message) {
        const errorInfo = {
            type: 'validation',
            field: field,
            message: message,
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'warning',
            title: 'Error de validación',
            message: `${field}: ${message}`,
            autoClose: 3000
        });
    }

    /**
     * Manejar errores de autenticación
     */
    handleAuthError(message) {
        const errorInfo = {
            type: 'authentication',
            message: message,
            timestamp: new Date().toISOString()
        };

        this.logError(errorInfo);
        this.showNotification({
            type: 'error',
            title: 'Error de autenticación',
            message: message,
            actions: [
                {
                    text: 'Iniciar sesión',
                    action: () => window.app?.navigate('/login')
                }
            ]
        });
    }

    /**
     * Mostrar notificación
     */
    showNotification(options) {
        const notification = document.createElement('div');
        notification.className = `error-notification ${options.type || 'error'}`;
        
        const id = 'notification-' + Date.now();
        notification.id = id;
        
        notification.innerHTML = `
            <div class="error-notification-header">
                <div class="error-notification-title">${options.title}</div>
                <button class="error-notification-close" onclick="errorHandler.closeNotification('${id}')">&times;</button>
            </div>
            <div class="error-notification-message">${options.message}</div>
            ${options.details ? `<div class="error-notification-details">${options.details}</div>` : ''}
            ${options.actions ? this.createActionButtons(options.actions, id) : ''}
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Auto-cerrar si se especifica
        if (options.autoClose) {
            setTimeout(() => {
                this.closeNotification(id);
            }, options.autoClose);
        }
        
        return id;
    }

    /**
     * Crear botones de acción
     */
    createActionButtons(actions, notificationId) {
        const buttonsHtml = actions.map((action, index) => {
            const className = index === 0 ? 'error-notification-btn' : 'error-notification-btn secondary';
            return `<button class="${className}" onclick="errorHandler.executeAction('${notificationId}', ${index})">${action.text}</button>`;
        }).join('');
        
        return `<div class="error-notification-actions">${buttonsHtml}</div>`;
    }

    /**
     * Ejecutar acción de notificación
     */
    executeAction(notificationId, actionIndex) {
        const notification = document.getElementById(notificationId);
        if (notification && this.pendingActions && this.pendingActions[notificationId]) {
            const action = this.pendingActions[notificationId][actionIndex];
            if (action && action.action) {
                action.action();
            }
        }
        this.closeNotification(notificationId);
    }

    /**
     * Cerrar notificación
     */
    closeNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                if (this.pendingActions) {
                    delete this.pendingActions[id];
                }
            }, 300);
        }
    }

    /**
     * Registrar error en el log
     */
    logError(errorInfo) {
        this.errorLog.unshift(errorInfo);
        
        // Mantener tamaño máximo del log
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        // Log en consola para desarrollo
        console.error('Error registrado:', errorInfo);
    }

    /**
     * Obtener log de errores
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Limpiar log de errores
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Reportar error (placeholder para integración futura)
     */
    reportError(errorInfo) {
        console.log('Reportando error:', errorInfo);
        this.showNotification({
            type: 'info',
            title: 'Error reportado',
            message: 'Gracias por reportar este error. Nuestro equipo lo revisará.',
            autoClose: 3000
        });
    }

    /**
     * Verificar estado de la red
     */
    checkNetworkStatus() {
        if (navigator.onLine) {
            this.showNotification({
                type: 'success',
                title: 'Conexión activa',
                message: 'Su conexión a internet está funcionando correctamente.',
                autoClose: 3000
            });
        } else {
            this.showNotification({
                type: 'error',
                title: 'Sin conexión',
                message: 'No hay conexión a internet. Verifique su conectividad.',
                autoClose: 5000
            });
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess(title, message, autoClose = 3000) {
        return this.showNotification({
            type: 'success',
            title: title,
            message: message,
            autoClose: autoClose
        });
    }

    /**
     * Mostrar mensaje de información
     */
    showInfo(title, message, autoClose = 5000) {
        return this.showNotification({
            type: 'info',
            title: title,
            message: message,
            autoClose: autoClose
        });
    }

    /**
     * Mostrar mensaje de advertencia
     */
    showWarning(title, message, autoClose = 5000) {
        return this.showNotification({
            type: 'warning',
            title: title,
            message: message,
            autoClose: autoClose
        });
    }
}

// Crear instancia global
window.errorHandler = new ErrorHandler();

// Almacenar acciones pendientes para las notificaciones
window.errorHandler.pendingActions = {};

// Sobrescribir el método showNotification para manejar acciones
const originalShowNotification = window.errorHandler.showNotification;
window.errorHandler.showNotification = function(options) {
    const id = originalShowNotification.call(this, options);
    if (options.actions) {
        this.pendingActions[id] = options.actions;
    }
    return id;
};