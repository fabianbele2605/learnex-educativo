// Utilidades de seguridad para la aplicación
class SecurityUtils {
    // Sanitización de datos
    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        
        return str
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/<object[^>]*>.*?<\/object>/gi, '')
            .replace(/<embed[^>]*>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<meta[^>]*>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/expression\s*\(/gi, '')
            .replace(/url\s*\(/gi, '')
            .replace(/[<>"']/g, (match) => {
                const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
                return entities[match];
            })
            .trim();
    }

    static sanitizeEmail(email) {
        if (typeof email !== 'string') return '';
        
        return email
            .toLowerCase()
            .replace(/[^a-z0-9@._-]/g, '') // Solo caracteres válidos para email
            .trim();
    }

    static sanitizeNumeric(value, min = null, max = null) {
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        
        if (min !== null && num < min) return min;
        if (max !== null && num > max) return max;
        
        return num;
    }

    static sanitizeInteger(value, min = null, max = null) {
        const num = parseInt(value);
        if (isNaN(num)) return null;
        
        if (min !== null && num < min) return min;
        if (max !== null && num > max) return max;
        
        return num;
    }

    // Validaciones mejoradas
    static validateStringLength(str, minLength = 1, maxLength = 255) {
        if (typeof str !== 'string') return false;
        const sanitized = this.sanitizeString(str);
        return sanitized.length >= minLength && sanitized.length <= maxLength;
    }

    static validateEmailFormat(email) {
        const sanitized = this.sanitizeEmail(email);
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        return emailRegex.test(sanitized);
    }

    static validatePasswordStrength(password) {
        if (typeof password !== 'string') return { valid: false, message: 'Contraseña inválida' };
        
        const errors = [];
        
        if (password.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/[A-Z]/.test(password)) errors.push('Una mayúscula');
        if (!/[a-z]/.test(password)) errors.push('Una minúscula');
        if (!/[0-9]/.test(password)) errors.push('Un número');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Un símbolo especial');
        if (/(..).*\1/.test(password)) errors.push('Sin caracteres repetidos');
        
        const strength = this.calculatePasswordStrength(password);
        
        return {
            valid: errors.length === 0 && strength >= 3,
            message: errors.length > 0 ? `Falta: ${errors.join(', ')}` : 'Contraseña segura',
            strength: strength,
            errors: errors
        };
    }

    static calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        if (password.length >= 12) score++;
        return Math.min(score, 5);
    }

    static validateScore(score) {
        const sanitized = this.sanitizeNumeric(score, 0, 5);
        return sanitized !== null && sanitized >= 0 && sanitized <= 5;
    }

    static validateRole(role) {
        const validRoles = ['student', 'teacher', 'admin'];
        const sanitized = this.sanitizeString(role).toLowerCase();
        return validRoles.includes(sanitized);
    }

    // Protección contra inyección
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Generación de tokens seguros
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Hash simple para contraseñas (en producción usar bcrypt)
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt_secreto_2024');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verificación de hash
    static async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }

    // Rate limiting simple (en memoria)
    static rateLimiter = new Map();
    
    static checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const key = identifier;
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }
        
        const record = this.rateLimiter.get(key);
        
        if (now > record.resetTime) {
            // Reset window
            this.rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
            return true;
        }
        
        if (record.count >= maxAttempts) {
            return false;
        }
        
        record.count++;
        return true;
    }

    // Validación de archivos
    static validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'application/vnd.ms-excel', 'text/csv']) {
        return allowedTypes.includes(file.type);
    }

    static validateFileSize(file, maxSizeMB = 5) {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }

    // Sanitización de datos de formulario
    static sanitizeFormData(formData) {
        const sanitized = {};
        
        for (const [key, value] of formData.entries()) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // Validación de entrada para prevenir ataques
    static validateInput(input, type = 'string', options = {}) {
        const { minLength = 1, maxLength = 255, min = null, max = null } = options;
        
        switch (type) {
            case 'string':
                return this.validateStringLength(input, minLength, maxLength);
            case 'email':
                return this.validateEmailFormat(input);
            case 'number':
                const num = this.sanitizeNumeric(input, min, max);
                return num !== null;
            case 'integer':
                const int = this.sanitizeInteger(input, min, max);
                return int !== null;
            case 'role':
                return this.validateRole(input);
            case 'score':
                return this.validateScore(input);
            default:
                return false;
        }
    }
}

// Exportar para uso global
window.SecurityUtils = SecurityUtils;