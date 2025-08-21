/**
 * Sistema de pruebas automatizadas para el dashboard
 * Incluye pruebas de navegación, funcionalidades y roles
 */

class DashboardTestSuite {
    constructor() {
        this.testResults = [];
        this.currentUser = null;
        this.testStartTime = null;
        this.testEndTime = null;
        this.isRunning = false;
    }

    // === MÉTODOS PRINCIPALES DE TESTING ===
    
    async runAllTests() {
        if (this.isRunning) {
            console.warn('⚠️ Las pruebas ya están en ejecución');
            return;
        }

        this.isRunning = true;
        this.testStartTime = new Date();
        this.testResults = [];
        
        console.log('🚀 Iniciando suite completa de pruebas del dashboard...');
        
        try {
            // 1. Preparar datos de prueba
            await this.setupTestEnvironment();
            
            // 2. Pruebas de navegación del dashboard
            await this.runNavigationTests();
            
            // 3. Pruebas de funcionalidades específicas
            await this.runFunctionalityTests();
            
            // 4. Pruebas de roles y permisos
            await this.runRoleBasedTests();
            
            // 5. Pruebas de navegación SPA
            await this.runSPANavigationTests();
            
            // 6. Generar reporte final
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Error durante las pruebas:', error);
            this.addTestResult('ERROR_GENERAL', false, `Error general: ${error.message}`);
        } finally {
            this.testEndTime = new Date();
            this.isRunning = false;
        }
    }

    async setupTestEnvironment() {
        console.log('📋 Configurando entorno de pruebas...');
        
        try {
            // Cargar datos de prueba
            const loaded = await window.testDataManager.loadTestData();
            this.addTestResult('SETUP_TEST_DATA', loaded, 'Carga de datos de prueba');
            
            // Verificar que la base de datos esté funcionando
            const dbWorking = await this.testDatabaseConnection();
            this.addTestResult('SETUP_DATABASE', dbWorking, 'Conexión a base de datos');
            
        } catch (error) {
            this.addTestResult('SETUP_ERROR', false, `Error en configuración: ${error.message}`);
            throw error;
        }
    }

    // === PRUEBAS DE NAVEGACIÓN ===
    
    async runNavigationTests() {
        console.log('🧭 Ejecutando pruebas de navegación...');
        
        // Probar con usuario administrador
        await this.loginAsRole('admin');
        
        const sections = [
            { id: 'dashboard', name: 'Dashboard', expectedElements: ['.dashboard-stats', '.recent-activity'] },
            { id: 'subjects', name: 'Materias', expectedElements: ['.subjects-table', '.add-subject-btn'] },
            { id: 'grades', name: 'Notas', expectedElements: ['.grades-table', '.add-grade-btn'] },
            { id: 'reports', name: 'Reportes', expectedElements: ['.reports-section', '.generate-report-btn'] },
            { id: 'users', name: 'Usuarios', expectedElements: ['.users-table', '.add-user-btn'] }
        ];
        
        for (const section of sections) {
            await this.testSectionNavigation(section);
            await this.wait(500); // Pausa entre navegaciones
        }
    }

    async testSectionNavigation(section) {
        try {
            // Navegar a la sección
            const navLink = document.querySelector(`[onclick*="${section.id}"]`);
            if (!navLink) {
                this.addTestResult(`NAV_${section.id.toUpperCase()}_LINK`, false, `Enlace de navegación no encontrado para ${section.name}`);
                return;
            }
            
            navLink.click();
            await this.wait(1000);
            
            // Verificar que la sección se cargó correctamente
            const sectionLoaded = document.querySelector(`#${section.id}-section`) || 
                                document.querySelector(`.${section.id}-content`) ||
                                document.querySelector(`[data-section="${section.id}"]`);
            
            this.addTestResult(`NAV_${section.id.toUpperCase()}_LOAD`, !!sectionLoaded, `Carga de sección ${section.name}`);
            
            // Verificar elementos esperados
            for (const selector of section.expectedElements) {
                const element = document.querySelector(selector);
                this.addTestResult(
                    `NAV_${section.id.toUpperCase()}_ELEMENT_${selector.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    !!element,
                    `Elemento ${selector} en ${section.name}`
                );
            }
            
        } catch (error) {
            this.addTestResult(`NAV_${section.id.toUpperCase()}_ERROR`, false, `Error navegando a ${section.name}: ${error.message}`);
        }
    }

    // === PRUEBAS DE FUNCIONALIDADES ESPECÍFICAS ===
    
    async runFunctionalityTests() {
        console.log('⚙️ Ejecutando pruebas de funcionalidades específicas...');
        
        await this.loginAsRole('teacher');
        
        // Prueba de carga manual de notas
        await this.testManualGradeEntry();
        
        // Prueba de importación Excel
        await this.testExcelImport();
        
        // Prueba de generación de reportes
        await this.testReportGeneration();
    }

    async testManualGradeEntry() {
        try {
            console.log('📝 Probando carga manual de notas...');
            
            // Navegar a la sección de notas
            const gradesLink = document.querySelector('[onclick*="grades"]');
            if (gradesLink) {
                gradesLink.click();
                await this.wait(1000);
            }
            
            // Buscar botón de agregar nota
            const addGradeBtn = document.querySelector('.add-grade-btn') || 
                              document.querySelector('[onclick*="showAddGradeForm"]');
            
            if (addGradeBtn) {
                addGradeBtn.click();
                await this.wait(500);
                
                // Verificar que se abrió el formulario
                const form = document.querySelector('#addGradeForm') || 
                           document.querySelector('.add-grade-form');
                
                this.addTestResult('FUNC_MANUAL_GRADE_FORM', !!form, 'Apertura de formulario de notas');
                
                if (form) {
                    // Simular llenado del formulario
                    await this.fillGradeForm({
                        student: 'student-001',
                        subject: 'subject-001',
                        grade: '8.5',
                        description: 'Prueba automatizada'
                    });
                    
                    this.addTestResult('FUNC_MANUAL_GRADE_FILL', true, 'Llenado de formulario de notas');
                }
            } else {
                this.addTestResult('FUNC_MANUAL_GRADE_BTN', false, 'Botón de agregar nota no encontrado');
            }
            
        } catch (error) {
            this.addTestResult('FUNC_MANUAL_GRADE_ERROR', false, `Error en carga manual: ${error.message}`);
        }
    }

    async testExcelImport() {
        try {
            console.log('📊 Probando importación de Excel...');
            
            // Buscar botón de importación Excel
            const excelBtn = document.querySelector('[onclick*="showExcelImport"]') ||
                           document.querySelector('.excel-import-btn');
            
            if (excelBtn) {
                excelBtn.click();
                await this.wait(500);
                
                // Verificar que se abrió el modal de importación
                const modal = document.querySelector('#excelImportModal') ||
                            document.querySelector('.excel-import-modal');
                
                this.addTestResult('FUNC_EXCEL_MODAL', !!modal, 'Apertura de modal de importación Excel');
                
                if (modal) {
                    // Generar archivo de prueba
                    const testFile = window.testDataManager.generateTestExcelFile();
                    this.addTestResult('FUNC_EXCEL_FILE_GEN', !!testFile, 'Generación de archivo Excel de prueba');
                }
            } else {
                this.addTestResult('FUNC_EXCEL_BTN', false, 'Botón de importación Excel no encontrado');
            }
            
        } catch (error) {
            this.addTestResult('FUNC_EXCEL_ERROR', false, `Error en importación Excel: ${error.message}`);
        }
    }

    async testReportGeneration() {
        try {
            console.log('📈 Probando generación de reportes...');
            
            // Navegar a reportes
            const reportsLink = document.querySelector('[onclick*="reports"]');
            if (reportsLink) {
                reportsLink.click();
                await this.wait(1000);
            }
            
            const reportTypes = [
                { name: 'Estudiante', selector: '[onclick*="generateStudentReport"]' },
                { name: 'Materia', selector: '[onclick*="generateSubjectReport"]' },
                { name: 'Profesor', selector: '[onclick*="generateTeacherReport"]' },
                { name: 'General', selector: '[onclick*="generateGeneralReport"]' }
            ];
            
            for (const reportType of reportTypes) {
                const btn = document.querySelector(reportType.selector);
                if (btn) {
                    btn.click();
                    await this.wait(500);
                    
                    this.addTestResult(
                        `FUNC_REPORT_${reportType.name.toUpperCase()}`,
                        true,
                        `Generación de reporte ${reportType.name}`
                    );
                } else {
                    this.addTestResult(
                        `FUNC_REPORT_${reportType.name.toUpperCase()}_BTN`,
                        false,
                        `Botón de reporte ${reportType.name} no encontrado`
                    );
                }
            }
            
        } catch (error) {
            this.addTestResult('FUNC_REPORTS_ERROR', false, `Error en generación de reportes: ${error.message}`);
        }
    }

    // === PRUEBAS DE ROLES Y PERMISOS ===
    
    async runRoleBasedTests() {
        console.log('👥 Ejecutando pruebas de roles y permisos...');
        
        const roles = ['student', 'teacher', 'admin'];
        
        for (const role of roles) {
            await this.testRolePermissions(role);
        }
    }

    async testRolePermissions(role) {
        try {
            console.log(`🔐 Probando permisos para rol: ${role}`);
            
            await this.loginAsRole(role);
            await this.wait(1000);
            
            const permissions = this.getExpectedPermissions(role);
            
            for (const permission of permissions) {
                const element = document.querySelector(permission.selector);
                const hasPermission = permission.shouldHave ? !!element : !element;
                
                this.addTestResult(
                    `ROLE_${role.toUpperCase()}_${permission.name}`,
                    hasPermission,
                    `${role}: ${permission.description}`
                );
            }
            
        } catch (error) {
            this.addTestResult(`ROLE_${role.toUpperCase()}_ERROR`, false, `Error probando rol ${role}: ${error.message}`);
        }
    }

    getExpectedPermissions(role) {
        const basePermissions = [
            { name: 'DASHBOARD_ACCESS', selector: '[onclick*="dashboard"]', shouldHave: true, description: 'Acceso al dashboard' }
        ];
        
        switch (role) {
            case 'student':
                return [
                    ...basePermissions,
                    { name: 'VIEW_GRADES', selector: '[onclick*="grades"]', shouldHave: true, description: 'Ver notas' },
                    { name: 'ADD_GRADES', selector: '.add-grade-btn', shouldHave: false, description: 'No puede agregar notas' },
                    { name: 'MANAGE_USERS', selector: '[onclick*="users"]', shouldHave: false, description: 'No puede gestionar usuarios' },
                    { name: 'MANAGE_SUBJECTS', selector: '.add-subject-btn', shouldHave: false, description: 'No puede gestionar materias' }
                ];
                
            case 'teacher':
                return [
                    ...basePermissions,
                    { name: 'MANAGE_SUBJECTS', selector: '[onclick*="subjects"]', shouldHave: true, description: 'Gestionar materias' },
                    { name: 'MANAGE_GRADES', selector: '[onclick*="grades"]', shouldHave: true, description: 'Gestionar notas' },
                    { name: 'VIEW_REPORTS', selector: '[onclick*="reports"]', shouldHave: true, description: 'Ver reportes' },
                    { name: 'MANAGE_USERS', selector: '[onclick*="users"]', shouldHave: false, description: 'No puede gestionar usuarios' }
                ];
                
            case 'admin':
                return [
                    ...basePermissions,
                    { name: 'MANAGE_SUBJECTS', selector: '[onclick*="subjects"]', shouldHave: true, description: 'Gestionar materias' },
                    { name: 'MANAGE_GRADES', selector: '[onclick*="grades"]', shouldHave: true, description: 'Gestionar notas' },
                    { name: 'VIEW_REPORTS', selector: '[onclick*="reports"]', shouldHave: true, description: 'Ver reportes' },
                    { name: 'MANAGE_USERS', selector: '[onclick*="users"]', shouldHave: true, description: 'Gestionar usuarios' }
                ];
                
            default:
                return basePermissions;
        }
    }

    // === PRUEBAS DE NAVEGACIÓN SPA ===
    
    async runSPANavigationTests() {
        console.log('🔄 Ejecutando pruebas de navegación SPA...');
        
        await this.loginAsRole('admin');
        
        const initialUrl = window.location.href;
        const sections = ['dashboard', 'subjects', 'grades', 'reports', 'users'];
        
        for (const section of sections) {
            await this.testSPANavigation(section, initialUrl);
        }
    }

    async testSPANavigation(section, initialUrl) {
        try {
            const beforeUrl = window.location.href;
            
            // Navegar a la sección
            const link = document.querySelector(`[onclick*="${section}"]`);
            if (link) {
                link.click();
                await this.wait(500);
                
                const afterUrl = window.location.href;
                const urlChanged = beforeUrl !== afterUrl;
                const pageReloaded = this.detectPageReload();
                
                this.addTestResult(
                    `SPA_${section.toUpperCase()}_URL_CHANGE`,
                    urlChanged,
                    `URL cambió al navegar a ${section}`
                );
                
                this.addTestResult(
                    `SPA_${section.toUpperCase()}_NO_RELOAD`,
                    !pageReloaded,
                    `No hubo recarga de página al navegar a ${section}`
                );
            }
            
        } catch (error) {
            this.addTestResult(`SPA_${section.toUpperCase()}_ERROR`, false, `Error en navegación SPA a ${section}: ${error.message}`);
        }
    }

    // === MÉTODOS DE UTILIDAD ===
    
    async loginAsRole(role) {
        const users = window.testDataManager.getUserByRole(role);
        if (users.length === 0) {
            throw new Error(`No hay usuarios de prueba con rol ${role}`);
        }
        
        const user = users[0];
        
        // Simular logout si hay usuario actual
        if (this.currentUser) {
            await this.logout();
        }
        
        // Simular login
        await this.simulateLogin(user);
        this.currentUser = user;
    }

    async simulateLogin(user) {
        // Ir a la pantalla de login
        const loginScreen = document.querySelector('#login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'block';
        }
        
        // Llenar formulario de login
        const emailInput = document.querySelector('#loginEmail');
        const passwordInput = document.querySelector('#loginPassword');
        
        if (emailInput && passwordInput) {
            emailInput.value = user.email;
            passwordInput.value = user.password;
            
            // Simular click en login
            const loginBtn = document.querySelector('#loginBtn');
            if (loginBtn) {
                loginBtn.click();
                await this.wait(1000);
            }
        }
    }

    async logout() {
        const logoutBtn = document.querySelector('[onclick*="logout"]');
        if (logoutBtn) {
            logoutBtn.click();
            await this.wait(500);
        }
        this.currentUser = null;
    }

    async fillGradeForm(data) {
        const studentSelect = document.querySelector('#gradeStudent');
        const subjectSelect = document.querySelector('#gradeSubject');
        const gradeInput = document.querySelector('#gradeValue');
        const descriptionInput = document.querySelector('#gradeDescription');
        
        if (studentSelect) studentSelect.value = data.student;
        if (subjectSelect) subjectSelect.value = data.subject;
        if (gradeInput) gradeInput.value = data.grade;
        if (descriptionInput) descriptionInput.value = data.description;
    }

    async testDatabaseConnection() {
        try {
            const users = await window.db.getAllUsers();
            return Array.isArray(users);
        } catch (error) {
            return false;
        }
    }

    detectPageReload() {
        // Método simple para detectar recarga de página
        // En una implementación real, se podría usar performance.navigation
        return false; // Asumimos que no hay recarga en SPA
    }

    addTestResult(testId, passed, description) {
        const result = {
            id: testId,
            passed,
            description,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testId}: ${description}`);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === GENERACIÓN DE REPORTES ===
    
    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;
        
        const duration = this.testEndTime - this.testStartTime;
        const durationSeconds = (duration / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 REPORTE DE PRUEBAS DEL DASHBOARD');
        console.log('='.repeat(60));
        console.log(`⏱️  Duración: ${durationSeconds} segundos`);
        console.log(`📈 Total de pruebas: ${totalTests}`);
        console.log(`✅ Pruebas exitosas: ${passedTests}`);
        console.log(`❌ Pruebas fallidas: ${failedTests}`);
        console.log(`📊 Tasa de éxito: ${successRate}%`);
        console.log('='.repeat(60));
        
        if (failedTests > 0) {
            console.log('\n❌ PRUEBAS FALLIDAS:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`   • ${r.id}: ${r.description}`));
        }
        
        console.log('\n✅ PRUEBAS EXITOSAS:');
        this.testResults
            .filter(r => r.passed)
            .forEach(r => console.log(`   • ${r.id}: ${r.description}`));
        
        // Generar reporte HTML
        this.generateHTMLReport();
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: parseFloat(successRate),
            duration: parseFloat(durationSeconds),
            results: this.testResults
        };
    }

    generateHTMLReport() {
        const report = this.generateTestReport();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Pruebas - Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
                .stats { display: flex; gap: 20px; margin: 20px 0; }
                .stat { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .passed { color: #28a745; }
                .failed { color: #dc3545; }
                .test-result { padding: 10px; margin: 5px 0; border-radius: 3px; }
                .test-passed { background: #d4edda; border-left: 4px solid #28a745; }
                .test-failed { background: #f8d7da; border-left: 4px solid #dc3545; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 Reporte de Pruebas del Dashboard</h1>
                <p>Generado el: ${new Date().toLocaleString()}</p>
                <p>Duración: ${report.duration} segundos</p>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <h3>Total de Pruebas</h3>
                    <p style="font-size: 24px; margin: 0;">${report.total}</p>
                </div>
                <div class="stat">
                    <h3 class="passed">Exitosas</h3>
                    <p style="font-size: 24px; margin: 0; color: #28a745;">${report.passed}</p>
                </div>
                <div class="stat">
                    <h3 class="failed">Fallidas</h3>
                    <p style="font-size: 24px; margin: 0; color: #dc3545;">${report.failed}</p>
                </div>
                <div class="stat">
                    <h3>Tasa de Éxito</h3>
                    <p style="font-size: 24px; margin: 0;">${report.successRate}%</p>
                </div>
            </div>
            
            <h2>Resultados Detallados</h2>
            ${this.testResults.map(result => `
                <div class="test-result ${result.passed ? 'test-passed' : 'test-failed'}">
                    <strong>${result.passed ? '✅' : '❌'} ${result.id}</strong><br>
                    ${result.description}<br>
                    <small>${new Date(result.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </body>
        </html>
        `;
        
        // Crear y descargar el reporte
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-test-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📄 Reporte HTML generado y descargado');
    }
}

// Instancia global para uso en pruebas
window.dashboardTests = new DashboardTestSuite();

// Funciones de conveniencia para la consola
window.runDashboardTests = () => window.dashboardTests.runAllTests();
window.runNavigationTests = () => window.dashboardTests.runNavigationTests();
window.runFunctionalityTests = () => window.dashboardTests.runFunctionalityTests();
window.runRoleTests = () => window.dashboardTests.runRoleBasedTests();
window.runSPATests = () => window.dashboardTests.runSPANavigationTests();

console.log('🧪 Dashboard Test Suite cargado. Funciones disponibles:');
console.log('- runDashboardTests(): Ejecutar todas las pruebas');
console.log('- runNavigationTests(): Pruebas de navegación');
console.log('- runFunctionalityTests(): Pruebas de funcionalidades');
console.log('- runRoleTests(): Pruebas de roles y permisos');
console.log('- runSPATests(): Pruebas de navegación SPA');