// Configuración de base de datos PostgreSQL
const { Pool } = require('pg');

class DatabaseConfig {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'academic_system',
            password: process.env.DB_PASSWORD || 'password',
            port: process.env.DB_PORT || 5432,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Error inesperado en el cliente de PostgreSQL', err);
            process.exit(-1);
        });
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Query ejecutada', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Error en query:', error);
            throw error;
        }
    }

    async getClient() {
        return await this.pool.connect();
    }

    async close() {
        await this.pool.end();
    }

    // Validaciones de integridad
    async validateUser(userData) {
        const errors = [];
        
        if (!userData.name || userData.name.length < 2) {
            errors.push('Nombre debe tener al menos 2 caracteres');
        }
        
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            errors.push('Email inválido');
        }
        
        if (!['admin', 'teacher', 'student'].includes(userData.role)) {
            errors.push('Rol inválido');
        }

        // Verificar email único
        const existingUser = await this.query(
            'SELECT id FROM users WHERE email = $1',
            [userData.email]
        );
        
        if (existingUser.rows.length > 0) {
            errors.push('Email ya registrado');
        }

        return errors;
    }

    async validateSubject(subjectData) {
        const errors = [];
        
        if (!subjectData.name || subjectData.name.length < 3) {
            errors.push('Nombre de materia debe tener al menos 3 caracteres');
        }
        
        if (!subjectData.code || subjectData.code.length < 3) {
            errors.push('Código de materia debe tener al menos 3 caracteres');
        }
        
        if (!subjectData.credits || subjectData.credits < 1 || subjectData.credits > 10) {
            errors.push('Créditos deben estar entre 1 y 10');
        }

        // Verificar código único
        const existingSubject = await this.query(
            'SELECT id FROM subjects WHERE code = $1',
            [subjectData.code]
        );
        
        if (existingSubject.rows.length > 0) {
            errors.push('Código de materia ya existe');
        }

        return errors;
    }

    async validateGrade(gradeData) {
        const errors = [];
        
        if (gradeData.score < 0 || gradeData.score > 5) {
            errors.push('Calificación debe estar entre 0 y 5');
        }

        // Verificar que el estudiante existe
        const student = await this.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [gradeData.student_id, 'student']
        );
        
        if (student.rows.length === 0) {
            errors.push('Estudiante no encontrado');
        }

        // Verificar que la materia existe
        const subject = await this.query(
            'SELECT id FROM subjects WHERE id = $1',
            [gradeData.subject_id]
        );
        
        if (subject.rows.length === 0) {
            errors.push('Materia no encontrada');
        }

        return errors;
    }
}

module.exports = DatabaseConfig;