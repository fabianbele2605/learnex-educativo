// Script de configuración inicial del proyecto
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando Sistema Académico...\n');

// 1. Verificar Node.js y npm
console.log('1️⃣ Verificando dependencias...');
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    console.log(`✅ npm: ${npmVersion}`);
} catch (error) {
    console.error('❌ Node.js o npm no están instalados');
    process.exit(1);
}

// 2. Instalar dependencias
console.log('\n2️⃣ Instalando dependencias...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas');
} catch (error) {
    console.error('❌ Error instalando dependencias');
    process.exit(1);
}

// 3. Verificar archivo .env
console.log('\n3️⃣ Configurando variables de entorno...');
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ Archivo .env creado desde .env.example');
    console.log('⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales de PostgreSQL');
} else {
    console.log('✅ Archivo .env ya existe');
}

// 4. Verificar PostgreSQL
console.log('\n4️⃣ Verificando PostgreSQL...');
try {
    execSync('psql --version', { encoding: 'utf8' });
    console.log('✅ PostgreSQL está instalado');
} catch (error) {
    console.log('⚠️  PostgreSQL no detectado. Asegúrate de tenerlo instalado y en el PATH');
}

// 5. Inicializar base de datos
console.log('\n5️⃣ Inicializando base de datos...');
try {
    const DatabaseInitializer = require('./database/init');
    const initializer = new DatabaseInitializer();
    await initializer.initialize();
} catch (error) {
    console.log('⚠️  Error inicializando base de datos:', error.message);
    console.log('💡 Puedes ejecutar manualmente: npm run init-db');
}

console.log('\n🎉 ¡Configuración completada!');
console.log('\n📋 Próximos pasos:');
console.log('1. Edita el archivo .env con tus credenciales de PostgreSQL');
console.log('2. Ejecuta: npm run init-db (si no se ejecutó automáticamente)');
console.log('3. Inicia el servidor: npm start');
console.log('4. Abre http://localhost:3000 en tu navegador');
console.log('\n👤 Usuarios de prueba:');
console.log('   Admin: admin@test.com / admin123');
console.log('   Profesor: teacher@test.com / teacher123');
console.log('   Estudiante: student@test.com / student123');