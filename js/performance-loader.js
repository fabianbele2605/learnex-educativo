// Sistema de carga optimizada
if (typeof window.PerformanceLoader === 'undefined') {
class PerformanceLoader {
    constructor() {
        this.loadStartTime = performance.now();
        this.criticalResourcesLoaded = false;
        this.init();
    }
    
    init() {
        // Solo medir rendimiento inmediatamente
        this.measurePerformance();
        
        // Optimizaciones en idle time
        requestIdleCallback(() => {
            this.preloadCriticalResources();
            this.optimizeScriptLoading();
        });
    }
    
    preloadCriticalResources() {
        const criticalResources = [
            'css/modern-ui.css',
            'js/auth-manager.js',
            'js/ui-manager.js'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            link.href = resource;
            document.head.appendChild(link);
        });
    }
    
    optimizeScriptLoading() {
        // Cargar scripts no críticos de forma asíncrona
        const nonCriticalScripts = [
            'js/calendar-manager.js',
            'js/modern-animations.js',
            'js/table-filters.js'
        ];
        
        // Cargar después de que el contenido crítico esté listo
        requestIdleCallback(() => {
            nonCriticalScripts.forEach(script => {
                this.loadScriptAsync(script);
            });
        });
    }
    
    loadScriptAsync(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    measurePerformance() {
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.loadStartTime;
            console.log(`🚀 Aplicación cargada en ${loadTime.toFixed(2)}ms`);
            
            // Reportar métricas de rendimiento
            this.reportPerformanceMetrics();
        });
    }
    
    reportPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const metrics = {
                'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
                'TCP Connection': navigation.connectEnd - navigation.connectStart,
                'Request': navigation.responseStart - navigation.requestStart,
                'Response': navigation.responseEnd - navigation.responseStart,
                'DOM Processing': navigation.domContentLoadedEventStart - navigation.responseEnd,
                'Total Load Time': navigation.loadEventEnd - navigation.navigationStart
            };
            
            console.table(metrics);
        }
    }
    
    // Optimizar localStorage
    optimizeStorage() {
        // Comprimir datos grandes
        const compressData = (data) => {
            return JSON.stringify(data);
        };
        
        // Cache inteligente
        const smartCache = {
            set: (key, value, ttl = 3600000) => { // 1 hora por defecto
                const item = {
                    value: compressData(value),
                    timestamp: Date.now(),
                    ttl: ttl
                };
                localStorage.setItem(key, JSON.stringify(item));
            },
            
            get: (key) => {
                const item = localStorage.getItem(key);
                if (!item) return null;
                
                const parsed = JSON.parse(item);
                const now = Date.now();
                
                if (now - parsed.timestamp > parsed.ttl) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return JSON.parse(parsed.value);
            }
        };
        
        window.smartCache = smartCache;
    }
    
    // Lazy loading de componentes
    lazyLoadComponent(selector, loader) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loader();
                    observer.unobserve(entry.target);
                }
            });
        });
        
        const element = document.querySelector(selector);
        if (element) {
            observer.observe(element);
        }
    }
}

// Inicializar optimizador de rendimiento
window.PerformanceLoader = PerformanceLoader;
if (!window.performanceLoader) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.performanceLoader = new PerformanceLoader();
        });
    } else {
        window.performanceLoader = new PerformanceLoader();
    }
}
}