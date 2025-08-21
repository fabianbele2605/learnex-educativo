// Sistema de Mensajería
if (typeof window.MessagingSystem === 'undefined') {
class MessagingSystem {
    constructor() {
        this.messages = JSON.parse(localStorage.getItem('messages') || '[]');
        this.conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        this.unreadCount = 0;
        this.currentConversation = null;
        this.init();
    }
    
    init() {
        this.updateUnreadCount();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="open-chat"]')) {
                this.openChatModal();
            }
            if (e.target.matches('[data-action="send-message"]')) {
                this.sendMessage();
            }
            if (e.target.matches('.conversation-item')) {
                const userId = e.target.dataset.userId;
                this.openConversation(userId);
            }
        });
    }
    
    sendMessage(recipientId, content, type = 'text') {
        const currentUser = window.sessionManager.getCurrentUser();
        if (!currentUser) return;
        
        const message = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            recipientId: recipientId,
            content: content,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        this.messages.push(message);
        this.saveMessages();
        this.updateConversation(recipientId);
        this.notifyNewMessage(message);
        
        return message;
    }
    
    getConversations(userId) {
        const userMessages = this.messages.filter(m => 
            m.senderId === userId || m.recipientId === userId
        );
        
        const conversationMap = new Map();
        
        userMessages.forEach(message => {
            const otherUserId = message.senderId === userId ? message.recipientId : message.senderId;
            
            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, {
                    userId: otherUserId,
                    messages: [],
                    lastMessage: null,
                    unreadCount: 0
                });
            }
            
            const conversation = conversationMap.get(otherUserId);
            conversation.messages.push(message);
            
            if (!conversation.lastMessage || new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
                conversation.lastMessage = message;
            }
            
            if (!message.read && message.recipientId === userId) {
                conversation.unreadCount++;
            }
        });
        
        return Array.from(conversationMap.values()).sort((a, b) => 
            new Date(b.lastMessage?.timestamp || 0) - new Date(a.lastMessage?.timestamp || 0)
        );
    }
    
    markAsRead(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            this.saveMessages();
            this.updateUnreadCount();
        }
    }
    
    markConversationAsRead(otherUserId) {
        const currentUser = window.sessionManager.getCurrentUser();
        const unreadMessages = this.messages.filter(m => 
            m.senderId === otherUserId && 
            m.recipientId === currentUser.id && 
            !m.read
        );
        
        unreadMessages.forEach(message => {
            message.read = true;
        });
        
        this.saveMessages();
        this.updateUnreadCount();
    }
    
    updateUnreadCount() {
        const currentUser = window.sessionManager.getCurrentUser();
        if (!currentUser) return;
        
        this.unreadCount = this.messages.filter(m => 
            m.recipientId === currentUser.id && !m.read
        ).length;
        
        this.updateUnreadBadge();
    }
    
    updateUnreadBadge() {
        const badge = document.querySelector('.messages-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    openChatModal() {
        const currentUser = window.sessionManager.getCurrentUser();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const otherUsers = users.filter(u => u.id !== currentUser.id);
        const conversations = this.getConversations(currentUser.id);
        
        const modal = document.createElement('div');
        modal.className = 'modal chat-modal';
        modal.innerHTML = `
            <div class="modal-content chat-content">
                <div class="chat-header">
                    <h3><i class="fas fa-comments"></i> Mensajes</h3>
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-body">
                    <div class="chat-sidebar">
                        <div class="chat-search">
                            <input type="text" placeholder="Buscar usuarios..." class="form-control" id="user-search">
                        </div>
                        
                        <div class="conversations-list">
                            ${conversations.length === 0 ? 
                                '<div class="empty-conversations">No hay conversaciones</div>' :
                                conversations.map(conv => {
                                    const user = users.find(u => u.id === conv.userId);
                                    return `
                                        <div class="conversation-item" data-user-id="${conv.userId}">
                                            <div class="user-avatar">${user?.name?.charAt(0) || '?'}</div>
                                            <div class="conversation-info">
                                                <div class="user-name">${user?.name || 'Usuario'}</div>
                                                <div class="last-message">${conv.lastMessage?.content?.substring(0, 30) || ''}...</div>
                                            </div>
                                            ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
                                        </div>
                                    `;
                                }).join('')
                            }
                        </div>
                        
                        <div class="new-chat-section">
                            <h4>Nuevo Chat</h4>
                            <div class="users-list">
                                ${otherUsers.map(user => `
                                    <div class="user-item" data-user-id="${user.id}">
                                        <div class="user-avatar">${user.name.charAt(0)}</div>
                                        <div class="user-info">
                                            <div class="user-name">${user.name}</div>
                                            <div class="user-role">${this.getRoleLabel(user.role)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="chat-main">
                        <div class="chat-placeholder">
                            <i class="fas fa-comments"></i>
                            <p>Selecciona una conversación para comenzar</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupChatEvents(modal);
    }
    
    setupChatEvents(modal) {
        // Buscar usuarios
        const searchInput = modal.querySelector('#user-search');
        searchInput.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
        
        // Seleccionar usuario para nuevo chat
        modal.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                this.openConversation(userId);
            });
        });
    }
    
    openConversation(userId) {
        const currentUser = window.sessionManager.getCurrentUser();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const otherUser = users.find(u => u.id === userId);
        
        if (!otherUser) return;
        
        const messages = this.messages.filter(m => 
            (m.senderId === currentUser.id && m.recipientId === userId) ||
            (m.senderId === userId && m.recipientId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const chatMain = document.querySelector('.chat-main');
        chatMain.innerHTML = `
            <div class="conversation-header">
                <div class="user-avatar">${otherUser.name.charAt(0)}</div>
                <div class="user-info">
                    <div class="user-name">${otherUser.name}</div>
                    <div class="user-status">En línea</div>
                </div>
            </div>
            
            <div class="messages-container" id="messages-container">
                ${messages.map(message => `
                    <div class="message ${message.senderId === currentUser.id ? 'sent' : 'received'}">
                        <div class="message-content">${message.content}</div>
                        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="message-input-container">
                <input type="text" class="form-control message-input" placeholder="Escribe un mensaje..." id="message-input">
                <button class="btn btn-primary send-btn" data-recipient-id="${userId}">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        // Marcar conversación como leída
        this.markConversationAsRead(userId);
        
        // Scroll al final
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
        
        // Setup envío de mensajes
        this.setupMessageSending(userId);
        
        this.currentConversation = userId;
    }
    
    setupMessageSending(recipientId) {
        const input = document.getElementById('message-input');
        const sendBtn = document.querySelector('.send-btn');
        
        const sendMessage = () => {
            const content = input.value.trim();
            if (!content) return;
            
            this.sendMessage(recipientId, content);
            input.value = '';
            
            // Actualizar vista
            setTimeout(() => {
                this.openConversation(recipientId);
            }, 100);
        };
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    notifyNewMessage(message) {
        if (window.notificationSystem) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const sender = users.find(u => u.id === message.senderId);
            
            window.notificationSystem.addNotification({
                title: `Nuevo mensaje de ${sender?.name || 'Usuario'}`,
                message: message.content.substring(0, 50) + '...',
                type: 'message',
                userId: message.recipientId,
                data: { messageId: message.id, senderId: message.senderId }
            });
        }
    }
    
    getRoleLabel(role) {
        const labels = { admin: 'Administrador', teacher: 'Profesor', student: 'Estudiante' };
        return labels[role] || role;
    }
    
    saveMessages() {
        localStorage.setItem('messages', JSON.stringify(this.messages));
    }
    
    updateConversation(userId) {
        // Actualizar lista de conversaciones si está abierta
        const conversationsList = document.querySelector('.conversations-list');
        if (conversationsList) {
            // Recargar conversaciones
            setTimeout(() => {
                const currentUser = window.sessionManager.getCurrentUser();
                const conversations = this.getConversations(currentUser.id);
                // Actualizar UI...
            }, 100);
        }
    }
}

window.MessagingSystem = MessagingSystem;
}