// Sistema de Archivos
if (typeof window.FileSystem === 'undefined') {
class FileSystem {
    constructor() {
        this.files = JSON.parse(localStorage.getItem('files') || '[]');
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="open-files"]')) {
                this.openFileManager();
            }
            if (e.target.matches('[data-action="upload-file"]')) {
                this.openFileUpload();
            }
            if (e.target.matches('[data-action="download-file"]')) {
                const fileId = e.target.dataset.fileId;
                this.downloadFile(fileId);
            }
            if (e.target.matches('[data-action="delete-file"]')) {
                const fileId = e.target.dataset.fileId;
                this.deleteFile(fileId);
            }
            if (e.target.matches('[data-action="preview-file"]')) {
                const fileId = e.target.dataset.fileId;
                this.previewFile(fileId);
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('#file-upload-input')) {
                this.handleFileUpload(e.target.files);
            }
        });
    }
    
    openFileManager() {
        const currentUser = window.sessionManager.getCurrentUser();
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        const userFiles = this.getUserFiles(currentUser.id);
        
        const modal = document.createElement('div');
        modal.className = 'modal file-modal';
        modal.innerHTML = `
            <div class="modal-content file-content">
                <div class="file-header">
                    <h3><i class="fas fa-folder"></i> Biblioteca de Archivos</h3>
                    <div class="file-actions">
                        <button class="btn btn-primary" data-action="upload-file">
                            <i class="fas fa-upload"></i> Subir Archivo
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="file-body">
                    <div class="file-filters">
                        <select id="subject-filter" class="form-control">
                            <option value="">Todas las materias</option>
                            ${subjects.map(subject => 
                                `<option value="${subject.id}">${subject.name}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="type-filter" class="form-control">
                            <option value="">Todos los tipos</option>
                            <option value="document">Documentos</option>
                            <option value="image">Imágenes</option>
                            <option value="presentation">Presentaciones</option>
                        </select>
                    </div>
                    
                    <div class="files-grid" id="files-grid">
                        ${this.renderFilesGrid(userFiles, subjects)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupFileManagerEvents(modal);
    }
    
    renderFilesGrid(files, subjects) {
        if (files.length === 0) {
            return '<div class="empty-files">No hay archivos disponibles</div>';
        }
        
        return files.map(file => {
            const subject = subjects.find(s => s.id === file.subjectId);
            return `
                <div class="file-card" data-file-id="${file.id}">
                    <div class="file-icon">
                        <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-meta">
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                            <span class="file-subject">${subject?.name || 'Sin materia'}</span>
                        </div>
                        <div class="file-date">${new Date(file.uploadDate).toLocaleDateString()}</div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-primary" data-action="preview-file" data-file-id="${file.id}" title="Vista previa">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" data-action="download-file" data-file-id="${file.id}" title="Descargar">
                            <i class="fas fa-download"></i>
                        </button>
                        ${this.canDeleteFile(file) ? `
                            <button class="btn btn-sm btn-danger" data-action="delete-file" data-file-id="${file.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    setupFileManagerEvents(modal) {
        const subjectFilter = modal.querySelector('#subject-filter');
        const typeFilter = modal.querySelector('#type-filter');
        
        const applyFilters = () => {
            const currentUser = window.sessionManager.getCurrentUser();
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            let files = this.getUserFiles(currentUser.id);
            
            if (subjectFilter.value) {
                files = files.filter(f => f.subjectId === subjectFilter.value);
            }
            
            if (typeFilter.value) {
                files = files.filter(f => this.getFileCategory(f.type) === typeFilter.value);
            }
            
            const grid = modal.querySelector('#files-grid');
            grid.innerHTML = this.renderFilesGrid(files, subjects);
        };
        
        subjectFilter.addEventListener('change', applyFilters);
        typeFilter.addEventListener('change', applyFilters);
    }
    
    openFileUpload() {
        const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
        
        const modal = document.createElement('div');
        modal.className = 'modal upload-modal';
        modal.innerHTML = `
            <div class="modal-content upload-content">
                <div class="upload-header">
                    <h3><i class="fas fa-upload"></i> Subir Archivo</h3>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="upload-body">
                    <div class="upload-zone" id="upload-zone">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                        <p class="upload-info">Máximo 5MB - PDF, Word, Excel, PowerPoint, Imágenes</p>
                        <input type="file" id="file-upload-input" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt">
                    </div>
                    
                    <div class="upload-options">
                        <div class="form-group">
                            <label>Materia:</label>
                            <select id="upload-subject" class="form-control">
                                <option value="">Sin materia específica</option>
                                ${subjects.map(subject => 
                                    `<option value="${subject.id}">${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Descripción (opcional):</label>
                            <textarea id="upload-description" class="form-control" rows="3" placeholder="Descripción del archivo..."></textarea>
                        </div>
                    </div>
                    
                    <div class="upload-progress" id="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupUploadEvents(modal);
    }
    
    setupUploadEvents(modal) {
        const uploadZone = modal.querySelector('#upload-zone');
        const fileInput = modal.querySelector('#file-upload-input');
        
        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
        
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    async handleFileUpload(files) {
        const subjectId = document.getElementById('upload-subject')?.value || null;
        const description = document.getElementById('upload-description')?.value || '';
        const currentUser = window.sessionManager.getCurrentUser();
        
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validaciones
            if (!this.validateFile(file)) {
                continue;
            }
            
            // Simular progreso de subida
            const progress = ((i + 1) / files.length) * 100;
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressText) progressText.textContent = Math.round(progress) + '%';
            
            // Convertir archivo a base64 para almacenamiento
            const fileData = await this.fileToBase64(file);
            
            const fileRecord = {
                id: Date.now().toString() + '_' + i,
                name: file.name,
                type: file.type,
                size: file.size,
                data: fileData,
                subjectId: subjectId,
                description: description,
                uploaderId: currentUser.id,
                uploadDate: new Date().toISOString(),
                shared: true // Por defecto compartido
            };
            
            this.files.push(fileRecord);
            
            // Pequeña pausa para mostrar progreso
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        this.saveFiles();
        
        // Notificar éxito
        if (window.notificationSystem) {
            window.notificationSystem.addNotification({
                title: 'Archivos subidos',
                message: `${files.length} archivo(s) subido(s) correctamente`,
                type: 'success'
            });
        }
        
        // Cerrar modal
        setTimeout(() => {
            const modal = document.querySelector('.upload-modal');
            if (modal) modal.remove();
        }, 1000);
    }
    
    validateFile(file) {
        if (file.size > this.maxFileSize) {
            alert(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`);
            return false;
        }
        
        if (!this.allowedTypes.includes(file.type)) {
            alert(`Tipo de archivo no permitido: ${file.name}`);
            return false;
        }
        
        return true;
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    downloadFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;
        
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    previewFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal preview-modal';
        
        let previewContent = '';
        
        if (file.type.startsWith('image/')) {
            previewContent = `<img src="${file.data}" alt="${file.name}" class="preview-image">`;
        } else if (file.type === 'application/pdf') {
            previewContent = `<iframe src="${file.data}" class="preview-pdf"></iframe>`;
        } else if (file.type === 'text/plain') {
            // Para archivos de texto, necesitaríamos decodificar el base64
            previewContent = `<div class="preview-text">Vista previa no disponible para este tipo de archivo</div>`;
        } else {
            previewContent = `<div class="preview-unavailable">
                <i class="fas fa-file"></i>
                <p>Vista previa no disponible</p>
                <button class="btn btn-primary" data-action="download-file" data-file-id="${fileId}">
                    <i class="fas fa-download"></i> Descargar para ver
                </button>
            </div>`;
        }
        
        modal.innerHTML = `
            <div class="modal-content preview-content">
                <div class="preview-header">
                    <h3>${file.name}</h3>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-body">
                    ${previewContent}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    deleteFile(fileId) {
        if (!confirm('¿Estás seguro de eliminar este archivo?')) return;
        
        this.files = this.files.filter(f => f.id !== fileId);
        this.saveFiles();
        
        // Actualizar UI
        const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileCard) {
            fileCard.remove();
        }
        
        if (window.notificationSystem) {
            window.notificationSystem.addNotification({
                title: 'Archivo eliminado',
                message: 'El archivo ha sido eliminado correctamente',
                type: 'info'
            });
        }
    }
    
    getUserFiles(userId) {
        const currentUser = window.sessionManager.getCurrentUser();
        
        // Admins ven todos los archivos
        if (currentUser.role === 'admin') {
            return this.files;
        }
        
        // Profesores ven archivos de sus materias + archivos compartidos
        if (currentUser.role === 'teacher') {
            const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
            const mySubjects = subjects.filter(s => s.teacher === currentUser.name);
            const mySubjectIds = mySubjects.map(s => s.id);
            
            return this.files.filter(f => 
                f.uploaderId === userId || 
                f.shared || 
                mySubjectIds.includes(f.subjectId)
            );
        }
        
        // Estudiantes ven solo archivos compartidos + sus propios archivos
        return this.files.filter(f => 
            f.uploaderId === userId || f.shared
        );
    }
    
    canDeleteFile(file) {
        const currentUser = window.sessionManager.getCurrentUser();
        return currentUser.role === 'admin' || file.uploaderId === currentUser.id;
    }
    
    getFileIcon(type) {
        if (type.startsWith('image/')) return 'image';
        if (type === 'application/pdf') return 'file-pdf';
        if (type.includes('word')) return 'file-word';
        if (type.includes('excel') || type.includes('sheet')) return 'file-excel';
        if (type.includes('powerpoint') || type.includes('presentation')) return 'file-powerpoint';
        if (type === 'text/plain') return 'file-alt';
        return 'file';
    }
    
    getFileCategory(type) {
        if (type.startsWith('image/')) return 'image';
        if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
        return 'document';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    saveFiles() {
        localStorage.setItem('files', JSON.stringify(this.files));
    }
}

window.FileSystem = FileSystem;
}