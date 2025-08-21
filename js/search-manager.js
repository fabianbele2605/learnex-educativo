// Gestor de búsqueda avanzada
class SearchManager {
    constructor() {
        this.searchIndex = new Map();
        this.filters = new Map();
        this.init();
    }

    init() {
        this.buildSearchIndex();
        this.setupSearchUI();
    }

    async buildSearchIndex() {
        try {
            const users = await window.dbAdapter.getUsers();
            const subjects = await window.dbAdapter.getSubjects();
            const grades = await window.dbAdapter.getGrades();

            // Indexar usuarios
            users.forEach(user => {
                this.addToIndex('users', user.id, {
                    ...user,
                    searchText: `${user.name} ${user.email} ${user.role}`.toLowerCase()
                });
            });

            // Indexar materias
            subjects.forEach(subject => {
                this.addToIndex('subjects', subject.id, {
                    ...subject,
                    searchText: `${subject.name} ${subject.area}`.toLowerCase()
                });
            });

            // Indexar notas
            grades.forEach(grade => {
                const user = users.find(u => u.id === grade.student_id);
                const subject = subjects.find(s => s.id === grade.subject_id);
                
                this.addToIndex('grades', grade.id, {
                    ...grade,
                    studentName: user?.name || '',
                    subjectName: subject?.name || '',
                    searchText: `${user?.name || ''} ${subject?.name || ''} ${grade.score} ${grade.period}`.toLowerCase()
                });
            });
        } catch (error) {
            console.error('Error building search index:', error);
        }
    }

    addToIndex(type, id, data) {
        if (!this.searchIndex.has(type)) {
            this.searchIndex.set(type, new Map());
        }
        this.searchIndex.get(type).set(id, data);
    }

    search(query, type = 'all', options = {}) {
        if (!query || query.length < 2) return [];

        const normalizedQuery = query.toLowerCase();
        const results = [];

        const searchTypes = type === 'all' ? ['users', 'subjects', 'grades'] : [type];

        searchTypes.forEach(searchType => {
            const typeIndex = this.searchIndex.get(searchType);
            if (!typeIndex) return;

            typeIndex.forEach((item, id) => {
                if (this.matchesQuery(item, normalizedQuery, options)) {
                    results.push({
                        type: searchType,
                        id,
                        data: item,
                        relevance: this.calculateRelevance(item, normalizedQuery)
                    });
                }
            });
        });

        return results.sort((a, b) => b.relevance - a.relevance);
    }

    matchesQuery(item, query, options) {
        const { exactMatch = false, fields = [] } = options;

        if (fields.length > 0) {
            return fields.some(field => {
                const value = item[field]?.toString().toLowerCase() || '';
                return exactMatch ? value === query : value.includes(query);
            });
        }

        return exactMatch ? 
            item.searchText === query : 
            item.searchText.includes(query);
    }

    calculateRelevance(item, query) {
        let score = 0;
        const searchText = item.searchText;

        // Coincidencia exacta
        if (searchText === query) score += 100;
        
        // Coincidencia al inicio
        if (searchText.startsWith(query)) score += 50;
        
        // Coincidencia en nombre/título
        if (item.name?.toLowerCase().includes(query)) score += 30;
        
        // Coincidencia general
        if (searchText.includes(query)) score += 10;

        return score;
    }

    setupSearchUI() {
        // Crear barra de búsqueda global si no existe
        if (!document.getElementById('global-search')) {
            this.createGlobalSearch();
        }
    }

    createGlobalSearch() {
        const searchHTML = `
            <div id="global-search" class="global-search">
                <div class="search-container">
                    <input type="text" id="search-input" placeholder="Buscar usuarios, materias, notas..." class="search-input">
                    <button id="search-btn" class="search-btn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
                <div id="search-results" class="search-results" style="display: none;"></div>
            </div>
        `;

        // Insertar después del navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.insertAdjacentHTML('afterend', searchHTML);
            this.bindSearchEvents();
        }
    }

    bindSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (!searchInput) return;

        // Búsqueda en tiempo real con debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        // Ocultar resultados al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#global-search')) {
                searchResults.style.display = 'none';
            }
        });

        // Mostrar resultados al enfocar
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                searchResults.style.display = 'block';
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const results = this.search(query);
        this.displayResults(results);
    }

    displayResults(results) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No se encontraron resultados</div>';
            searchResults.style.display = 'block';
            return;
        }

        const html = results.slice(0, 10).map(result => {
            return this.formatResult(result);
        }).join('');

        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    }

    formatResult(result) {
        const { type, data } = result;
        
        switch (type) {
            case 'users':
                return `
                    <div class="search-result-item" data-type="${type}" data-id="${data.id}">
                        <div class="result-icon"><i class="fas fa-user"></i></div>
                        <div class="result-content">
                            <div class="result-title">${data.name}</div>
                            <div class="result-subtitle">${data.email} - ${data.role}</div>
                        </div>
                    </div>
                `;
            case 'subjects':
                return `
                    <div class="search-result-item" data-type="${type}" data-id="${data.id}">
                        <div class="result-icon"><i class="fas fa-book"></i></div>
                        <div class="result-content">
                            <div class="result-title">${data.name}</div>
                            <div class="result-subtitle">${data.area}</div>
                        </div>
                    </div>
                `;
            case 'grades':
                return `
                    <div class="search-result-item" data-type="${type}" data-id="${data.id}">
                        <div class="result-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="result-content">
                            <div class="result-title">${data.studentName} - ${data.subjectName}</div>
                            <div class="result-subtitle">Nota: ${data.score} - ${data.period}</div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    // Filtros avanzados
    addFilter(name, filterFn) {
        this.filters.set(name, filterFn);
    }

    applyFilters(results, activeFilters = []) {
        return results.filter(result => {
            return activeFilters.every(filterName => {
                const filter = this.filters.get(filterName);
                return filter ? filter(result) : true;
            });
        });
    }

    // Exportar resultados
    exportResults(results, format = 'json') {
        const data = results.map(r => r.data);
        
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        
        return JSON.stringify(data, null, 2);
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header] || '').join(','))
        ].join('\n');
        
        return csvContent;
    }
}

window.SearchManager = SearchManager;