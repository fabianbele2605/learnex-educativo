// Cache de sesiones para carga instantánea
if (typeof window.SessionCache === 'undefined') {
class SessionCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutos
        this.init();
    }
    
    init() {
        // Limpiar cache expirado cada minuto
        setInterval(() => this.cleanup(), 60000);
    }
    
    set(key, value) {
        this.cache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }
    
    // Cache específico para sesiones
    cacheSession(user) {
        this.set('current_user', user);
        this.set('user_permissions', this.calculatePermissions(user));
    }
    
    getCachedSession() {
        return this.get('current_user');
    }
    
    getCachedPermissions() {
        return this.get('user_permissions');
    }
    
    calculatePermissions(user) {
        const permissions = {
            admin: ['read', 'write', 'delete', 'manage_users'],
            teacher: ['read', 'write', 'manage_grades'],
            student: ['read']
        };
        
        return permissions[user.role] || [];
    }
}

window.SessionCache = SessionCache;
window.sessionCache = new SessionCache();
}