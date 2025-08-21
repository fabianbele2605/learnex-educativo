// Gestor de notificaciones
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupEventListeners();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const {
            duration = 5000,
            persistent = false,
            actions = []
        } = options;

        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            duration,
            persistent,
            actions,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.render(notification);

        if (!persistent && duration > 0) {
            setTimeout(() => this.hide(notification.id), duration);
        }

        return notification.id;
    }

    render(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;

        const actionsHTML = notification.actions.map(action => 
            `<button class="notification-action" data-action="${action.id}">${action.label}</button>`
        ).join('');

        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                ${actionsHTML ? `<div class="notification-actions">${actionsHTML}</div>` : ''}
            </div>
            ${!notification.persistent ? '<button class="notification-close">&times;</button>' : ''}
        `;

        // Eventos
        element.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-close')) {
                this.hide(notification.id);
            } else if (e.target.classList.contains('notification-action')) {
                const actionId = e.target.dataset.action;
                const action = notification.actions.find(a => a.id === actionId);
                if (action && action.handler) {
                    action.handler();
                }
            }
        });

        this.container.appendChild(element);
        
        // Animación de entrada
        setTimeout(() => element.classList.add('show'), 10);
    }

    hide(id) {
        const element = this.container.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('hide');
            setTimeout(() => {
                element.remove();
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    clear() {
        this.notifications.forEach(n => this.hide(n.id));
    }

    setupEventListeners() {
        // Limpiar notificaciones al cambiar de página
        window.addEventListener('beforeunload', () => this.clear());
    }

    // Métodos de conveniencia
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 8000 });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
}

// CSS para notificaciones
const notificationStyles = `
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
}

.notification {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    border-left: 4px solid #667eea;
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification.hide {
    transform: translateX(100%);
    opacity: 0;
}

.notification-success {
    border-left-color: #28a745;
}

.notification-error {
    border-left-color: #dc3545;
}

.notification-warning {
    border-left-color: #ffc107;
}

.notification-content {
    flex: 1;
}

.notification-message {
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
}

.notification-actions {
    display: flex;
    gap: 8px;
}

.notification-action {
    padding: 4px 12px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    margin-left: 8px;
}
`;

const notificationStyleSheet = document.createElement('style');
notificationStyleSheet.textContent = notificationStyles;
document.head.appendChild(notificationStyleSheet);

window.NotificationManager = NotificationManager;