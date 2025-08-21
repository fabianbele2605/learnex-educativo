/**
 * Adaptador de base de datos para migrar de localStorage a SQLite
 * Proporciona una interfaz unificada para ambos sistemas de almacenamiento
 */
class DatabaseAdapter {
    constructor() {
        this.useLocalStorage = true; // Siempre usar localStorage
        this.init();
    }

    async init() {
        // Inicializar localStorage si es necesario
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', '[]');
        }
        if (!localStorage.getItem('subjects')) {
            localStorage.setItem('subjects', '[]');
        }
        if (!localStorage.getItem('grades')) {
            localStorage.setItem('grades', '[]');
        }
        if (!localStorage.getItem('messages')) {
            localStorage.setItem('messages', '[]');
        }
        console.log('LocalStorage inicializado correctamente');
    }

    // Métodos unificados para usuarios
    async getUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    async saveUser(user) {
        const users = await this.getUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        if (existingIndex >= 0) {
            users[existingIndex] = user;
        } else {
            users.push(user);
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        return user;
    }

    // Métodos unificados para materias
    async getSubjects() {
        return JSON.parse(localStorage.getItem('subjects') || '[]');
    }

    async saveSubject(subject) {
        const subjects = await this.getSubjects();
        const existingIndex = subjects.findIndex(s => s.id === subject.id);
        
        if (existingIndex >= 0) {
            subjects[existingIndex] = subject;
        } else {
            subjects.push(subject);
        }
        
        localStorage.setItem('subjects', JSON.stringify(subjects));
        return subject;
    }

    // Métodos unificados para notas
    async getGrades() {
        return JSON.parse(localStorage.getItem('grades') || '[]');
    }

    async saveGrade(grade) {
        const grades = await this.getGrades();
        const existingIndex = grades.findIndex(g => g.id === grade.id);
        
        if (existingIndex >= 0) {
            grades[existingIndex] = grade;
        } else {
            grades.push(grade);
        }
        
        localStorage.setItem('grades', JSON.stringify(grades));
        return grade;
    }

    // Métodos de utilidad
    async getNextId(table) {
        const key = `next${table.charAt(0).toUpperCase() + table.slice(1)}Id`;
        const nextId = parseInt(localStorage.getItem(key) || '1');
        localStorage.setItem(key, (nextId + 1).toString());
        return nextId;
    }

    // Método para obtener usuario por email
    async getUserByEmail(email) {
        const users = await this.getUsers();
        return users.find(u => u.email === email) || null;
    }

    // Método para verificar el estado de la base de datos
    getStorageInfo() {
        return {
            type: 'localStorage',
            available: true,
            connection: true
        };
    }

    // Métodos para el manejo de mensajes
    async saveMessage(message) {
        const messages = await this.getMessages();
        messages.push(message);
        localStorage.setItem('messages', JSON.stringify(messages));
        return message;
    }

    async getMessages() {
        return JSON.parse(localStorage.getItem('messages') || '[]');
    }

    async getMessageById(messageId) {
        const messages = await this.getMessages();
        return messages.find(m => m.id === messageId);
    }

    async updateMessage(updatedMessage) {
        const messages = await this.getMessages();
        const index = messages.findIndex(m => m.id === updatedMessage.id);
        if (index !== -1) {
            messages[index] = updatedMessage;
            localStorage.setItem('messages', JSON.stringify(messages));
        }
        return updatedMessage;
    }
}

// Instancia global del adaptador
window.dbAdapter = new DatabaseAdapter();