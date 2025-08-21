// Gestor de autenticación
if (typeof window.AuthManager === 'undefined') {
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    loadCurrentUser() {
        // Intentar cargar desde cache primero
        if (window.sessionCache) {
            const cachedUser = window.sessionCache.getCachedSession();
            if (cachedUser) {
                this.currentUser = cachedUser;
                return;
            }
        }
        
        // Fallback a session manager
        const user = window.sessionManager.getCurrentUser();
        if (user) {
            this.currentUser = user;
            // Cachear para próximas cargas
            if (window.sessionCache) {
                window.sessionCache.cacheSession(user);
            }
        }
    }

    async login(email, password) {
        try {
            const user = await window.apiClient.login(email, password);
            
            // Crear sesión local
            if (window.sessionManager) {
                window.sessionManager.createSession(user);
            }
            
            this.currentUser = user;
            
            // Cachear sesión
            if (window.sessionCache) {
                window.sessionCache.cacheSession(user);
            }
            
            return user;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const result = await window.apiClient.register(userData);
            return result.user || result;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    }

    logout() {
        if (window.destroySessionIndicator) {
            window.destroySessionIndicator();
        }
        
        window.apiClient.logout();
        
        if (window.sessionManager) {
            window.sessionManager.destroySession();
        }
        
        this.currentUser = null;
        
        // Limpiar cache
        if (window.sessionCache) {
            window.sessionCache.clear();
        }
    }

    isAuthenticated() {
        if (window.apiClient.isAuthenticated()) {
            if (!this.currentUser) {
                this.currentUser = window.apiClient.getCurrentUser();
            }
            return true;
        }
        return this.currentUser !== null;
    }

    getCurrentUser() {
        if (!this.currentUser && window.apiClient.isAuthenticated()) {
            this.currentUser = window.apiClient.getCurrentUser();
        }
        return this.currentUser;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // Usar cache de permisos si está disponible
        if (window.sessionCache) {
            const cachedPermissions = window.sessionCache.getCachedPermissions();
            if (cachedPermissions) {
                return cachedPermissions.includes(permission);
            }
        }
        
        // Fallback a cálculo directo
        const permissions = {
            admin: ['read', 'write', 'delete', 'manage_users'],
            teacher: ['read', 'write', 'manage_grades'],
            student: ['read']
        };
        
        return permissions[this.currentUser.role]?.includes(permission) || false;
    }
}

window.AuthManager = AuthManager;
}