# 🚀 Guía de Instalación - Sistema Académico

## Instalación en Nuevo PC

### Opción 1: Configuración Automática ⚡
```bash
# 1. Clonar repositorio
git clone [url-del-repositorio]
cd web-simple

# 2. Ejecutar configuración automática
npm run setup
```

### Opción 2: Configuración Manual 🔧
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Inicializar base de datos
npm run init-db

# 4. Iniciar servidor
npm start
```

## Requisitos Previos

### 1. Node.js
- Versión 16 o superior
- Descargar: https://nodejs.org

### 2. PostgreSQL
- Versión 12 o superior
- Crear una base de datos vacía
- Anotar: host, puerto, nombre DB, usuario, contraseña

## Configuración de Variables (.env)

Edita el archivo `.env` con tus datos:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_base_datos
DB_USER=mi_usuario
DB_PASSWORD=mi_password

# Servidor
PORT=3000
NODE_ENV=development

# Seguridad
JWT_SECRET=mi_clave_secreta_muy_larga
```

## Usuarios de Prueba

El sistema crea automáticamente estos usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@test.com | admin123 |
| Profesor | teacher@test.com | teacher123 |
| Estudiante | student@test.com | student123 |

## Comandos Útiles

```bash
# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev

# Reinicializar base de datos
npm run init-db

# Crear backup manual
npm run backup
```

## Solución de Problemas

### Error de Conexión PostgreSQL
1. Verificar que PostgreSQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Verificar que la base de datos existe

### Puerto 3000 ocupado
Cambiar `PORT=3001` en el archivo `.env`

### Permisos de PostgreSQL
```sql
-- Conectar como superusuario y ejecutar:
GRANT ALL PRIVILEGES ON DATABASE mi_base_datos TO mi_usuario;
```

## Estructura del Proyecto

```
web-simple/
├── database/           # Scripts de base de datos
│   ├── init.js        # Inicialización automática
│   ├── schema.sql     # Esquema principal
│   └── config.js      # Configuración DB
├── js/                # Frontend JavaScript
├── css/               # Estilos
├── server.js          # Servidor principal
├── setup.js           # Script de configuración
└── .env               # Variables de entorno
```

## Funcionalidades

✅ **Autenticación** - Login/registro seguro  
✅ **Roles** - Admin, Profesor, Estudiante  
✅ **Mensajería** - Chat en tiempo real  
✅ **Horarios** - Calendario de clases  
✅ **Asistencia** - Control de presencia  
✅ **Tareas** - Gestión de assignments  
✅ **Backup** - Sistema automático  

## Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica la configuración de `.env`
3. Asegúrate de que PostgreSQL esté corriendo
4. Ejecuta `npm run init-db` para reinicializar