// Sistema de filtros para tablas
if (typeof window.TableFilters === 'undefined') {
class TableFilters {
    constructor(tableSelector, options = {}) {
        this.table = document.querySelector(tableSelector);
        this.options = {
            searchPlaceholder: 'Buscar...',
            showRowCount: true,
            ...options
        };
        this.originalRows = [];
        this.init();
    }
    
    init() {
        if (!this.table) return;
        
        this.createFilterControls();
        this.storeOriginalRows();
        this.bindEvents();
    }
    
    createFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'table-filters';
        filterContainer.innerHTML = `
            <div class="filter-controls">
                <div class="search-box">
                    <input type="text" class="filter-search" placeholder="${this.options.searchPlaceholder}">
                    <i class="fas fa-search"></i>
                </div>
                ${this.options.showRowCount ? '<div class="row-count">Mostrando <span class="count">0</span> registros</div>' : ''}
            </div>
        `;
        
        this.table.parentNode.insertBefore(filterContainer, this.table);
        this.filterContainer = filterContainer;
        this.searchInput = filterContainer.querySelector('.filter-search');
        this.rowCount = filterContainer.querySelector('.count');
    }
    
    storeOriginalRows() {
        const tbody = this.table.querySelector('tbody');
        if (tbody) {
            this.originalRows = Array.from(tbody.querySelectorAll('tr'));
            this.updateRowCount();
        }
    }
    
    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.filterRows(e.target.value);
            });
        }
    }
    
    filterRows(searchTerm) {
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;
        
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;
        
        this.originalRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const isVisible = !term || text.includes(term);
            
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });
        
        this.updateRowCount(visibleCount);
    }
    
    updateRowCount(count = null) {
        if (this.rowCount) {
            const displayCount = count !== null ? count : this.originalRows.length;
            this.rowCount.textContent = displayCount;
        }
    }
    
    refresh() {
        this.storeOriginalRows();
        if (this.searchInput) {
            this.filterRows(this.searchInput.value);
        }
    }
}

window.TableFilters = TableFilters;
}