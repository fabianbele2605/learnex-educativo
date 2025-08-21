// Cliente API para PostgreSQL
if (typeof window.APIClient === 'undefined') {
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('auth_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error en la petición');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Autenticación
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        
        return data.user;
    }

    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
    }

    // Usuarios
    async getUsers() {
        return await this.request('/users');
    }

    async createUser(userData) {
        return await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Materias
    async getSubjects() {
        return await this.request('/subjects');
    }

    async createSubject(subjectData) {
        return await this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify(subjectData)
        });
    }

    // Calificaciones
    async getGrades() {
        return await this.request('/grades');
    }

    async createGrade(gradeData) {
        return await this.request('/grades', {
            method: 'POST',
            body: JSON.stringify(gradeData)
        });
    }

    // Horarios
    async getSchedules(subjectId = null) {
        const endpoint = subjectId ? `/schedules?subject=${subjectId}` : '/schedules';
        return await this.request(endpoint);
    }

    async createSchedule(scheduleData) {
        return await this.request('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    // Asistencia
    async getAttendance(subjectId, date = null) {
        let endpoint = `/attendance?subject=${subjectId}`;
        if (date) endpoint += `&date=${date}`;
        return await this.request(endpoint);
    }

    async saveAttendance(attendanceData) {
        return await this.request('/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify({ attendance: attendanceData })
        });
    }

    // Tareas
    async getAssignments(subjectId = null) {
        const endpoint = subjectId ? `/assignments?subject=${subjectId}` : '/assignments';
        return await this.request(endpoint);
    }

    async createAssignment(assignmentData) {
        return await this.request('/assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }

    // Entregas
    async getSubmissions(assignmentId) {
        return await this.request(`/submissions?assignment=${assignmentId}`);
    }

    async submitAssignment(submissionData) {
        return await this.request('/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
    }

    // Mensajes
    async getMessages(userId = null) {
        const endpoint = userId ? `/messages?user=${userId}` : '/messages';
        return await this.request(endpoint);
    }

    async sendMessage(messageData) {
        return await this.request('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async markMessageAsRead(messageId) {
        return await this.request(`/messages/${messageId}/read`, {
            method: 'PUT'
        });
    }

    // Backups
    async createBackup() {
        return await this.request('/backup/create', {
            method: 'POST'
        });
    }

    async getBackups() {
        return await this.request('/backup/list');
    }

    // Verificar si hay token válido
    isAuthenticated() {
        return !!this.token && !!localStorage.getItem('current_user');
    }

    getCurrentUser() {
        const userData = localStorage.getItem('current_user');
        return userData ? JSON.parse(userData) : null;
    }
}

window.apiClient = new APIClient();
window.APIClient = APIClient;
}