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
        // Sanitizar datos
        const cleanEmail = SecurityUtils.sanitizeEmail(email);
        
        // Validaciones
        if (!Utils.validateEmail(cleanEmail)) {
            throw new Error('Email no válido');
        }

        // Rate limiting
        if (!SecurityUtils.checkRateLimit(`login_${cleanEmail}`, 5, 15 * 60 * 1000)) {
            throw new Error('Demasiados intentos fallidos. Espere 15 minutos');
        }

        // Validación rápida sin delays artificiales
        
        const user = await window.dbAdapter.getUserByEmail(cleanEmail);
        if (!user) {
            throw new Error('Email o contraseña incorrectos');
        }

        const isValidPassword = await SecurityUtils.verifyPassword(password, user.password);
        if (!isValidPassword) {
            throw new Error('Email o contraseña incorrectos');
        }

        // Crear sesión
        window.sessionManager.createSession(user);
        this.currentUser = user;
        
        // Cachear sesión
        if (window.sessionCache) {
            window.sessionCache.cacheSession(user);
        }
        
        return user;
    }

    async register(userData) {
        const { name, email, password, role } = userData;
        
        // Sanitizar datos
        const cleanName = SecurityUtils.sanitizeString(name);
        const cleanEmail = SecurityUtils.sanitizeEmail(email);
        const cleanRole = SecurityUtils.sanitizeString(role).toLowerCase();

        // Validaciones
        if (!Utils.validateStringLength(cleanName, 2, 100)) {
            throw new Error('El nombre debe tener entre 2 y 100 caracteres');
        }

        if (!Utils.validateEmail(cleanEmail)) {
            throw new Error('Email no válido');
        }

        const passwordValidation = SecurityUtils.validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            throw new Error(passwordValidation.message);
        }

        if (!SecurityUtils.validateRole(cleanRole)) {
            throw new Error('Rol no válido');
        }

        // Rate limiting
        if (!SecurityUtils.checkRateLimit('registration', 3, 60000)) {
            throw new Error('Demasiados intentos de registro. Espere un minuto');
        }

        // Verificar email único
        const existingUser = await window.dbAdapter.getUserByEmail(cleanEmail);
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        // Crear usuario
        const hashedPassword = await SecurityUtils.hashPassword(password);
        const nextId = await window.dbAdapter.getNextId('users');
        
        const newUser = {
            id: nextId,
            email: cleanEmail,
            password: hashedPassword,
            name: cleanName,
            role: cleanRole,
            created_at: new Date().toISOString()
        };

        await window.dbAdapter.saveUser(newUser);
        return newUser;
    }

    logout() {
        if (window.destroySessionIndicator) {
            window.destroySessionIndicator();
        }
        
        window.sessionManager.destroySession();
        this.currentUser = null;
        
        // Limpiar cache
        if (window.sessionCache) {
            window.sessionCache.clear();
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
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