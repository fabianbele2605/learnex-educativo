/**
 * Datos de prueba para testing del dashboard
 * Incluye usuarios, materias, notas y otros datos necesarios
 */

class TestDataManager {
    constructor() {
        this.testUsers = [
            // Administrador
            {
                id: 'admin-001',
                name: 'Admin Principal',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'admin',
                created_at: new Date('2024-01-01').toISOString()
            },
            // Profesores
            {
                id: 'teacher-001',
                name: 'Prof. María García',
                email: 'maria.garcia@test.com',
                password: 'teacher123',
                role: 'teacher',
                created_at: new Date('2024-01-02').toISOString()
            },
            {
                id: 'teacher-002',
                name: 'Prof. Juan Pérez',
                email: 'juan.perez@test.com',
                password: 'teacher123',
                role: 'teacher',
                created_at: new Date('2024-01-03').toISOString()
            },
            // Estudiantes
            {
                id: 'student-001',
                name: 'Ana Rodríguez',
                email: 'ana.rodriguez@test.com',
                password: 'student123',
                role: 'student',
                created_at: new Date('2024-01-04').toISOString()
            },
            {
                id: 'student-002',
                name: 'Carlos López',
                email: 'carlos.lopez@test.com',
                password: 'student123',
                role: 'student',
                created_at: new Date('2024-01-05').toISOString()
            },
            {
                id: 'student-003',
                name: 'Laura Martínez',
                email: 'laura.martinez@test.com',
                password: 'student123',
                role: 'student',
                created_at: new Date('2024-01-06').toISOString()
            }
        ];

        this.testSubjects = [
            {
                id: 'subject-001',
                name: 'Matemáticas',
                description: 'Matemáticas básicas y avanzadas',
                teacher_id: 'teacher-001',
                created_at: new Date('2024-01-10').toISOString()
            },
            {
                id: 'subject-002',
                name: 'Historia',
                description: 'Historia universal y nacional',
                teacher_id: 'teacher-002',
                created_at: new Date('2024-01-11').toISOString()
            },
            {
                id: 'subject-003',
                name: 'Ciencias',
                description: 'Física, Química y Biología',
                teacher_id: 'teacher-001',
                created_at: new Date('2024-01-12').toISOString()
            },
            {
                id: 'subject-004',
                name: 'Literatura',
                description: 'Literatura clásica y contemporánea',
                teacher_id: 'teacher-002',
                created_at: new Date('2024-01-13').toISOString()
            }
        ];

        this.testGrades = [
            // Notas para Ana Rodríguez
            {
                id: 'grade-001',
                student_id: 'student-001',
                subject_id: 'subject-001',
                grade: 8.5,
                description: 'Examen parcial',
                date: new Date('2024-02-15').toISOString()
            },
            {
                id: 'grade-002',
                student_id: 'student-001',
                subject_id: 'subject-002',
                grade: 9.0,
                description: 'Ensayo histórico',
                date: new Date('2024-02-16').toISOString()
            },
            {
                id: 'grade-003',
                student_id: 'student-001',
                subject_id: 'subject-003',
                grade: 7.8,
                description: 'Laboratorio de química',
                date: new Date('2024-02-17').toISOString()
            },
            // Notas para Carlos López
            {
                id: 'grade-004',
                student_id: 'student-002',
                subject_id: 'subject-001',
                grade: 7.2,
                description: 'Examen parcial',
                date: new Date('2024-02-15').toISOString()
            },
            {
                id: 'grade-005',
                student_id: 'student-002',
                subject_id: 'subject-002',
                grade: 8.3,
                description: 'Ensayo histórico',
                date: new Date('2024-02-16').toISOString()
            },
            {
                id: 'grade-006',
                student_id: 'student-002',
                subject_id: 'subject-004',
                grade: 9.1,
                description: 'Análisis literario',
                date: new Date('2024-02-18').toISOString()
            },
            // Notas para Laura Martínez
            {
                id: 'grade-007',
                student_id: 'student-003',
                subject_id: 'subject-001',
                grade: 9.5,
                description: 'Examen parcial',
                date: new Date('2024-02-15').toISOString()
            },
            {
                id: 'grade-008',
                student_id: 'student-003',
                subject_id: 'subject-003',
                grade: 8.7,
                description: 'Laboratorio de química',
                date: new Date('2024-02-17').toISOString()
            },
            {
                id: 'grade-009',
                student_id: 'student-003',
                subject_id: 'subject-004',
                grade: 8.9,
                description: 'Análisis literario',
                date: new Date('2024-02-18').toISOString()
            }
        ];

        this.excelTestData = [
            ['Estudiante', 'Materia', 'Nota', 'Descripción', 'Fecha'],
            ['Ana Rodríguez', 'Matemáticas', '8.5', 'Examen final', '2024-03-01'],
            ['Carlos López', 'Matemáticas', '7.8', 'Examen final', '2024-03-01'],
            ['Laura Martínez', 'Matemáticas', '9.2', 'Examen final', '2024-03-01'],
            ['Ana Rodríguez', 'Historia', '9.3', 'Proyecto final', '2024-03-02'],
            ['Carlos López', 'Historia', '8.1', 'Proyecto final', '2024-03-02']
        ];
    }

    // Métodos para cargar datos de prueba
    async loadTestData() {
        try {
            // Cargar usuarios de prueba
            await this.loadTestUsers();
            
            // Cargar materias de prueba
            await this.loadTestSubjects();
            
            // Cargar notas de prueba
            await this.loadTestGrades();
            
            console.log('✅ Datos de prueba cargados exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error cargando datos de prueba:', error);
            return false;
        }
    }

    async loadTestUsers() {
        for (const user of this.testUsers) {
            try {
                await window.db.createUser(user);
            } catch (error) {
                // Usuario ya existe, continuar
                if (!error.message.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        }
    }

    async loadTestSubjects() {
        for (const subject of this.testSubjects) {
            try {
                await window.db.createSubject(subject);
            } catch (error) {
                // Materia ya existe, continuar
                if (!error.message.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        }
    }

    async loadTestGrades() {
        for (const grade of this.testGrades) {
            try {
                await window.db.createGrade(grade);
            } catch (error) {
                // Nota ya existe, continuar
                if (!error.message.includes('UNIQUE constraint failed')) {
                    throw error;
                }
            }
        }
    }

    // Métodos para limpiar datos de prueba
    async clearTestData() {
        try {
            // Limpiar en orden inverso por dependencias
            await this.clearTestGrades();
            await this.clearTestSubjects();
            await this.clearTestUsers();
            
            console.log('🧹 Datos de prueba limpiados exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error limpiando datos de prueba:', error);
            return false;
        }
    }

    async clearTestUsers() {
        for (const user of this.testUsers) {
            try {
                await window.db.deleteUser(user.id);
            } catch (error) {
                // Usuario no existe, continuar
                console.warn(`Usuario ${user.id} no encontrado para eliminar`);
            }
        }
    }

    async clearTestSubjects() {
        for (const subject of this.testSubjects) {
            try {
                await window.db.deleteSubject(subject.id);
            } catch (error) {
                // Materia no existe, continuar
                console.warn(`Materia ${subject.id} no encontrada para eliminar`);
            }
        }
    }

    async clearTestGrades() {
        for (const grade of this.testGrades) {
            try {
                await window.db.deleteGrade(grade.id);
            } catch (error) {
                // Nota no existe, continuar
                console.warn(`Nota ${grade.id} no encontrada para eliminar`);
            }
        }
    }

    // Métodos de utilidad para pruebas
    getUserByRole(role) {
        return this.testUsers.filter(user => user.role === role);
    }

    getUserById(id) {
        return this.testUsers.find(user => user.id === id);
    }

    getSubjectsByTeacher(teacherId) {
        return this.testSubjects.filter(subject => subject.teacher_id === teacherId);
    }

    getGradesByStudent(studentId) {
        return this.testGrades.filter(grade => grade.student_id === studentId);
    }

    getGradesBySubject(subjectId) {
        return this.testGrades.filter(grade => grade.subject_id === subjectId);
    }

    // Generar archivo Excel de prueba
    generateTestExcelFile() {
        const csvContent = this.excelTestData
            .map(row => row.join(','))
            .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas_prueba.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        return blob;
    }

    // Validar integridad de datos
    async validateTestData() {
        const results = {
            users: 0,
            subjects: 0,
            grades: 0,
            errors: []
        };

        try {
            // Validar usuarios
            const users = await window.db.getAllUsers();
            results.users = users.filter(user => 
                this.testUsers.some(testUser => testUser.id === user.id)
            ).length;

            // Validar materias
            const subjects = await window.db.getAllSubjects();
            results.subjects = subjects.filter(subject => 
                this.testSubjects.some(testSubject => testSubject.id === subject.id)
            ).length;

            // Validar notas
            const grades = await window.db.getAllGrades();
            results.grades = grades.filter(grade => 
                this.testGrades.some(testGrade => testGrade.id === grade.id)
            ).length;

        } catch (error) {
            results.errors.push(error.message);
        }

        return results;
    }
}

// Instancia global para uso en pruebas
window.testDataManager = new TestDataManager();

// Funciones de conveniencia para la consola
window.loadTestData = () => window.testDataManager.loadTestData();
window.clearTestData = () => window.testDataManager.clearTestData();
window.validateTestData = () => window.testDataManager.validateTestData();
window.generateTestExcel = () => window.testDataManager.generateTestExcelFile();

console.log('📊 Test Data Manager cargado. Funciones disponibles:');
console.log('- loadTestData(): Cargar datos de prueba');
console.log('- clearTestData(): Limpiar datos de prueba');
console.log('- validateTestData(): Validar integridad de datos');
console.log('- generateTestExcel(): Generar archivo Excel de prueba');