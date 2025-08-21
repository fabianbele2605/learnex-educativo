class MessagingService {
    constructor() {
        this.dbAdapter = window.dbAdapter;
    }

    async sendMessage(receiverId, content, messageType = 'text') {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) throw new Error('Usuario no autenticado');

            const message = {
                id: Date.now().toString(),
                senderId: currentUser.id,
                receiverId: receiverId,
                content: content,
                messageType: messageType,
                timestamp: new Date().toISOString(),
                isRead: false
            };

            await this.dbAdapter.saveMessage(message);
            return message;
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            throw error;
        }
    }

    async getConversation(otherUserId, page = 1, limit = 50) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) throw new Error('Usuario no autenticado');

            const messages = await this.dbAdapter.getMessages();
            return messages.filter(msg => 
                (msg.senderId === currentUser.id && msg.receiverId === otherUserId) ||
                (msg.senderId === otherUserId && msg.receiverId === currentUser.id)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } catch (error) {
            console.error('Error obteniendo conversación:', error);
            throw error;
        }
    }

    async markMessageAsRead(messageId) {
        try {
            const message = await this.dbAdapter.getMessageById(messageId);
            if (message) {
                message.isRead = true;
                await this.dbAdapter.updateMessage(message);
            }
        } catch (error) {
            console.error('Error marcando mensaje como leído:', error);
            throw error;
        }
    }

    async markConversationAsRead(otherUserId) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) throw new Error('Usuario no autenticado');

            const messages = await this.dbAdapter.getMessages();
            const unreadMessages = messages.filter(msg => 
                msg.senderId === otherUserId && 
                msg.receiverId === currentUser.id && 
                !msg.isRead
            );

            for (const message of unreadMessages) {
                await this.markMessageAsRead(message.id);
            }
        } catch (error) {
            console.error('Error marcando conversación como leída:', error);
            throw error;
        }
    }

    async getAvailableContacts() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) throw new Error('Usuario no autenticado');

            const users = await this.dbAdapter.getUsers();
            return users.filter(user => {
                // Filtrar según el rol del usuario actual
                switch (currentUser.role) {
                    case 'admin':
                        return user.id !== currentUser.id; // Puede contactar a todos
                    case 'teacher':
                        return user.role === 'admin' || user.role === 'parent';
                    case 'student':
                        return user.role === 'admin' || user.role === 'teacher';
                    case 'parent':
                        return user.role === 'admin' || user.role === 'teacher';
                    default:
                        return false;
                }
            });
        } catch (error) {
            console.error('Error obteniendo contactos:', error);
            throw error;
        }
    }

    async getUserConversations() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) throw new Error('Usuario no autenticado');

            const messages = await this.dbAdapter.getMessages();
            const users = await this.dbAdapter.getUsers();

            // Obtener IDs únicos de usuarios con los que hay conversaciones
            const conversationUserIds = new Set();
            messages.forEach(msg => {
                if (msg.senderId === currentUser.id) {
                    conversationUserIds.add(msg.receiverId);
                } else if (msg.receiverId === currentUser.id) {
                    conversationUserIds.add(msg.senderId);
                }
            });

            // Construir las conversaciones
            const conversations = [];
            for (const userId of conversationUserIds) {
                const otherUser = users.find(u => u.id === userId);
                if (!otherUser) continue;

                const conversationMessages = messages.filter(msg =>
                    (msg.senderId === currentUser.id && msg.receiverId === userId) ||
                    (msg.senderId === userId && msg.receiverId === currentUser.id)
                ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                if (conversationMessages.length > 0) {
                    conversations.push({
                        otherUser: otherUser,
                        lastMessage: conversationMessages[0],
                        unreadCount: conversationMessages.filter(msg => 
                            msg.senderId === userId && 
                            msg.receiverId === currentUser.id && 
                            !msg.isRead
                        ).length
                    });
                }
            }

            return conversations.sort((a, b) => 
                new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
            );
        } catch (error) {
            console.error('Error obteniendo conversaciones:', error);
            throw error;
        }
    }

    formatMessageDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Ayer';
        } else if (days < 7) {
            return date.toLocaleDateString('es-ES', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
            });
        }
    }
}

// Inicializar el servicio de mensajería
window.messagingService = new MessagingService();