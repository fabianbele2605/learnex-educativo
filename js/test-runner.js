// Sistema de testing simple
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, total: 0 };
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async run() {
        console.log('🧪 Ejecutando tests...');
        this.results = { passed: 0, failed: 0, total: 0 };

        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ ${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.error(`❌ ${test.name}: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }

        this.showResults();
    }

    showResults() {
        const { passed, failed, total } = this.results;
        console.log(`\n📊 Resultados: ${passed}/${total} tests pasaron`);
        if (failed > 0) {
            console.log(`❌ ${failed} tests fallaron`);
        }
    }

    // Assertions básicas
    static assert = {
        equals: (actual, expected, message = '') => {
            if (actual !== expected) {
                throw new Error(`${message} - Esperado: ${expected}, Actual: ${actual}`);
            }
        },
        
        truthy: (value, message = '') => {
            if (!value) {
                throw new Error(`${message} - Esperado valor truthy, recibido: ${value}`);
            }
        },
        
        falsy: (value, message = '') => {
            if (value) {
                throw new Error(`${message} - Esperado valor falsy, recibido: ${value}`);
            }
        },
        
        throws: async (fn, message = '') => {
            try {
                await fn();
                throw new Error(`${message} - Se esperaba que la función lance un error`);
            } catch (error) {
                // Error esperado
            }
        }
    };
}

window.TestRunner = TestRunner;