/**
 * Session Manager - Manejo seguro de sesiones y tokens
 */
class SessionManager {
    constructor() {
        this.sessionKey = 'sms_session';
        this.tokenKey = 'sms_token';
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 horas
        this.refreshThreshold = 30 * 60 * 1000; // 30 minutos
        
        // Inicializar de forma lazy para no bloquear carga
        requestIdleCallback(() => {
            this.initSessionCheck();
            this.initActivityListener();
        });
    }

    initActivityListener() {
        // Throttle para evitar demasiadas llamadas
        let lastActivity = 0;
        const throttleTime = 30000; // 30 segundos
        
        const throttledExtend = () => {
            const now = Date.now();
            if (now - lastActivity > throttleTime) {
                this.extendSessionOnActivity();
                lastActivity = now;
            }
        };
        
        // Solo eventos esenciales
        document.addEventListener('click', throttledExtend);
        document.addEventListener('keydown', throttledExtend);
    }

    initSessionCheck() {
        // Verificar sesión cada 5 minutos (menos frecuente)
        setInterval(() => {
            if (this.isAuthenticated() && this.isSessionExpired()) {
                this.destroySession();
                if (window.app) {
                    window.app.handleSessionExpired();
                }
            }
        }, 300000);
    }

    createSession(user) {
        const session = {
            user: user,
            token: this.generateToken(),
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
        return session;
    }

    getCurrentSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    getCurrentUser() {
        const session = this.getCurrentSession();
        return session ? session.user : null;
    }

    updateSession(session) {
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    destroySession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.tokenKey);
    }

    isAuthenticated() {
        const session = this.getCurrentSession();
        return session !== null && !this.isSessionExpired();
    }

    isSessionExpired() {
        const session = this.getCurrentSession();
        return !session || Date.now() >= session.expiresAt;
    }

    extendSessionOnActivity() {
        const session = this.getCurrentSession();
        if (session) {
            session.lastActivity = Date.now();
            session.expiresAt = Date.now() + this.sessionTimeout;
            this.updateSession(session);
        }
    }

    // Nuevo método para obtener el tiempo restante de la sesión
    getSessionTimeRemaining() {
        const session = this.getCurrentSession();
        if (!session) return 0;
        
        const timeRemaining = session.expiresAt - Date.now();
        return Math.max(0, timeRemaining);
    }

    // Nuevo método para refrescar la sesión manualmente
    refreshSession() {
        const session = this.getCurrentSession();
        if (!session) return false;

        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + this.sessionTimeout;
        this.updateSession(session);
        return true;
    }

    generateToken() {
        // Generar un token aleatorio de 32 caracteres
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
}

// Crear instancia global
window.sessionManager = new SessionManager();