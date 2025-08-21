// Simulador de base de datos usando localStorage
class Database {
    constructor() {
        this.tables = {
            users: 'users',
            subjects: 'subjects',
            grades: 'grades',
            enrollments: 'enrollments'
        };
        this.adapter = window.dbAdapter;
        this.initSampleData();
    }

    async initSampleData() {
        // Esperar a que el adaptador esté listo
        await this.waitForAdapter();
        
        // Solo inicializar si no hay datos
        const users = await this.adapter.getUsers();
        if (users.length === 0) {
            await this.loadSampleData();
        }
    }

    async waitForAdapter() {
        // Esperar hasta que el adaptador esté inicializado
        let attempts = 0;
        while (!this.adapter && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.adapter = window.dbAdapter;
            attempts++;
        }
        
        if (!this.adapter) {
            throw new Error('Database adapter no disponible');
        }
    }

    async loadSampleData() {
        try {
            // Usuarios de ejemplo con contraseñas hasheadas
            const users = [
                {
                    id: 1,
                    email: 'admin@codeup.com',
                    password: await SecurityUtils.hashPassword('Admin123!'),
                    full_name: 'Administrador',
                    name: 'Administrador', // Compatibilidad
                    role: 'admin',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    email: 'teacher@codeup.com',
                    password: await SecurityUtils.hashPassword('Teacher123!'),
                    full_name: 'María García',
                    name: 'María García', // Compatibilidad
                    role: 'teacher',
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    email: 'student@codeup.com',
                    password: await SecurityUtils.hashPassword('Student123!'),
                    full_name: 'Juan Pérez',
                    name: 'Juan Pérez', // Compatibilidad
                    role: 'student',
                    created_at: new Date().toISOString()
                }
            ];

            // Materias de ejemplo
            const subjects = [
                {
                    id: 1,
                    name: 'Matemáticas',
                    area: 'Ciencias Exactas',
                    teacherId: 2,
                    teacher_id: 2, // Compatibilidad
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Programación',
                    area: 'Tecnología',
                    teacherId: 2,
                    teacher_id: 2, // Compatibilidad
                    created_at: new Date().toISOString()
                }
            ];

            // Notas de ejemplo
            const grades = [
                {
                    id: 1,
                    student_id: 3,
                    subject_id: 1,
                    score: 4.5,
                    period: 'Primer Período',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    student_id: 3,
                    subject_id: 2,
                    score: 4.8,
                    period: 'Primer Período',
                    created_at: new Date().toISOString()
                }
            ];

            // Guardar usando el adaptador
            for (const user of users) {
                await this.adapter.saveUser(user);
            }
            
            for (const subject of subjects) {
                await this.adapter.saveSubject(subject);
            }
            
            for (const grade of grades) {
                await this.adapter.saveGrade(grade);
            }

            console.log('Datos de ejemplo cargados exitosamente');
        } catch (error) {
            console.error('Error cargando datos de ejemplo:', error);
        }
    }

    // Operaciones CRUD genéricas
    create(table, data) {
        const items = this.getAll(table);
        const nextIdKey = `next${table.charAt(0).toUpperCase() + table.slice(1, -1)}Id`;
        const nextId = parseInt(localStorage.getItem(nextIdKey) || '1');
        
        const newItem = {
            id: nextId,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        items.push(newItem);
        localStorage.setItem(table, JSON.stringify(items));
        localStorage.setItem(nextIdKey, (nextId + 1).toString());
        
        return newItem;
    }

    getAll(table) {
        return JSON.parse(localStorage.getItem(table) || '[]');
    }

    getById(table, id) {
        const items = this.getAll(table);
        return items.find(item => item.id === parseInt(id));
    }

    getWhere(table, conditions) {
        const items = this.getAll(table);
        return items.filter(item => {
            return Object.keys(conditions).every(key => {
                return item[key] === conditions[key];
            });
        });
    }

    update(table, id, data) {
        const items = this.getAll(table);
        const index = items.findIndex(item => item.id === parseInt(id));
        
        if (index !== -1) {
            items[index] = {
                ...items[index],
                ...data,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem(table, JSON.stringify(items));
            return items[index];
        }
        
        return null;
    }

    delete(table, id) {
        const items = this.getAll(table);
        const filteredItems = items.filter(item => item.id !== parseInt(id));
        localStorage.setItem(table, JSON.stringify(filteredItems));
        return filteredItems.length < items.length;
    }

    // Métodos específicos para usuarios
    createUser(userData) {
        return this.create(this.tables.users, userData);
    }

    getUserByEmail(email) {
        const users = this.getAll(this.tables.users);
        return users.find(user => user.email === email);
    }

    getUsersByRole(role) {
        return this.getWhere(this.tables.users, { role });
    }

    updateUser(id, userData) {
        return this.update(this.tables.users, id, userData);
    }

    deleteUser(id) {
        return this.delete(this.tables.users, id);
    }

    // Métodos específicos para materias
    createSubject(subjectData) {
        return this.create(this.tables.subjects, subjectData);
    }

    getSubjectsByTeacher(teacherId) {
        return this.getWhere(this.tables.subjects, { teacherId: parseInt(teacherId) });
    }

    updateSubject(id, subjectData) {
        return this.update(this.tables.subjects, id, subjectData);
    }

    deleteSubject(id) {
        return this.delete(this.tables.subjects, id);
    }

    // Métodos específicos para notas
    createGrade(gradeData) {
        return this.create(this.tables.grades, gradeData);
    }

    getGradesByStudent(studentId) {
        return this.getWhere(this.tables.grades, { student_id: parseInt(studentId) });
    }

    getGradesBySubject(subjectId) {
        return this.getWhere(this.tables.grades, { subject_id: parseInt(subjectId) });
    }

    getGradesByTeacher(teacherId) {
        return this.getWhere(this.tables.grades, { teacher_id: parseInt(teacherId) });
    }

    getGradesByPeriod(period) {
        return this.getWhere(this.tables.grades, { period });
    }

    updateGrade(id, gradeData) {
        return this.update(this.tables.grades, id, gradeData);
    }

    deleteGrade(id) {
        return this.delete(this.tables.grades, id);
    }

    // Métodos para reportes y estadísticas
    getStudentReport(studentId) {
        const student = this.getById(this.tables.users, studentId);
        const grades = this.getGradesByStudent(studentId);
        const subjects = this.getAll(this.tables.subjects);
        
        const report = {
            student,
            grades: grades.map(grade => {
                const subject = subjects.find(s => s.id === grade.subject_id);
                return {
                    ...grade,
                    subject_name: subject ? subject.name : 'Materia no encontrada'
                };
            }),
            average: grades.length > 0 ? 
                grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / grades.length : 0
        };
        
        return report;
    }

    getSubjectReport(subjectId) {
        const subject = this.getById(this.tables.subjects, subjectId);
        const grades = this.getGradesBySubject(subjectId);
        const users = this.getAll(this.tables.users);
        
        const report = {
            subject,
            grades: grades.map(grade => {
                const student = users.find(u => u.id === grade.student_id);
                return {
                    ...grade,
                    student_name: student ? student.name : 'Estudiante no encontrado'
                };
            }),
            average: grades.length > 0 ? 
                grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / grades.length : 0,
            total_students: grades.length
        };
        
        return report;
    }

    getTeacherReport(teacherId) {
        const teacher = this.getById(this.tables.users, teacherId);
        const subjects = this.getSubjectsByTeacher(teacherId);
        const grades = this.getGradesByTeacher(teacherId);
        
        const report = {
            teacher,
            subjects,
            total_grades: grades.length,
            average: grades.length > 0 ? 
                grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / grades.length : 0
        };
        
        return report;
    }

    getGeneralStatistics() {
        const users = this.getAll(this.tables.users);
        const subjects = this.getAll(this.tables.subjects);
        const grades = this.getAll(this.tables.grades);
        
        const students = users.filter(u => u.role === 'student');
        const teachers = users.filter(u => u.role === 'teacher');
        
        return {
            total_students: students.length,
            total_teachers: teachers.length,
            total_subjects: subjects.length,
            total_grades: grades.length,
            general_average: grades.length > 0 ? 
                grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0) / grades.length : 0
        };
    }

    // Método para importar datos desde Excel (simulado)
    importGradesFromExcel(excelData) {
        const importedGrades = [];
        
        try {
            // Simular procesamiento de datos de Excel
            excelData.forEach(row => {
                if (row.student_id && row.subject_id && row.score) {
                    const gradeData = {
                        student_id: parseInt(row.student_id),
                        subject_id: parseInt(row.subject_id),
                        teacher_id: parseInt(row.teacher_id || 1),
                        score: parseFloat(row.score),
                        period: row.period || '2024-1'
                    };
                    
                    const newGrade = this.createGrade(gradeData);
                    importedGrades.push(newGrade);
                }
            });
            
            return {
                success: true,
                imported_count: importedGrades.length,
                grades: importedGrades
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Método para limpiar datos de prueba
    async clearAllData() {
        try {
            // Obtener todos los datos y eliminarlos
            const users = await this.adapter.getUsers();
            const subjects = await this.adapter.getSubjects();
            const grades = await this.adapter.getGrades();

            // Eliminar notas
            for (const grade of grades) {
                await this.adapter.deleteGrade(grade.id);
            }

            // Eliminar materias
            for (const subject of subjects) {
                await this.adapter.deleteSubject(subject.id);
            }

            // Eliminar usuarios
            for (const user of users) {
                await this.adapter.deleteUser(user.id);
            }

            // Si usa localStorage, también limpiar los contadores
            if (this.adapter.useLocalStorage) {
                localStorage.removeItem('nextUserId');
                localStorage.removeItem('nextSubjectId');
                localStorage.removeItem('nextGradeId');
                localStorage.removeItem('nextEnrollmentId');
                localStorage.removeItem('currentUser');
            }

            console.log('Datos eliminados exitosamente');
        } catch (error) {
            console.error('Error eliminando datos:', error);
        }
    }

    // Métodos de conveniencia para acceder al adaptador
    async getUsers() {
        return await this.adapter.getUsers();
    }

    async getSubjects() {
        return await this.adapter.getSubjects();
    }

    async getGrades() {
        return await this.adapter.getGrades();
    }

    getStorageInfo() {
        return this.adapter.getStorageInfo();
    }

    // Método para exportar datos
    exportData() {
        const data = {};
        Object.values(this.tables).forEach(table => {
            data[table] = this.getAll(table);
        });
        return data;
    }

    // Método para importar datos
    importData(data) {
        try {
            Object.keys(data).forEach(table => {
                if (this.tables[table] || Object.values(this.tables).includes(table)) {
                    localStorage.setItem(table, JSON.stringify(data[table]));
                }
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Crear instancia global de la base de datos
window.db = new Database();