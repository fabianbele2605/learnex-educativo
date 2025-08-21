/**
 * Validación de formularios en tiempo real
 * Proporciona validación instantánea y mensajes de error mejorados
 */
class FormValidator {
    constructor() {
        this.validators = new Map();
        this.errorMessages = new Map();
        this.init();
    }

    init() {
        // Configurar validadores para diferentes tipos de campos
        this.setupValidators();
        this.attachEventListeners();
    }

    setupValidators() {
        // Validador para nombre completo
        this.validators.set('name', (value) => {
            const sanitized = SecurityUtils.sanitizeString(value);
            if (!Utils.validateStringLength(sanitized, 2, 100)) {
                return { valid: false, message: 'El nombre debe tener entre 2 y 100 caracteres' };
            }
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(sanitized)) {
                return { valid: false, message: 'El nombre solo puede contener letras y espacios' };
            }
            return { valid: true, message: '' };
        });

        // Validador para email
        this.validators.set('email', (value) => {
            const sanitized = SecurityUtils.sanitizeEmail(value);
            if (!Utils.validateEmail(sanitized)) {
                return { valid: false, message: 'Ingrese un email válido (ejemplo: usuario@dominio.com)' };
            }
            return { valid: true, message: '' };
        });

        // Validador para contraseña
        this.validators.set('password', (value) => {
            const result = Utils.validatePasswordWithMessage(value);
            // Mostrar indicadores de fortaleza para campos de contraseña
            const passwordField = document.querySelector('input[type="password"]:focus');
            if (passwordField && result.requirements) {
                setTimeout(() => Utils.showPasswordStrength(passwordField, result), 10);
            }
            return result;
        });

        // Validador para rol
        this.validators.set('role', (value) => {
            const sanitized = SecurityUtils.sanitizeString(value).toLowerCase();
            if (!Utils.validateRole(sanitized)) {
                return { valid: false, message: 'Seleccione un rol válido' };
            }
            return { valid: true, message: '' };
        });

        // Validador para notas
        this.validators.set('score', (value) => {
            const sanitized = SecurityUtils.sanitizeNumeric(value);
            if (!Utils.validateScore(sanitized)) {
                return { valid: false, message: 'La nota debe estar entre 0.0 y 5.0' };
            }
            return { valid: true, message: '' };
        });

        // Validador para período
        this.validators.set('period', (value) => {
            const sanitized = SecurityUtils.sanitizeString(value);
            if (!Utils.validateStringLength(sanitized, 1, 50)) {
                return { valid: false, message: 'El período debe tener entre 1 y 50 caracteres' };
            }
            return { valid: true, message: '' };
        });
    }

    attachEventListeners() {
        // Validación en tiempo real para formulario de registro
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            this.attachFormValidation(registerForm);
        }

        // Validación en tiempo real para formulario de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            this.attachFormValidation(loginForm);
        }

        // Validación para formularios dinámicos (se añadirán después)
        document.addEventListener('DOMContentLoaded', () => {
            this.attachDynamicFormValidation();
        });
    }

    attachFormValidation(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Validación en tiempo real (mientras escribe)
            input.addEventListener('input', (e) => {
                this.validateField(e.target);
            });

            // Validación al perder el foco
            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });

            // Limpiar errores al enfocar
            input.addEventListener('focus', (e) => {
                this.clearFieldError(e.target);
            });
        });

        // Validación completa al enviar
        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
            }
        });
    }

    attachDynamicFormValidation() {
        // Observer para formularios que se añaden dinámicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const forms = node.querySelectorAll ? node.querySelectorAll('form') : [];
                        forms.forEach(form => {
                            if (!form.hasAttribute('data-validated')) {
                                this.attachFormValidation(form);
                                form.setAttribute('data-validated', 'true');
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    validateField(field) {
        const fieldName = this.getFieldValidatorName(field);
        const validator = this.validators.get(fieldName);
        
        if (!validator) return true;

        const result = validator(field.value);
        
        if (result.valid) {
            this.showFieldSuccess(field);
            return true;
        } else {
            this.showFieldError(field, result.message);
            return false;
        }
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    getFieldValidatorName(field) {
        // Mapear nombres de campos a validadores
        const fieldMappings = {
            'name': 'name',
            'reg-name': 'name',
            'email': 'email',
            'reg-email': 'email',
            'password': 'password',
            'reg-password': 'password',
            'role': 'role',
            'reg-role': 'role',
            'score': 'score',
            'period': 'period'
        };

        return fieldMappings[field.id] || fieldMappings[field.name] || field.type;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        // Añadir clase de error al campo
        field.classList.add('field-error');
        
        // Crear elemento de mensaje de error
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('data-field', field.id || field.name);
        
        // Insertar mensaje después del campo
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    showFieldSuccess(field) {
        this.clearFieldError(field);
        field.classList.add('field-success');
        field.classList.remove('field-error');
    }

    clearFieldError(field) {
        // Remover clases de estado
        field.classList.remove('field-error', 'field-success');
        
        // Remover mensaje de error existente
        const existingError = field.parentNode.querySelector(
            `[data-field="${field.id || field.name}"]`
        );
        if (existingError) {
            existingError.remove();
        }
    }

    // Método público para validar campos específicos
    validateSpecificField(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            return this.validateField(field);
        }
        return false;
    }

    // Método para limpiar todos los errores de un formulario
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => this.clearFieldError(input));
        }
    }
}

// Inicializar validador cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.formValidator) {
            window.formValidator = new FormValidator();
        }
    });
} else {
    if (!window.formValidator) {
        window.formValidator = new FormValidator();
    }
}