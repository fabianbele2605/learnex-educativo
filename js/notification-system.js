// Sistema de Notificaciones Avanzado
if (typeof window.NotificationSystem === 'undefined') {
class NotificationSystem {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        this.permission = 'default';
        this.init();
    }
    
    async init() {
        // Crear centro de notificaciones inmediatamente
        this.createNotificationCenter();
        this.setupEventListeners();
        
        // Inicializar permisos y recordatorios de forma lazy
        requestIdleCallback(async () => {
            await this.requestPermission();
            this.scheduleReminders();
        });
    }
    
    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }
    
    createNotificationCenter() {
        // Crear botón de notificaciones en navbar
        const navbar = document.querySelector('.navbar .nav-user');
        if (navbar && !document.querySelector('.notifications-btn')) {
            const notifBtn = document.createElement('button');
            notifBtn.className = 'btn btn-outline notifications-btn';
            notifBtn.innerHTML = `
                <i class="fas fa-bell"></i>
                <span class="notification-badge" style="display: none;">0</span>
            `;
            notifBtn.addEventListener('click', () => this.openNotificationCenter());
            navbar.insertBefore(notifBtn, navbar.firstChild);
        }
        
        this.updateNotificationBadge();
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="mark-read"]')) {
                const notifId = e.target.dataset.notificationId;
                this.markAsRead(notifId);
            }
            if (e.target.matches('[data-action="clear-all"]')) {
                this.clearAllNotifications();
            }
        });
    }
    
    addNotification(notification) {
        const newNotification = {
            id: Date.now().toString(),
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info', // info, success, warning, error, message
            timestamp: new Date().toISOString(),
            read: false,
            userId: notification.userId,
            data: notification.data || {}
        };
        
        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.updateNotificationBadge();
        
        // Mostrar notificación del navegador
        this.showBrowserNotification(newNotification);
        
        // Mostrar notificación toast
        this.showToastNotification(newNotification);
        
        return newNotification;
    }
    
    showBrowserNotification(notification) {
        if (this.permission === 'granted' && document.hidden) {
            const browserNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            });
            
            browserNotif.onclick = () => {
                window.focus();
                this.handleNotificationClick(notification);
                browserNotif.close();
            };
            
            setTimeout(() => browserNotif.close(), 5000);
        }
    }
    
    showToastNotification(notification) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // Animación de entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    openNotificationCenter() {
        const currentUser = window.sessionManager.getCurrentUser();
        const userNotifications = this.notifications.filter(n => 
            !n.userId || n.userId === currentUser.id
        );
        
        const modal = document.createElement('div');
        modal.className = 'modal notification-modal';
        modal.innerHTML = `
            <div class="modal-content notification-content">
                <div class="notification-header">
                    <h3><i class="fas fa-bell"></i> Centro de Notificaciones</h3>
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-secondary" data-action="clear-all">
                            <i class="fas fa-trash"></i> Limpiar Todo
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="notifications-list">
                    ${userNotifications.length === 0 ? 
                        '<div class="empty-notifications">No hay notificaciones</div>' :
                        userNotifications.map(notif => `
                            <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-notification-id="${notif.id}">
                                <div class="notification-icon ${notif.type}">
                                    <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                                </div>
                                <div class="notification-content">
                                    <div class="notification-title">${notif.title}</div>
                                    <div class="notification-message">${notif.message}</div>
                                    <div class="notification-time">${this.formatTime(notif.timestamp)}</div>
                                </div>
                                ${!notif.read ? `
                                    <button class="btn btn-sm btn-primary" data-action="mark-read" data-notification-id="${notif.id}">
                                        Marcar como leída
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationBadge();
            
            // Actualizar UI
            const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notifElement) {
                notifElement.classList.remove('unread');
                notifElement.classList.add('read');
                const markBtn = notifElement.querySelector('[data-action="mark-read"]');
                if (markBtn) markBtn.remove();
            }
        }
    }
    
    clearAllNotifications() {
        this.notifications = [];
        this.saveNotifications();
        this.updateNotificationBadge();
        
        const modal = document.querySelector('.notification-modal');
        if (modal) modal.remove();
    }
    
    updateNotificationBadge() {
        const currentUser = window.sessionManager.getCurrentUser();
        const unreadCount = this.notifications.filter(n => 
            !n.read && (!n.userId || n.userId === currentUser.id)
        ).length;
        
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    scheduleReminders() {
        // Verificar recordatorios cada 5 minutos
        setInterval(() => {
            this.checkScheduledReminders();
        }, 5 * 60 * 1000);
        
        // Verificar inmediatamente
        this.checkScheduledReminders();
    }
    
    checkScheduledReminders() {
        const events = JSON.parse(localStorage.getItem('calendar_events') || '[]');
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const timeDiff = eventDate.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Recordatorio 24 horas antes
            if (hoursDiff > 23 && hoursDiff <= 24) {
                this.addNotification({
                    title: 'Recordatorio: Evento Mañana',
                    message: `${event.title} - ${event.date}`,
                    type: 'warning'
                });
            }
            
            // Recordatorio 1 hora antes
            if (hoursDiff > 0.5 && hoursDiff <= 1) {
                this.addNotification({
                    title: 'Recordatorio: Evento en 1 hora',
                    message: `${event.title} - ${event.date}`,
                    type: 'error'
                });
            }
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'exclamation-circle',
            message: 'comment'
        };
        return icons[type] || 'bell';
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString();
    }
    
    handleNotificationClick(notification) {
        if (notification.type === 'message' && notification.data.senderId) {
            // Abrir chat con el remitente
            if (window.messagingSystem) {
                window.messagingSystem.openChatModal();
                setTimeout(() => {
                    window.messagingSystem.openConversation(notification.data.senderId);
                }, 100);
            }
        }
        
        this.markAsRead(notification.id);
    }
    
    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
}

window.NotificationSystem = NotificationSystem;
}