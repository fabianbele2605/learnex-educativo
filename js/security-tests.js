// Tests para SecurityUtils
function runSecurityTests() {
    const runner = new TestRunner();
    const { assert } = TestRunner;

    runner.test('SecurityUtils - Sanitización XSS', () => {
        const malicious = '<script>alert("xss")</script>Hello';
        const clean = SecurityUtils.sanitizeString(malicious);
        
        assert.falsy(clean.includes('<script>'), 'Scripts deben ser removidos');
        assert.truthy(clean.includes('Hello'), 'Contenido válido debe mantenerse');
    });

    runner.test('SecurityUtils - Validación de email', () => {
        assert.truthy(SecurityUtils.validateEmailFormat('test@example.com'), 'Email válido');
        assert.falsy(SecurityUtils.validateEmailFormat('invalid-email'), 'Email inválido');
        assert.falsy(SecurityUtils.validateEmailFormat('test@'), 'Email incompleto');
    });

    runner.test('SecurityUtils - Validación de contraseña', () => {
        const weak = SecurityUtils.validatePasswordStrength('123');
        const strong = SecurityUtils.validatePasswordStrength('Test123!@#');
        
        assert.falsy(weak.valid, 'Contraseña débil debe fallar');
        assert.truthy(strong.valid, 'Contraseña fuerte debe pasar');
        assert.equals(strong.strength, 5, 'Contraseña fuerte debe tener máxima puntuación');
    });

    runner.test('SecurityUtils - Hash de contraseña', async () => {
        const password = 'TestPassword123!';
        const hash1 = await SecurityUtils.hashPassword(password);
        const hash2 = await SecurityUtils.hashPassword(password);
        
        assert.equals(hash1, hash2, 'Mismo password debe generar mismo hash');
        assert.truthy(await SecurityUtils.verifyPassword(password, hash1), 'Verificación debe ser exitosa');
        assert.falsy(await SecurityUtils.verifyPassword('wrong', hash1), 'Password incorrecto debe fallar');
    });

    runner.test('SecurityUtils - Rate limiting', () => {
        const key = 'test-limit';
        
        // Primeros intentos deben pasar
        assert.truthy(SecurityUtils.checkRateLimit(key, 3, 1000), 'Primer intento debe pasar');
        assert.truthy(SecurityUtils.checkRateLimit(key, 3, 1000), 'Segundo intento debe pasar');
        assert.truthy(SecurityUtils.checkRateLimit(key, 3, 1000), 'Tercer intento debe pasar');
        
        // Cuarto intento debe fallar
        assert.falsy(SecurityUtils.checkRateLimit(key, 3, 1000), 'Cuarto intento debe fallar');
    });

    return runner.run();
}

window.runSecurityTests = runSecurityTests;