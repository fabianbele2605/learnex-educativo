class ApiClient {
    static async getCurrentUser() {
        // Obtener usuario de la sesión
        return window.sessionManager.getCurrentUser();
    }

    static async getSubjects() {
        // Obtener materias del localStorage
        return JSON.parse(localStorage.getItem('subjects') || '[]');
    }

    static async getGrades() {
        // Obtener notas del localStorage
        return JSON.parse(localStorage.getItem('grades') || '[]');
    }

    static async getUsers() {
        // Obtener usuarios del localStorage
        return JSON.parse(localStorage.getItem('users') || '[]');
    }
}

// Hacer disponible globalmente
window.apiClient = ApiClient;