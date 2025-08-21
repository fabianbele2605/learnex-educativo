// Gestor de estados de carga
class LoadingManager {
    static show(target = 'body', message = 'Cargando...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        if (target === 'body') {
            document.body.appendChild(loader);
        } else {
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            if (element) {
                element.style.position = 'relative';
                element.appendChild(loader);
            }
        }
    }

    static hide(target = 'body') {
        const selector = target === 'body' ? 'body > .loading-overlay' : '.loading-overlay';
        const loader = document.querySelector(selector);
        if (loader) {
            loader.remove();
        }
    }

    static async wrap(asyncFunction, target = 'body', message = 'Cargando...') {
        this.show(target, message);
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            this.hide(target);
        }
    }
}

window.LoadingManager = LoadingManager;