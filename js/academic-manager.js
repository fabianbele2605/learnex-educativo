// Gestor de funcionalidades académicas
if (typeof window.AcademicManager === 'undefined') {
class AcademicManager {
    constructor() {
        this.currentWeek = new Date();
    }

    // === HORARIOS ===
    async getSchedules(subjectId = null) {
        try {
            const endpoint = subjectId ? `/schedules?subject=${subjectId}` : '/schedules';
            return await window.apiClient.request(endpoint);
        } catch (error) {
            console.error('Error obteniendo horarios:', error);
            return [];
        }
    }

    async createSchedule(scheduleData) {
        return await window.apiClient.request('/schedules', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    renderWeeklySchedule(schedules, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const hours = Array.from({length: 12}, (_, i) => i + 7); // 7 AM a 6 PM

        let html = `
            <div class="schedule-grid">
                <div class="schedule-header">
                    <div class="time-column">Hora</div>
                    ${days.map(day => `<div class="day-column">${day}</div>`).join('')}
                </div>
        `;

        hours.forEach(hour => {
            html += `<div class="schedule-row">
                <div class="time-slot">${hour}:00</div>`;
            
            days.forEach((_, dayIndex) => {
                const daySchedules = schedules.filter(s => 
                    s.day_of_week === dayIndex && 
                    parseInt(s.start_time.split(':')[0]) === hour
                );
                
                html += `<div class="schedule-cell" data-day="${dayIndex}" data-hour="${hour}">`;
                daySchedules.forEach(schedule => {
                    html += `
                        <div class="schedule-item" data-id="${schedule.id}">
                            <div class="subject-name">${schedule.subject_name}</div>
                            <div class="schedule-time">${schedule.start_time} - ${schedule.end_time}</div>
                            <div class="classroom">${schedule.classroom || ''}</div>
                        </div>
                    `;
                });
                html += `</div>`;
            });
            html += `</div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // === ASISTENCIA ===
    async getAttendance(subjectId, date = null) {
        try {
            let endpoint = `/attendance?subject=${subjectId}`;
            if (date) endpoint += `&date=${date}`;
            return await window.apiClient.request(endpoint);
        } catch (error) {
            console.error('Error obteniendo asistencia:', error);
            return [];
        }
    }

    async markAttendance(attendanceData) {
        return await window.apiClient.request('/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    renderAttendanceList(students, subjectId, date) {
        const container = document.getElementById('attendance-list');
        if (!container) return;

        let html = `
            <div class="attendance-header">
                <h4>Asistencia - ${new Date(date).toLocaleDateString()}</h4>
                <button class="btn btn-primary" onclick="academicManager.saveAllAttendance('${subjectId}', '${date}')">
                    Guardar Asistencia
                </button>
            </div>
            <div class="attendance-grid">
        `;

        students.forEach(student => {
            html += `
                <div class="attendance-row" data-student="${student.id}">
                    <div class="student-info">
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </div>
                    <div class="attendance-options">
                        <label class="attendance-option">
                            <input type="radio" name="attendance_${student.id}" value="present" checked>
                            <span class="status-present">Presente</span>
                        </label>
                        <label class="attendance-option">
                            <input type="radio" name="attendance_${student.id}" value="absent">
                            <span class="status-absent">Ausente</span>
                        </label>
                        <label class="attendance-option">
                            <input type="radio" name="attendance_${student.id}" value="late">
                            <span class="status-late">Tardanza</span>
                        </label>
                        <label class="attendance-option">
                            <input type="radio" name="attendance_${student.id}" value="excused">
                            <span class="status-excused">Justificado</span>
                        </label>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    async saveAllAttendance(subjectId, date) {
        const rows = document.querySelectorAll('.attendance-row');
        const attendanceData = [];

        rows.forEach(row => {
            const studentId = row.dataset.student;
            const status = row.querySelector('input[type="radio"]:checked').value;
            
            attendanceData.push({
                student_id: studentId,
                subject_id: subjectId,
                date: date,
                status: status
            });
        });

        try {
            await window.apiClient.request('/attendance/bulk', {
                method: 'POST',
                body: JSON.stringify({ attendance: attendanceData })
            });
            
            if (window.notificationManager) {
                window.notificationManager.success('Asistencia guardada correctamente');
            }
        } catch (error) {
            if (window.notificationManager) {
                window.notificationManager.error('Error guardando asistencia');
            }
        }
    }

    // === TAREAS ===
    async getAssignments(subjectId = null) {
        try {
            const endpoint = subjectId ? `/assignments?subject=${subjectId}` : '/assignments';
            return await window.apiClient.request(endpoint);
        } catch (error) {
            console.error('Error obteniendo tareas:', error);
            return [];
        }
    }

    async createAssignment(assignmentData) {
        return await window.apiClient.request('/assignments', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }

    async getSubmissions(assignmentId) {
        return await window.apiClient.request(`/submissions?assignment=${assignmentId}`);
    }

    async submitAssignment(submissionData) {
        return await window.apiClient.request('/submissions', {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
    }

    renderAssignmentsList(assignments, userRole) {
        const container = document.getElementById('assignments-list');
        if (!container) return;

        let html = `
            <div class="assignments-header">
                <h4>Tareas y Proyectos</h4>
                ${userRole === 'teacher' ? `
                    <button class="btn btn-primary" onclick="academicManager.showCreateAssignmentModal()">
                        <i class="fas fa-plus"></i> Nueva Tarea
                    </button>
                ` : ''}
            </div>
            <div class="assignments-grid">
        `;

        assignments.forEach(assignment => {
            const dueDate = new Date(assignment.due_date);
            const isOverdue = dueDate < new Date();
            const dueDateClass = isOverdue ? 'overdue' : '';

            html += `
                <div class="assignment-card ${dueDateClass}" data-id="${assignment.id}">
                    <div class="assignment-header">
                        <h5>${assignment.title}</h5>
                        <span class="assignment-type">${assignment.assignment_type}</span>
                    </div>
                    <div class="assignment-body">
                        <p>${assignment.description}</p>
                        <div class="assignment-meta">
                            <div class="due-date">
                                <i class="fas fa-calendar"></i>
                                Vence: ${dueDate.toLocaleDateString()}
                            </div>
                            <div class="max-score">
                                <i class="fas fa-star"></i>
                                ${assignment.max_score} pts
                            </div>
                        </div>
                    </div>
                    <div class="assignment-actions">
                        ${userRole === 'student' ? `
                            <button class="btn btn-primary" onclick="academicManager.showSubmissionModal('${assignment.id}')">
                                Entregar
                            </button>
                        ` : `
                            <button class="btn btn-secondary" onclick="academicManager.viewSubmissions('${assignment.id}')">
                                Ver Entregas
                            </button>
                        `}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    // === MENSAJERÍA ===
    async getMessages(userId = null) {
        try {
            const endpoint = userId ? `/messages?user=${userId}` : '/messages';
            return await window.apiClient.request(endpoint);
        } catch (error) {
            console.error('Error obteniendo mensajes:', error);
            return [];
        }
    }

    async sendMessage(messageData) {
        return await window.apiClient.request('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async markMessageAsRead(messageId) {
        return await window.apiClient.request(`/messages/${messageId}/read`, {
            method: 'PUT'
        });
    }

    renderChatInterface(messages, currentUserId) {
        const container = document.getElementById('chat-container');
        if (!container) {
            console.error('No se encontró chat-container');
            return;
        }

        console.log('Renderizando chat con', messages.length, 'mensajes');

        let messagesHtml = '';
        if (messages.length === 0) {
            messagesHtml = '<div class="no-messages">No hay mensajes aún. ¡Inicia la conversación!</div>';
        } else {
            messages.forEach(message => {
                const isOwn = message.sender_id === currentUserId;
                const messageClass = isOwn ? 'message-own' : 'message-other';
                
                messagesHtml += `
                    <div class="message ${messageClass}" data-id="${message.id}">
                        <div class="message-content">
                            <div class="message-text">${message.message}</div>
                            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
            });
        }

        const html = `
            <div class="chat-header">
                <h4>Chat con ${this.currentChatUserName}</h4>
            </div>
            <div class="chat-messages" id="chat-messages">
                ${messagesHtml}
            </div>
            <div class="chat-input">
                <input type="text" id="message-input" placeholder="Escribe un mensaje..." class="form-control">
                <button class="btn btn-primary" onclick="window.academicManager.sendChatMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;

        container.innerHTML = html;
        
        // Auto-scroll al final
        setTimeout(() => {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
        
        // Event listener para Enter
        setTimeout(() => {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        window.academicManager.sendChatMessage();
                    }
                });
            }
        }, 100);
    }

    async sendChatMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message || !this.currentChatUser) return;

        const currentUser = window.uiManager.authManager.getCurrentUser();
        if (!currentUser) return;

        // Agregar mensaje inmediatamente a la interfaz
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message message-own';
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message}</div>
                    <div class="message-time">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        input.value = '';

        try {
            // Enviar al servidor en segundo plano
            await this.sendMessage({
                receiver_id: this.currentChatUser,
                message: message
            });
            console.log('Mensaje enviado al servidor');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            // En caso de error, mostrar mensaje de error
            if (messagesContainer) {
                const errorEl = document.createElement('div');
                errorEl.className = 'message-error';
                errorEl.textContent = 'Error enviando mensaje';
                messagesContainer.appendChild(errorEl);
            }
        }
    }
    
    async openChat(userId, userName) {
        console.log('Abriendo chat con:', userId, userName);
        this.currentChatUser = userId;
        this.currentChatUserName = userName;
        
        try {
            const messages = await this.getMessages(userId);
            const currentUser = window.uiManager.authManager.getCurrentUser();
            
            if (!currentUser) {
                console.error('No hay usuario actual');
                return;
            }
            
            // Los mensajes ya vienen filtrados del servidor
            const filteredMessages = messages;
            
            this.renderChatInterface(filteredMessages, currentUser.id);
            
            // Marcar mensajes como leídos
            const unreadMessages = filteredMessages.filter(m => !m.is_read && m.receiver_id === currentUser.id);
            for (const message of unreadMessages) {
                await this.markMessageAsRead(message.id);
            }
        } catch (error) {
            console.error('Error abriendo chat:', error);
            // Mostrar interfaz vacía en caso de error
            this.renderChatInterface([], null);
        }
    }
    
    async loadChatMessages() {
        if (!this.currentChatUser) return;
        
        try {
            const messages = await this.getMessages(this.currentChatUser);
            const currentUser = window.uiManager.authManager.getCurrentUser();
            
            if (!currentUser) return;
            
            // Filtrar mensajes entre estos dos usuarios
            const filteredMessages = messages.filter(m => 
                (m.sender_id === currentUser.id && m.receiver_id === this.currentChatUser) ||
                (m.sender_id === this.currentChatUser && m.receiver_id === currentUser.id)
            );
            
            this.renderChatInterface(filteredMessages, currentUser.id);
        } catch (error) {
            console.error('Error cargando mensajes:', error);
        }
    }
}

window.AcademicManager = AcademicManager;
window.academicManager = new AcademicManager();
}