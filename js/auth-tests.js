// Tests para AuthManager
function runAuthTests() {
    const runner = new TestRunner();
    const { assert } = TestRunner;

    runner.test('AuthManager - Login válido', async () => {
        const auth = new AuthManager();
        
        // Crear usuario de prueba
        await window.dbAdapter.saveUser({
            id: 999,
            email: 'test@test.com',
            password: await SecurityUtils.hashPassword('Test123!'),
            name: 'Test User',
            role: 'student'
        });

        const user = await auth.login('test@test.com', 'Test123!');
        assert.equals(user.email, 'test@test.com', 'Email debe coincidir');
        assert.truthy(auth.isAuthenticated(), 'Usuario debe estar autenticado');
    });

    runner.test('AuthManager - Login inválido', async () => {
        const auth = new AuthManager();
        
        await assert.throws(
            () => auth.login('invalid@test.com', 'wrongpass'),
            'Login con credenciales inválidas debe fallar'
        );
    });

    runner.test('AuthManager - Registro válido', async () => {
        const auth = new AuthManager();
        
        const userData = {
            name: 'New User',
            email: 'new@test.com',
            password: 'NewPass123!',
            role: 'student'
        };

        const user = await auth.register(userData);
        assert.equals(user.email, 'new@test.com', 'Email debe coincidir');
    });

    runner.test('AuthManager - Validación de permisos', () => {
        const auth = new AuthManager();
        auth.currentUser = { role: 'admin' };
        
        assert.truthy(auth.hasPermission('manage_users'), 'Admin debe tener permisos de gestión');
        
        auth.currentUser = { role: 'student' };
        assert.falsy(auth.hasPermission('manage_users'), 'Student no debe tener permisos de gestión');
    });

    return runner.run();
}

window.runAuthTests = runAuthTests;