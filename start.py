import os
import sys
import subprocess
import webbrowser
import time
import socket

def kill_process_on_port(port):
    """Mata procesos en el puerto especificado (Windows)"""
    try:
        result = subprocess.run(
            ["netstat", "-ano", "|", "findstr", f":{port}"], 
            capture_output=True, 
            text=True, 
            shell=True
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if f":{port}" in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        print(f"🔫 Matando proceso {pid} en puerto {port}")
                        subprocess.run(["taskkill", "/PID", pid, "/F"], 
                                     capture_output=True)
                        time.sleep(1)
    except Exception as e:
        print(f"⚠️ No se pudo matar proceso en puerto {port}: {e}")

def is_port_in_use(port):
    """Verifica si un puerto está en uso"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def start_application():
    print("🔐 CRIPTOPEDIA UNIVERSAL - YOUTUBE API REAL")
    print("=" * 60)
    
    # Matar procesos en puertos 8000 y 3000
    print("🔄 Limpiando puertos...")
    kill_process_on_port(8000)
    kill_process_on_port(3000)
    
    time.sleep(2)
    
    # Verificar puertos
    if is_port_in_use(8000) or is_port_in_use(3000):
        print("❌ ERROR: Puertos todavía en uso")
        print("💡 Cierra VS Code completamente y vuelve a abrirlo")
        return
    
    print("✅ Puertos limpios")
    
    # Iniciar backend
    print("🚀 Iniciando backend con YouTube API REAL...")
    backend_process = subprocess.Popen(
        [sys.executable, "backend/main.py"],
        cwd=os.getcwd()
    )
    
    time.sleep(3)
    
    # Iniciar frontend
    print("🌐 Iniciando frontend...")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "3000", "--directory", "frontend"],
        cwd=os.getcwd()
    )
    
    time.sleep(2)
    print("✅ APLICACIÓN EJECUTÁNDOSE:")
    print("   📍 Backend:  http://localhost:8000")
    print("   📍 Frontend: http://localhost:3000")
    print("   🔐 Admin:    usuario=admin, contraseña=admin123")
    print("   ✏️  Modo edición: CREAR/EDITAR/ELIMINAR algoritmos (REAL)")
    print("   🧠 YouTube API: Búsqueda REAL de videos")
    print("   🎯 Prueba: Haz login y agrega un algoritmo personalizado")
    
    webbrowser.open("http://localhost:3000")
    
    print("\n⏹️  Para detener: Presiona Ctrl + C")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo aplicación...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("✅ Aplicación detenida")

if __name__ == "__main__":
    if not os.path.exists("backend") or not os.path.exists("frontend"):
        print("❌ ERROR: No se encuentran las carpetas 'backend' y 'frontend'")
        print("💡 Asegúrate de que la estructura de carpetas sea correcta")
        sys.exit(1)
    
    start_application()