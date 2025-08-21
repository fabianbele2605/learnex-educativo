/**
 * Script de pruebas rápidas para el dashboard
 * Se puede ejecutar directamente desde la consola del navegador
 */

// Función para ejecutar pruebas básicas del dashboard
window.runQuickTests = async function() {
    console.log('🚀 Iniciando pruebas rápidas del dashboard...');
    
    try {
        // 1. Verificar que los componentes principales estén cargados
        console.log('\n📋 1. Verificando componentes principales...');
        
        const components = {
            'testDataManager': window.testDataManager,
            'dashboardTests': window.dashboardTests,
            'testPanel': window.testPanel,
            'sessionManager': window.sessionManager,
            'app': window.app
        };
        
        for (const [name, component] of Object.entries(components)) {
            if (component) {
                console.log(`✅ ${name} - Cargado correctamente`);
            } else {
                console.log(`❌ ${name} - No encontrado`);
            }
        }
        
        // 2. Cargar datos de prueba
        console.log('\n📊 2. Cargando datos de prueba...');
        if (window.testDataManager) {
            const result = await window.testDataManager.loadTestData();
            if (result) {
                console.log('✅ Datos de prueba cargados exitosamente');
                
                // Validar datos
                const validation = await window.testDataManager.validateTestData();
                console.log(`📈 Usuarios: ${validation.users}, Materias: ${validation.subjects}, Notas: ${validation.grades}`);
            } else {
                console.log('❌ Error cargando datos de prueba');
            }
        }
        
        // 3. Probar login con diferentes roles
        console.log('\n👤 3. Probando login con diferentes roles...');
        
        const testUsers = [
            { email: 'admin@test.com', password: 'admin123', role: 'admin' },
            { email: 'profesor@test.com', password: 'profesor123', role: 'teacher' },
            { email: 'estudiante@test.com', password: 'estudiante123', role: 'student' }
        ];
        
        for (const user of testUsers) {
            try {
                // Simular login
                const loginResult = await window.sessionManager.login(user.email, user.password);
                if (loginResult.success) {
                    console.log(`✅ Login exitoso para ${user.role}: ${user.email}`);
                    
                    // Verificar sesión
                    const currentUser = window.sessionManager.getCurrentUser();
                    if (currentUser && currentUser.role === user.role) {
                        console.log(`✅ Rol verificado: ${currentUser.role}`);
                    }
                    
                    // Logout
                    window.sessionManager.logout();
                } else {
                    console.log(`❌ Error en login para ${user.role}: ${loginResult.message}`);
                }
            } catch (error) {
                console.log(`❌ Excepción en login para ${user.role}: ${error.message}`);
            }
        }
        
        // 4. Probar navegación del dashboard
        console.log('\n🧭 4. Probando navegación del dashboard...');
        
        // Login como admin para las pruebas
        const adminLogin = await window.sessionManager.login('admin@test.com', 'admin123');
        if (adminLogin.success) {
            console.log('✅ Logueado como admin para pruebas de navegación');
            
            // Mostrar dashboard
            if (window.app && window.app.showDashboard) {
                window.app.showDashboard();
                console.log('✅ Dashboard mostrado');
                
                // Probar navegación a diferentes secciones
                const sections = ['dashboard', 'materias', 'notas', 'reportes', 'usuarios'];
                
                for (const section of sections) {
                    try {
                        if (window.app.navigateToSection) {
                            await window.app.navigateToSection(section);
                            console.log(`✅ Navegación a ${section} exitosa`);
                            await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms
                        } else {
                            console.log(`⚠️ Función navigateToSection no disponible`);
                        }
                    } catch (error) {
                        console.log(`❌ Error navegando a ${section}: ${error.message}`);
                    }
                }
            } else {
                console.log('❌ Función showDashboard no disponible');
            }
        }
        
        // 5. Probar funcionalidades específicas
        console.log('\n⚙️ 5. Probando funcionalidades específicas...');
        
        // Probar carga de notas
        if (window.app && window.app.loadGrades) {
            try {
                await window.app.loadGrades();
                console.log('✅ Carga de notas exitosa');
            } catch (error) {
                console.log(`❌ Error cargando notas: ${error.message}`);
            }
        }
        
        // Probar generación de reportes
        if (window.app && window.app.generateReport) {
            try {
                const report = await window.app.generateReport('general');
                console.log('✅ Generación de reporte exitosa');
            } catch (error) {
                console.log(`❌ Error generando reporte: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Pruebas rápidas completadas!');
        console.log('💡 Para abrir el panel de control visual, usa: showTestPanel()');
        console.log('💡 O presiona Ctrl+Shift+T');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    }
};

// Función para mostrar el estado actual del sistema
window.showSystemStatus = function() {
    console.log('🔍 Estado actual del sistema:');
    console.log('================================');
    
    // Verificar autenticación
    if (window.sessionManager) {
        const isAuth = window.sessionManager.isAuthenticated();
        const currentUser = window.sessionManager.getCurrentUser();
        console.log(`👤 Autenticado: ${isAuth}`);
        if (currentUser) {
            console.log(`👤 Usuario actual: ${currentUser.name} (${currentUser.role})`);
        }
    }
    
    // Verificar pantalla actual
    const screens = ['login-screen', 'register-screen', 'dashboard-screen'];
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen && !screen.classList.contains('hidden')) {
            console.log(`📺 Pantalla activa: ${screenId}`);
        }
    });
    
    // Verificar datos en localStorage
    const keys = ['currentUser', 'sessionToken', 'testData'];
    keys.forEach(key => {
        const data = localStorage.getItem(key);
        console.log(`💾 ${key}: ${data ? 'Presente' : 'Ausente'}`);
    });
    
    console.log('================================');
};

// Función para limpiar y reiniciar el sistema
window.resetSystem = function() {
    console.log('🔄 Reiniciando sistema...');
    
    // Logout si está autenticado
    if (window.sessionManager && window.sessionManager.isAuthenticated()) {
        window.sessionManager.logout();
    }
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Limpiar datos de prueba
    if (window.testDataManager) {
        window.testDataManager.clearTestData();
    }
    
    // Mostrar pantalla de login
    if (window.app && window.app.showLogin) {
        window.app.showLogin();
    }
    
    console.log('✅ Sistema reiniciado');
};

// Función para probar el panel de control
window.testControlPanel = function() {
    console.log('🎛️ Probando panel de control...');
    
    if (window.testPanel) {
        console.log('✅ Panel de control disponible');
        console.log('💡 Mostrando panel...');
        window.testPanel.show();
        
        setTimeout(() => {
            console.log('💡 Panel mostrado. Puedes interactuar con él.');
            console.log('💡 Para ocultarlo: hideTestPanel()');
        }, 1000);
    } else {
        console.log('❌ Panel de control no disponible');
    }
};

console.log('🧪 Script de pruebas rápidas cargado');
console.log('💡 Funciones disponibles:');
console.log('- runQuickTests(): Ejecutar pruebas rápidas');
console.log('- showSystemStatus(): Mostrar estado del sistema');
console.log('- resetSystem(): Reiniciar sistema');
console.log('- testControlPanel(): Probar panel de control');
console.log('- showTestPanel(): Mostrar panel de control visual');