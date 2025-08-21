// Servidor Node.js con PostgreSQL
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const DatabaseConfig = require('./database/config');
const BackupManager = require('./database/backup');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

// Inicializar base de datos y backup
const db = new DatabaseConfig();
const backupManager = new BackupManager(db);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
};

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Guardar sesión
        await db.query(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, new Date(Date.now() + 24 * 60 * 60 * 1000)]
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const userData = req.body;
        
        // Validar datos
        const validationErrors = await db.validateUser(userData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        // Hash de la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [userData.name, userData.email, passwordHash, userData.role]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de usuarios
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT id, name, email, role, created_at, is_active FROM users WHERE is_active = true';
        let params = [];
        
        if (req.user.role === 'admin') {
            // Admin ve todos los usuarios
            query += ' ORDER BY created_at DESC';
        } else if (req.user.role === 'teacher') {
            // Profesor ve estudiantes y otros profesores
            query += ` AND (role = 'student' OR role = 'teacher') AND id != $1 ORDER BY role, name`;
            params = [req.user.id];
        } else if (req.user.role === 'student') {
            // Estudiante ve solo profesores
            query += ` AND role = 'teacher' ORDER BY name`;
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de materias
app.get('/api/subjects', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT s.*, u.name as teacher_name 
            FROM subjects s 
            LEFT JOIN users u ON s.teacher_id = u.id 
            ORDER BY s.name
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo materias:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/subjects', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const subjectData = req.body;
        const validationErrors = await db.validateSubject(subjectData);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        const result = await db.query(
            'INSERT INTO subjects (name, code, credits, teacher_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [subjectData.name, subjectData.code, subjectData.credits, subjectData.teacher_id, subjectData.description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando materia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de calificaciones
app.get('/api/grades', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT g.*, u.name as student_name, s.name as subject_name, s.code as subject_code
            FROM grades g
            JOIN users u ON g.student_id = u.id
            JOIN subjects s ON g.subject_id = s.id
        `;
        let params = [];

        if (req.user.role === 'student') {
            query += ' WHERE g.student_id = $1';
            params = [req.user.id];
        } else if (req.user.role === 'teacher') {
            query += ' WHERE s.teacher_id = $1';
            params = [req.user.id];
        }

        query += ' ORDER BY g.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo calificaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// === RUTAS ACADÉMICAS ===

// Horarios
app.get('/api/schedules', authenticateToken, async (req, res) => {
    try {
        const { subject } = req.query;
        let query = `
            SELECT s.*, sub.name as subject_name 
            FROM schedules s 
            JOIN subjects sub ON s.subject_id = sub.id
        `;
        let params = [];
        
        if (subject) {
            query += ' WHERE s.subject_id = $1';
            params = [subject];
        }
        
        query += ' ORDER BY s.day_of_week, s.start_time';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { subject_id, day_of_week, start_time, end_time, classroom } = req.body;
        
        const result = await db.query(
            'INSERT INTO schedules (subject_id, day_of_week, start_time, end_time, classroom) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [subject_id, day_of_week, start_time, end_time, classroom]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando horario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Asistencia
app.get('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const { subject, date } = req.query;
        let query = `
            SELECT a.*, u.name as student_name 
            FROM attendance a 
            JOIN users u ON a.student_id = u.id
        `;
        let params = [];
        let conditions = [];
        
        if (subject) {
            conditions.push(`a.subject_id = $${params.length + 1}`);
            params.push(subject);
        }
        
        if (date) {
            conditions.push(`a.date = $${params.length + 1}`);
            params.push(date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY a.date DESC, u.name';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo asistencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/attendance/bulk', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { attendance } = req.body;
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            for (const record of attendance) {
                await client.query(
                    `INSERT INTO attendance (student_id, subject_id, date, status) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (student_id, subject_id, date) 
                     DO UPDATE SET status = $4`,
                    [record.student_id, record.subject_id, record.date, record.status]
                );
            }
            
            await client.query('COMMIT');
            res.json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error guardando asistencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Tareas
app.get('/api/assignments', authenticateToken, async (req, res) => {
    try {
        const { subject } = req.query;
        let query = `
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            JOIN subjects s ON a.subject_id = s.id
        `;
        let params = [];
        
        if (subject) {
            query += ' WHERE a.subject_id = $1';
            params = [subject];
        }
        
        query += ' ORDER BY a.due_date ASC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/assignments', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { subject_id, title, description, due_date, max_score, assignment_type } = req.body;
        
        const result = await db.query(
            'INSERT INTO assignments (subject_id, title, description, due_date, max_score, assignment_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [subject_id, title, description, due_date, max_score, assignment_type]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Entregas
app.get('/api/submissions', authenticateToken, async (req, res) => {
    try {
        const { assignment } = req.query;
        let query = `
            SELECT s.*, u.name as student_name, a.title as assignment_title 
            FROM submissions s 
            JOIN users u ON s.student_id = u.id 
            JOIN assignments a ON s.assignment_id = a.id
        `;
        let params = [];
        
        if (assignment) {
            query += ' WHERE s.assignment_id = $1';
            params = [assignment];
        }
        
        query += ' ORDER BY s.submitted_at DESC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo entregas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/submissions', authenticateToken, async (req, res) => {
    try {
        const { assignment_id, content, file_path } = req.body;
        
        const result = await db.query(
            `INSERT INTO submissions (assignment_id, student_id, content, file_path) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (assignment_id, student_id) 
             DO UPDATE SET content = $3, file_path = $4, submitted_at = CURRENT_TIMESTAMP 
             RETURNING *`,
            [assignment_id, req.user.id, content, file_path]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error enviando tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Mensajes
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { user } = req.query;
        let query = `
            SELECT m.*, 
                   sender.name as sender_name, 
                   receiver.name as receiver_name,
                   s.name as subject_name
            FROM messages m 
            JOIN users sender ON m.sender_id = sender.id 
            JOIN users receiver ON m.receiver_id = receiver.id 
            LEFT JOIN subjects s ON m.subject_id = s.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
        `;
        let params = [req.user.id];
        
        if (user) {
            query += ' AND (m.sender_id = $2 OR m.receiver_id = $2)';
            params.push(user);
        }
        
        query += ' ORDER BY m.created_at ASC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { receiver_id, message, subject_id } = req.body;
        
        const result = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, receiver_id, message, subject_id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
    try {
        await db.query(
            'UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2',
            [req.params.id, req.user.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// === RUTAS ACADÉMICAS ===

// Horarios
app.get('/api/schedules', authenticateToken, async (req, res) => {
    try {
        const { subject } = req.query;
        let query = `
            SELECT s.*, sub.name as subject_name 
            FROM schedules s 
            JOIN subjects sub ON s.subject_id = sub.id
        `;
        let params = [];
        
        if (subject) {
            query += ' WHERE s.subject_id = $1';
            params = [subject];
        }
        
        query += ' ORDER BY s.day_of_week, s.start_time';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo horarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { subject_id, day_of_week, start_time, end_time, classroom } = req.body;
        
        const result = await db.query(
            'INSERT INTO schedules (subject_id, day_of_week, start_time, end_time, classroom) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [subject_id, day_of_week, start_time, end_time, classroom]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando horario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Asistencia
app.get('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const { subject, date } = req.query;
        let query = `
            SELECT a.*, u.name as student_name 
            FROM attendance a 
            JOIN users u ON a.student_id = u.id
        `;
        let params = [];
        let conditions = [];
        
        if (subject) {
            conditions.push(`a.subject_id = $${params.length + 1}`);
            params.push(subject);
        }
        
        if (date) {
            conditions.push(`a.date = $${params.length + 1}`);
            params.push(date);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY a.date DESC, u.name';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo asistencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/attendance/bulk', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { attendance } = req.body;
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            for (const record of attendance) {
                await client.query(
                    `INSERT INTO attendance (student_id, subject_id, date, status) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (student_id, subject_id, date) 
                     DO UPDATE SET status = $4`,
                    [record.student_id, record.subject_id, record.date, record.status]
                );
            }
            
            await client.query('COMMIT');
            res.json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error guardando asistencia:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Tareas
app.get('/api/assignments', authenticateToken, async (req, res) => {
    try {
        const { subject } = req.query;
        let query = `
            SELECT a.*, s.name as subject_name 
            FROM assignments a 
            JOIN subjects s ON a.subject_id = s.id
        `;
        let params = [];
        
        if (subject) {
            query += ' WHERE a.subject_id = $1';
            params = [subject];
        }
        
        query += ' ORDER BY a.due_date DESC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/assignments', authenticateToken, async (req, res) => {
    try {
        if (!['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        
        const { subject_id, title, description, due_date, max_score, assignment_type } = req.body;
        
        const result = await db.query(
            'INSERT INTO assignments (subject_id, title, description, due_date, max_score, assignment_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [subject_id, title, description, due_date, max_score, assignment_type]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Entregas
app.get('/api/submissions', authenticateToken, async (req, res) => {
    try {
        const { assignment } = req.query;
        let query = `
            SELECT s.*, u.name as student_name 
            FROM submissions s 
            JOIN users u ON s.student_id = u.id
        `;
        let params = [];
        
        if (assignment) {
            query += ' WHERE s.assignment_id = $1';
            params = [assignment];
        }
        
        query += ' ORDER BY s.submitted_at DESC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo entregas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/submissions', authenticateToken, async (req, res) => {
    try {
        const { assignment_id, content, file_path } = req.body;
        
        const result = await db.query(
            `INSERT INTO submissions (assignment_id, student_id, content, file_path) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (assignment_id, student_id) 
             DO UPDATE SET content = $3, file_path = $4, submitted_at = CURRENT_TIMESTAMP 
             RETURNING *`,
            [assignment_id, req.user.id, content, file_path]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error enviando tarea:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Mensajes
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { user } = req.query;
        let query = `
            SELECT m.*, 
                   sender.name as sender_name, 
                   receiver.name as receiver_name 
            FROM messages m 
            JOIN users sender ON m.sender_id = sender.id 
            JOIN users receiver ON m.receiver_id = receiver.id 
            WHERE (m.sender_id = $1 OR m.receiver_id = $1)
        `;
        let params = [req.user.id];
        
        if (user) {
            query += ' AND ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))';
            params.push(user);
        }
        
        query += ' ORDER BY m.created_at ASC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { receiver_id, message, subject_id } = req.body;
        
        const result = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, receiver_id, message, subject_id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/messages/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(
            'UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2',
            [id, req.user.id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas de backup
app.post('/api/backup/create', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const result = await backupManager.createBackup('manual');
        res.json(result);
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/backup/list', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const backups = await backupManager.listBackups();
        res.json(backups);
    } catch (error) {
        console.error('Error listando backups:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Servir archivos estáticos
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializar servidor
app.listen(PORT, async () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    
    // Iniciar backup automático (cada 24 horas)
    backupManager.startAutoBackup(24);
    
    console.log('Sistema de backup automático iniciado');
});

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('Cerrando servidor...');
    await db.close();
    process.exit(0);
});