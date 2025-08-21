// Validador de formularios en tiempo real
class FormValidator {
    constructor(form) {
        this.form = form;
        this.rules = {};
        this.init();
    }

    init() {
        this.form.addEventListener('input', (e) => this.validateField(e.target));
        this.form.addEventListener('blur', (e) => this.validateField(e.target), true);
    }

    addRule(fieldName, validator, message) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = [];
        }
        this.rules[fieldName].push({ validator, message });
    }

    validateField(field) {
        const rules = this.rules[field.name];
        if (!rules) return true;

        this.clearFieldError(field);

        for (const rule of rules) {
            if (!rule.validator(field.value)) {
                this.showFieldError(field, rule.message);
                return false;
            }
        }

        this.showFieldSuccess(field);
        return true;
    }

    validateForm() {
        let isValid = true;
        const fields = this.form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('field-error');
        field.classList.remove('field-success');
        
        let errorElement = field.parentNode.querySelector('.field-error-message');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error-message';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    showFieldSuccess(field) {
        field.classList.add('field-success');
        field.classList.remove('field-error');
        this.clearFieldError(field);
    }

    clearFieldError(field) {
        field.classList.remove('field-error');
        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Validadores comunes
    static validators = {
        required: (value) => value.trim().length > 0,
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (min) => (value) => value.length >= min,
        maxLength: (max) => (value) => value.length <= max,
        numeric: (value) => /^\d+$/.test(value),
        alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value)
    };
}

window.FormValidator = FormValidator;