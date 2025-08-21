/**
 * Optimizador de rendimiento para la aplicación
 * Incluye lazy loading, cache, compresión y otras optimizaciones
 */
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.imageCache = new Map();
        this.requestQueue = new Map();
        this.observers = new Map();
        this.performanceMetrics = {
            loadTime: 0,
            renderTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupRequestCache();
        this.setupImageOptimization();
        this.setupPerformanceMonitoring();
        this.setupResourcePreloading();
        this.optimizeDOM();
        
        // Limpiar cache periódicamente
        setInterval(() => this.cleanupCache(), 300000); // 5 minutos
    }

    // === LAZY LOADING ===
    setupLazyLoading() {
        // Lazy loading para imágenes
        this.setupImageLazyLoading();
        
        // Lazy loading para contenido
        this.setupContentLazyLoading();
        
        // Lazy loading para componentes
        this.setupComponentLazyLoading();
        
        // Lazy loading para secciones
        this.setupSectionLazyLoading();
    }

    setupImageLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        this.observers.set('images', imageObserver);
        this.observeImages();
    }

    setupContentLazyLoading() {
        const contentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    this.loadContent(element);
                    contentObserver.unobserve(element);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        this.observers.set('content', contentObserver);
    }

    setupComponentLazyLoading() {
        // Lazy loading para tablas grandes
        this.setupTableLazyLoading();
    }
    
    setupSectionLazyLoading() {
        this.sectionCache = new Map();
    }
    
    lazyLoadSection(sectionName, loader) {
        if (this.sectionCache.has(sectionName)) {
            return Promise.resolve(this.sectionCache.get(sectionName));
        }
        
        return loader().then(result => {
            this.sectionCache.set(sectionName, result);
            return result;
        });
    }

    // === CACHE SYSTEM ===
    setupRequestCache() {
        // Interceptar fetch requests para cache
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const cacheKey = this.generateCacheKey(url, options);
            
            // Verificar cache para GET requests
            if (!options.method || options.method.toUpperCase() === 'GET') {
                const cached = this.getFromCache(cacheKey);
                if (cached && !this.isCacheExpired(cached)) {
                    this.performanceMetrics.cacheHits++;
                    return Promise.resolve(new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                }
            }
            
            // Evitar requests duplicados
            if (this.requestQueue.has(cacheKey)) {
                return this.requestQueue.get(cacheKey);
            }
            
            const requestPromise = originalFetch(url, options)
                .then(response => {
                    this.requestQueue.delete(cacheKey);
                    
                    // Cache successful GET responses
                    if (response.ok && (!options.method || options.method.toUpperCase() === 'GET')) {
                        response.clone().json().then(data => {
                            this.setCache(cacheKey, data);
                        }).catch(() => {});
                    }
                    
                    return response;
                })
                .catch(error => {
                    this.requestQueue.delete(cacheKey);
                    throw error;
                });
            
            this.requestQueue.set(cacheKey, requestPromise);
            this.performanceMetrics.cacheMisses++;
            return requestPromise;
        };
    }

    // === IMAGE OPTIMIZATION ===
    setupImageOptimization() {
        // Precargar imágenes críticas
        this.preloadCriticalImages();
        
        // Optimizar formato de imágenes
        this.optimizeImageFormats();
    }

    loadImage(img) {
        const src = img.dataset.src || img.dataset.lazySrc;
        if (!src) return;
        
        // Verificar cache de imágenes
        if (this.imageCache.has(src)) {
            img.src = this.imageCache.get(src);
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            return;
        }
        
        img.classList.add('lazy-loading');
        
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            this.imageCache.set(src, src);
        };
        
        tempImg.onerror = () => {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
        };
        
        tempImg.src = src;
    }

    // === PERFORMANCE MONITORING ===
    setupPerformanceMonitoring() {
        // Medir tiempo de carga inicial
        window.addEventListener('load', () => {
            this.performanceMetrics.loadTime = performance.now();
        });
        
        // Medir tiempo de renderizado
        this.measureRenderTime();
        
        // Monitorear memoria
        this.monitorMemoryUsage();
    }

    measureRenderTime() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.entryType === 'measure') {
                    this.performanceMetrics.renderTime = entry.duration;
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure'] });
    }

    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected, cleaning up...');
                    this.cleanupCache();
                    this.cleanupDOM();
                }
            }, 30000); // Cada 30 segundos
        }
    }

    // === RESOURCE PRELOADING ===
    setupResourcePreloading() {
        // Precargar recursos críticos
        this.preloadCriticalResources();
        
        // Precargar rutas probables
        this.preloadLikelyRoutes();
    }

    preloadCriticalResources() {
        // Usamos los métodos locales en lugar de peticiones API
        window.sessionManager.getCurrentUser();
        window.dbAdapter.getSubjects();
        
        // Precargamos solo los recursos estáticos
        const staticResources = [
            'js/utils.js',
            'js/handlers.js'
        ];
        
        staticResources.forEach(resource => {
            this.preloadStaticResource(resource);
        });
    }

    getRoutePreloadData(route) {
        // Mapa de rutas con sus datos correspondientes usando métodos locales
        const routeMap = {
            '/dashboard': () => {
                window.sessionManager.getCurrentUser();
                window.dbAdapter.getSubjects();
            },
            '/subjects': () => {
                window.dbAdapter.getSubjects();
                window.dbAdapter.getUsers();
            },
            '/grades': () => {
                window.dbAdapter.getGrades();
                window.dbAdapter.getSubjects();
            },
            '/users': () => {
                window.dbAdapter.getUsers();
            }
        };
        
        // Ejecutamos la función correspondiente a la ruta si existe
        if (routeMap[route]) {
            routeMap[route]();
        }
        
        return []; // Ya no necesitamos devolver rutas de API
    }

    preloadApiData(url) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const cacheKey = this.generateCacheKey(url, {});
                this.setCache(cacheKey, data);
            })
            .catch(() => {}); // Silenciar errores de precarga
    }

    preloadStaticResource(url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = url.endsWith('.js') ? 'script' : 'fetch';
        document.head.appendChild(link);
    }

    // === DOM OPTIMIZATION ===
    optimizeDOM() {
        // Optimizar eventos
        this.optimizeEventListeners();
        
        // Optimizar animaciones
        this.optimizeAnimations();
        
        // Debounce scroll events
        this.optimizeScrollEvents();
    }

    optimizeEventListeners() {
        // Usar delegación de eventos para elementos dinámicos
        document.addEventListener('click', this.handleDelegatedClick.bind(this));
        document.addEventListener('input', this.handleDelegatedInput.bind(this));
    }

    handleDelegatedClick(e) {
        // Manejar clicks de manera eficiente
        if (e.target.matches('.btn[data-action]')) {
            const action = e.target.dataset.action;
            this.executeAction(action, e.target);
        }
    }

    handleDelegatedInput(e) {
        // Debounce input events
        if (e.target.matches('input[type="search"], input[data-search]')) {
            this.debounce(() => {
                this.handleSearch(e.target.value);
            }, 300)();
        }
    }

    optimizeAnimations() {
        // Usar requestAnimationFrame para animaciones
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach(element => {
            this.setupOptimizedAnimation(element);
        });
    }

    optimizeScrollEvents() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleOptimizedScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    handleOptimizedScroll() {
        // Implementar lógica de scroll optimizado
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Actualizar elementos visibles basado en scroll
        this.updateVisibleElements(scrollTop, windowHeight);
    }

    loadContent(element) {
        const content = element.dataset.lazyContent;
        if (content) {
            element.innerHTML = content;
            element.classList.add('content-loaded');
        }
    }

    executeAction(action, element) {
        // Ejecutar acciones delegadas
        console.log('Executing action:', action, element);
    }

    handleSearch(query) {
        // Manejar búsqueda optimizada
        console.log('Search query:', query);
    }

    setupOptimizedAnimation(element) {
        // Configurar animación optimizada
        element.style.willChange = 'transform, opacity';
    }

    preloadCriticalImages() {
        const criticalImages = document.querySelectorAll('img[data-critical]');
        criticalImages.forEach(img => {
            const src = img.dataset.src || img.src;
            if (src) {
                const preloadImg = new Image();
                preloadImg.src = src;
            }
        });
    }

    optimizeImageFormats() {
        // Optimizar formatos de imagen según soporte del navegador
        const supportsWebP = this.supportsWebP();
        const images = document.querySelectorAll('img[data-webp]');
        
        images.forEach(img => {
            if (supportsWebP && img.dataset.webp) {
                img.src = img.dataset.webp;
            }
        });
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    preloadLikelyRoutes() {
        // Precargar rutas probables basadas en el comportamiento del usuario
        const currentPath = window.location.pathname;
        const likelyRoutes = this.getLikelyRoutes(currentPath);
        
        likelyRoutes.forEach(route => {
            setTimeout(() => this.preloadRoute(route), 2000);
        });
    }

    getLikelyRoutes(currentPath) {
        const routeMap = {
            '/': ['/dashboard', '/login'],
            '/dashboard': ['/subjects', '/grades'],
            '/subjects': ['/grades', '/reports'],
            '/grades': ['/subjects', '/reports']
        };
        
        return routeMap[currentPath] || [];
    }

    updateVisibleElements(scrollTop, windowHeight) {
        // Actualizar elementos visibles durante el scroll
        const elements = document.querySelectorAll('[data-scroll-optimize]');
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < windowHeight && rect.bottom > 0;
            
            if (isVisible) {
                element.classList.add('in-viewport');
            } else {
                element.classList.remove('in-viewport');
            }
        });
    }

    // === UTILITY METHODS ===
    generateCacheKey(url, options) {
        return `${url}_${JSON.stringify(options)}`;
    }

    setCache(key, data, ttl = 300000) { // 5 minutos por defecto
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    getFromCache(key) {
        return this.cache.get(key);
    }

    isCacheExpired(cached) {
        return Date.now() - cached.timestamp > cached.ttl;
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (this.isCacheExpired(cached)) {
                this.cache.delete(key);
            }
        }
        
        // Limpiar cache de imágenes si es muy grande
        if (this.imageCache.size > 50) {
            const entries = Array.from(this.imageCache.entries());
            const toDelete = entries.slice(0, entries.length - 30);
            toDelete.forEach(([key]) => this.imageCache.delete(key));
        }
    }

    cleanupDOM() {
        // Remover elementos no visibles
        const hiddenElements = document.querySelectorAll('[style*="display: none"]');
        hiddenElements.forEach(element => {
            if (!element.dataset.keepHidden) {
                element.remove();
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // === PUBLIC METHODS ===
    observeImages() {
        const images = document.querySelectorAll('img[data-src], img[data-lazy-src]');
        const observer = this.observers.get('images');
        
        images.forEach(img => {
            img.classList.add('lazy');
            observer.observe(img);
        });
    }

    observeContent(elements) {
        const observer = this.observers.get('content');
        elements.forEach(element => observer.observe(element));
    }

    preloadRoute(route) {
        // Precargar datos para una ruta específica
        const routeData = this.getRoutePreloadData(route);
        if (routeData) {
            routeData.forEach(url => this.preloadApiData(url));
        }
    }

    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.cache.size,
            imageCacheSize: this.imageCache.size,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    // Método para optimizar tablas grandes
    setupTableLazyLoading() {
        const tables = document.querySelectorAll('.table[data-lazy]');
        tables.forEach(table => {
            this.virtualizeTable(table);
        });
    }

    virtualizeTable(table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length <= 20) return; // No virtualizar tablas pequeñas
        
        const container = document.createElement('div');
        container.className = 'table-virtual-container';
        container.style.height = '400px';
        container.style.overflow = 'auto';
        
        table.parentNode.insertBefore(container, table);
        container.appendChild(table);
        
        this.implementVirtualScrolling(container, table, rows);
    }

    implementVirtualScrolling(container, table, rows) {
        const rowHeight = 40; // Altura estimada de fila
        const visibleRows = Math.ceil(container.clientHeight / rowHeight) + 5;
        let startIndex = 0;
        
        const updateVisibleRows = () => {
            const scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / rowHeight);
            const endIndex = Math.min(startIndex + visibleRows, rows.length);
            
            // Ocultar todas las filas
            rows.forEach(row => row.style.display = 'none');
            
            // Mostrar filas visibles
            for (let i = startIndex; i < endIndex; i++) {
                if (rows[i]) {
                    rows[i].style.display = '';
                }
            }
        };
        
        container.addEventListener('scroll', this.throttle(updateVisibleRows, 16));
        updateVisibleRows();
    }
}

// CSS para lazy loading y optimizaciones
const performanceStyles = `
/* Lazy loading styles */
.lazy {
    opacity: 0;
    transition: opacity 0.3s;
}

.lazy-loading {
    opacity: 0.5;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

.lazy-loaded {
    opacity: 1;
}

.lazy-error {
    opacity: 0.3;
    background: #f8f9fa;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Performance optimizations */
.table-virtual-container {
    position: relative;
}

.performance-indicator {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
    display: none;
}

.performance-indicator.show {
    display: block;
}

/* Optimized animations */
.optimized-fade {
    transition: opacity 0.3s ease;
}

.optimized-slide {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Memory efficient styles */
.will-change-transform {
    will-change: transform;
}

.will-change-opacity {
    will-change: opacity;
}

/* Remove will-change after animation */
.animation-complete {
    will-change: auto;
}
`;

// Inyectar estilos
const performanceStyleSheet = document.createElement('style');
performanceStyleSheet.textContent = performanceStyles;
document.head.appendChild(performanceStyleSheet);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceOptimizer = new PerformanceOptimizer();
    });
} else {
    window.performanceOptimizer = new PerformanceOptimizer();
}

// Exportar para uso global
window.PerformanceOptimizer = PerformanceOptimizer;