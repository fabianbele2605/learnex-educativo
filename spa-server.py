#!/usr/bin/env python3
"""
Servidor HTTP simple para SPA (Single Page Application)
Redirecciona todas las rutas no encontradas al index.html
"""

import http.server
import socketserver
import os   
import signal
import webbrowser
from urllib.parse import urlparse, parse_qs

# Manejar la señal de interrupción (Ctrl+C)
def signal_handler(sig, frame):
    print("\nDeteniendo el servidor...")
    os._exit(0)

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Mostrar logs de requests para debug
        print(f"[{self.address_string()}] {format % args}")
    
    def do_GET(self):
        # Parse the URL and query parameters
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Ignorar parámetros de consulta para la comparación de rutas
        base_path = path.split('?')[0]
        
        # Lista de rutas de la SPA
        spa_routes = ['/', '/login', '/register', '/dashboard', '/subjects', '/grades', '/reports', '/users']
        
        # Si es un archivo estático (con extensión), intentar servirlo
        if '.' in os.path.basename(base_path):
            try:
                return super().do_GET()
            except:
                # Si el archivo no existe, servir index.html para rutas SPA
                if base_path in spa_routes:
                    self.path = '/index.html'
                    return super().do_GET()
                # Para otros archivos, dejar que maneje el 404
                return super().do_GET()
        
        # Para rutas SPA, servir index.html
        if base_path in spa_routes:
            self.path = '/index.html'
        
        return super().do_GET()

if __name__ == '__main__':
    PORT = 8000
    Handler = SPAHandler
    
    # Registrar el manejador de señal para Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    # Asegurarse de que el directorio de trabajo sea el correcto
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    # Permitir reutilizar el puerto
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"Servidor SPA ejecutándose en {url}")
        print(f"También disponible en: http://127.0.0.1:{PORT}/")
        print("Presiona Ctrl+C para detener el servidor")
        
        # Abrir en Google Chrome
        try:
            webbrowser.get('chrome').open(url)
        except:
            # Si Chrome no está disponible, usar navegador predeterminado
            webbrowser.open(url)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")
            httpd.server_close()
            os._exit(0)