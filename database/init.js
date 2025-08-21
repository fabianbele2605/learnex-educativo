// Script de inicialización de base de datos
const fs = require('fs');
const path = require('path');
const DatabaseConfig = require('./config');

class DatabaseInitializer {
    constructor() {
        this.db = new DatabaseConfig();
    }

    async initialize() {
        try {
            console.log('🔄 Inicializando base de datos...');
            
            // Verificar conexión
            await this.checkConnection();
            
            // Ejecutar schema principal
            await this.runSchema('schema.sql');
            
            // Ejecutar funcionalidades académicas
            await this.runSchema('academic_features.sql');
            
            // Crear datos iniciales
            await this.createInitialData();
            
            console.log('✅ Base de datos inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando base de datos:', error);
            throw error;
        } finally {
            await this.db.close();
        }
    }

    async checkConnection() {
        try {
            await this.db.query('SELECT 1');
            console.log('✅ Conexión a PostgreSQL exitosa');
        } catch (error) {
            throw new Error(`No se puede conectar a PostgreSQL: ${error.message}`);
        }
    }

    async runSchema(filename) {
        const schemaPath = path.join(__dirname, filename);
        
        if (!fs.existsSync(schemaPath)) {
            console.log(`⚠️  Archivo ${filename} no encontrado, saltando...`);
            return;
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        try {
            await this.db.query(schema);
            console.log(`✅ Schema ${filename} ejecutado`);
        } catch (error) {
            console.log(`⚠️  Error en ${filename} (puede ser normal si ya existe):`, error.message);
        }
    }

    async createInitialData() {
        console.log('🔄 Creando datos iniciales...');
        
        // Verificar si ya existen usuarios
        const existingUsers = await this.db.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers.rows[0].count) > 0) {
            console.log('✅ Datos iniciales ya existen');
            return;
        }

        const bcrypt = require('bcrypt');
        
        // Crear usuarios iniciales
        const users = [
            {
                name: 'Administrador',
                email: 'admin@test.com',
                password: await bcrypt.hash('admin123', 12),
                role: 'admin'
            },
            {
                name: 'Profesor Demo',
                email: 'teacher@test.com',
                password: await bcrypt.hash('teacher123', 12),
                role: 'teacher'
            },
            {
                name: 'Estudiante Demo',
                email: 'student@test.com',
                password: await bcrypt.hash('student123', 12),
                role: 'student'
            }
        ];

        for (const user of users) {
            await this.db.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                [user.name, user.email, user.password, user.role]
            );
        }

        // Crear materias de ejemplo
        const teacherResult = await this.db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['teacher']);
        const teacherId = teacherResult.rows[0]?.id;

        if (teacherId) {
            const subjects = [
                { name: 'Matemáticas', code: 'MAT101', credits: 4, teacher_id: teacherId },
                { name: 'Programación', code: 'PRG101', credits: 5, teacher_id: teacherId },
                { name: 'Base de Datos', code: 'BD101', credits: 4, teacher_id: teacherId }
            ];

            for (const subject of subjects) {
                await this.db.query(
                    'INSERT INTO subjects (name, code, credits, teacher_id) VALUES ($1, $2, $3, $4)',
                    [subject.name, subject.code, subject.credits, subject.teacher_id]
                );
            }
        }

        console.log('✅ Datos iniciales creados');
        console.log('📋 Usuarios de prueba:');
        console.log('   Admin: admin@test.com / admin123');
        console.log('   Profesor: teacher@test.com / teacher123');
        console.log('   Estudiante: student@test.com / student123');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const initializer = new DatabaseInitializer();
    initializer.initialize()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = DatabaseInitializer;