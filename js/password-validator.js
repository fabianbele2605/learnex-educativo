// Validador de contraseñas en tiempo real
class PasswordValidator {
    constructor(passwordInput, confirmInput = null) {
        this.passwordInput = passwordInput;
        this.confirmInput = confirmInput;
        this.init();
    }

    init() {
        this.createValidationUI();
        this.bindEvents();
    }

    createValidationUI() {
        const container = document.createElement('div');
        container.className = 'password-validation';
        container.innerHTML = `
            <div class="password-strength-bar">
                <div class="strength-indicator"></div>
            </div>
            <div class="password-requirements">
                <div class="requirement" data-rule="length">✗ Mínimo 8 caracteres</div>
                <div class="requirement" data-rule="uppercase">✗ Una mayúscula</div>
                <div class="requirement" data-rule="lowercase">✗ Una minúscula</div>
                <div class="requirement" data-rule="number">✗ Un número</div>
                <div class="requirement" data-rule="special">✗ Un símbolo especial</div>
            </div>
        `;
        
        this.passwordInput.parentNode.appendChild(container);
        this.validationContainer = container;
    }

    bindEvents() {
        this.passwordInput.addEventListener('input', () => this.validatePassword());
        if (this.confirmInput) {
            this.confirmInput.addEventListener('input', () => this.validateConfirmation());
        }
    }

    validatePassword() {
        const password = this.passwordInput.value;
        const validation = SecurityUtils.validatePasswordStrength(password);
        
        this.updateStrengthBar(validation.strength);
        this.updateRequirements(password);
        
        return validation.valid;
    }

    updateStrengthBar(strength) {
        const indicator = this.validationContainer.querySelector('.strength-indicator');
        const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#28a745'];
        const widths = [0, 20, 40, 60, 80, 100];
        
        indicator.style.width = `${widths[strength]}%`;
        indicator.style.backgroundColor = colors[strength - 1] || '#dc3545';
    }

    updateRequirements(password) {
        const rules = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        Object.keys(rules).forEach(rule => {
            const element = this.validationContainer.querySelector(`[data-rule="${rule}"]`);
            if (rules[rule]) {
                element.classList.add('met');
                element.textContent = element.textContent.replace('✗', '✓');
            } else {
                element.classList.remove('met');
                element.textContent = element.textContent.replace('✓', '✗');
            }
        });
    }

    validateConfirmation() {
        if (!this.confirmInput) return true;
        
        const password = this.passwordInput.value;
        const confirm = this.confirmInput.value;
        const match = password === confirm && password.length > 0;
        
        this.confirmInput.classList.toggle('field-error', !match && confirm.length > 0);
        this.confirmInput.classList.toggle('field-success', match);
        
        return match;
    }
}

window.PasswordValidator = PasswordValidator;