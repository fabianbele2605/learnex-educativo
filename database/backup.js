// Sistema de backup automático para PostgreSQL
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BackupManager {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.backupDir = path.join(__dirname, 'backups');
        this.maxBackups = 10;
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            console.log('Directorio de backups inicializado');
        } catch (error) {
            console.error('Error creando directorio de backups:', error);
        }
    }

    async createBackup(type = 'manual') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);

        try {
            // Comando pg_dump para PostgreSQL
            const command = `pg_dump -h ${process.env.DB_HOST || 'localhost'} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'academic_system'} -f "${filepath}"`;
            
            await execAsync(command, {
                env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'password' }
            });

            const stats = await fs.stat(filepath);
            
            // Registrar backup en la base de datos
            await this.dbConfig.query(
                'INSERT INTO backups (filename, size, backup_type) VALUES ($1, $2, $3)',
                [filename, stats.size, type]
            );

            console.log(`Backup creado: ${filename} (${stats.size} bytes)`);
            
            // Limpiar backups antiguos
            await this.cleanOldBackups();
            
            return {
                success: true,
                filename,
                size: stats.size,
                path: filepath
            };

        } catch (error) {
            console.error('Error creando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async restoreBackup(filename) {
        const filepath = path.join(this.backupDir, filename);
        
        try {
            // Verificar que el archivo existe
            await fs.access(filepath);
            
            // Comando psql para restaurar
            const command = `psql -h ${process.env.DB_HOST || 'localhost'} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'academic_system'} -f "${filepath}"`;
            
            await execAsync(command, {
                env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'password' }
            });

            console.log(`Backup restaurado: ${filename}`);
            return { success: true };

        } catch (error) {
            console.error('Error restaurando backup:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async listBackups() {
        try {
            const result = await this.dbConfig.query(
                'SELECT * FROM backups ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            console.error('Error listando backups:', error);
            return [];
        }
    }

    async cleanOldBackups() {
        try {
            const backups = await this.listBackups();
            
            if (backups.length > this.maxBackups) {
                const toDelete = backups.slice(this.maxBackups);
                
                for (const backup of toDelete) {
                    const filepath = path.join(this.backupDir, backup.filename);
                    
                    try {
                        await fs.unlink(filepath);
                        await this.dbConfig.query(
                            'DELETE FROM backups WHERE id = $1',
                            [backup.id]
                        );
                        console.log(`Backup eliminado: ${backup.filename}`);
                    } catch (error) {
                        console.error(`Error eliminando backup ${backup.filename}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error limpiando backups antiguos:', error);
        }
    }

    // Backup automático programado
    startAutoBackup(intervalHours = 24) {
        const intervalMs = intervalHours * 60 * 60 * 1000;
        
        setInterval(async () => {
            console.log('Iniciando backup automático...');
            await this.createBackup('automatic');
        }, intervalMs);

        console.log(`Backup automático programado cada ${intervalHours} horas`);
    }

    // Backup de emergencia (solo datos críticos)
    async createEmergencyBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `emergency_backup_${timestamp}.sql`;
        const filepath = path.join(this.backupDir, filename);

        try {
            // Solo tablas críticas
            const command = `pg_dump -h ${process.env.DB_HOST || 'localhost'} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER || 'postgres'} -d ${process.env.DB_NAME || 'academic_system'} -t users -t subjects -t grades -t enrollments -f "${filepath}"`;
            
            await execAsync(command, {
                env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || 'password' }
            });

            const stats = await fs.stat(filepath);
            
            await this.dbConfig.query(
                'INSERT INTO backups (filename, size, backup_type) VALUES ($1, $2, $3)',
                [filename, stats.size, 'emergency']
            );

            return {
                success: true,
                filename,
                size: stats.size
            };

        } catch (error) {
            console.error('Error creando backup de emergencia:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = BackupManager;