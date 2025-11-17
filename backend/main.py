from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import requests
import os
from typing import List

app = FastAPI(
    title="Criptopedia Universal API",
    description="API para enciclopedia de algoritmos criptográficos con IA",
    version="3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuración para producción
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "AIzaSyDNphleDorA8eYwvZ9KFLgb7_5KKad-8Bk")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://criptopedia-frontend.onrender.com")

# CORS configurado para producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000", 
        "https://criptopedia-frontend.onrender.com",
        "https://criptopedia-frontend.onrender.com/",
        FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos
class Algorithm(BaseModel):
    id: str
    name: str
    category: str
    description: str
    encryption_example: str
    decryption_example: str
    key_type: str
    difficulty: str

class LoginRequest(BaseModel):
    username: str
    password: str

class VideoRequest(BaseModel):
    algorithm: str

# Base de datos en memoria
algorithms_data = [
    {
        "id": "cesar",
        "name": "Cifrado César",
        "category": "Criptografía Clásica",
        "description": "Cifrado por desplazamiento simple usado por Julio César.",
        "encryption_example": "HOLA → KROD (clave 3)",
        "decryption_example": "KROD → HOLA (clave 3)",
        "key_type": "Número entero",
        "difficulty": "Principiante"
    },
    {
        "id": "vigenere", 
        "name": "Cifrado Vigenère",
        "category": "Criptografía Clásica",
        "description": "Cifrado polialfabético más seguro que César.",
        "encryption_example": "HELLO → XMCKL (clave KEY)",
        "decryption_example": "XMCKL → HELLO (clave KEY)",
        "key_type": "Palabra clave",
        "difficulty": "Intermedio"
    },
    {
        "id": "base64",
        "name": "Codificación Base64",
        "category": "Codificación",
        "description": "Convierte datos binarios en texto ASCII.",
        "encryption_example": "Hola → SG9sYQ==",
        "decryption_example": "SG9sYQ== → Hola",
        "key_type": "No aplica",
        "difficulty": "Principiante"
    },
    {
        "id": "rsa",
        "name": "Algoritmo RSA", 
        "category": "Criptografía Asimétrica",
        "description": "Cifrado de clave pública ampliamente usado.",
        "encryption_example": "Mensaje con clave pública",
        "decryption_example": "Mensaje con clave privada", 
        "key_type": "Par de claves",
        "difficulty": "Avanzado"
    }
]

# 🧠 IA de YouTube Real
class YouTubeRealIA:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://www.googleapis.com/youtube/v3/search"
    
    def buscar_videos(self, algoritmo_id, algoritmo_nombre):
        """Búsqueda REAL en YouTube usando API"""
        
        # Generar términos de búsqueda inteligentes
        terminos_busqueda = self._generar_terminos_busqueda(algoritmo_id, algoritmo_nombre)
        
        videos_encontrados = []
        
        # Probar cada término de búsqueda
        for termino in terminos_busqueda[:2]:
            if len(videos_encontrados) >= 3:
                break
                
            try:
                videos = self._buscar_youtube_api(termino)
                if videos:
                    videos_encontrados.extend(videos)
            except Exception as e:
                print(f"Error en búsqueda: {e}")
                continue
        
        # Si no encontramos videos, usar respaldo
        if not videos_encontrados:
            return self._videos_respaldo(algoritmo_id, algoritmo_nombre)
        
        return videos_encontrados[:3]

    def _generar_terminos_busqueda(self, algoritmo_id, algoritmo_nombre):
        """Generar términos de búsqueda inteligentes"""
        
        terminos_especificos = {
            "cesar": [
                "cifrado cesar explicación completa español",
                "algoritmo cesar criptografía clásica tutorial",
                "cifrado por desplazamiento julio cesar"
            ],
            "vigenere": [
                "cifrado vigenere explicación detallada español", 
                "algoritmo vigenere criptografía polialfabética",
                "cifrado vigenere tabla implementación"
            ],
            "base64": [
                "codificación base64 explicación completa español",
                "que es base64 como funciona programación",
                "base64 encode decode tutorial ejemplos"
            ],
            "rsa": [
                "algoritmo rsa criptografía asimétrica explicación",
                "rsa encryption claves pública privada",
                "como funciona rsa criptografía matemática"
            ]
        }
        
        # Si es un algoritmo conocido, usar términos específicos
        if algoritmo_id in terminos_especificos:
            return terminos_especificos[algoritmo_id]
        
        # Para algoritmos personalizados, generar términos genéricos
        return [
            f"{algoritmo_nombre} cifrado explicación completa español",
            f"algoritmo {algoritmo_nombre} criptografía tutorial",
            f"como funciona {algoritmo_nombre} encryption"
        ]

    def _buscar_youtube_api(self, query):
        """Búsqueda REAL en YouTube usando API"""
        try:
            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'maxResults': 2,
                'key': self.api_key,
                'relevanceLanguage': 'es',
                'videoDuration': 'medium',
                'safeSearch': 'strict'
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            data = response.json()
            
            if response.status_code != 200:
                print(f"Error API YouTube: {data.get('error', {}).get('message', 'Error desconocido')}")
                return []
            
            videos = []
            for item in data.get('items', []):
                video_data = {
                    'title': item['snippet']['title'],
                    'video_id': item['id']['videoId'],
                    'channel': item['snippet']['channelTitle'],
                    'thumbnail': item['snippet']['thumbnails']['medium']['url'],
                    'search_term': query,
                    'api_real': True
                }
                videos.append(video_data)
            
            return videos
            
        except Exception as e:
            print(f"Excepción en búsqueda YouTube: {e}")
            return []

    def _videos_respaldo(self, algoritmo_id, algoritmo_nombre):
        """Videos de respaldo para cuando la API falla"""
        return [
            {
                "title": f"Introducción a {algoritmo_nombre} - Criptografía",
                "video_id": "sMOZf4GN3oc",
                "channel": "Criptopedia Universal",
                "thumbnail": "https://i.ytimg.com/vi/sMOZf4GN3oc/mqdefault.jpg",
                "search_term": algoritmo_nombre,
                "fallback": True
            }
        ]

# Inicializar IA con API key
youtube_ia = YouTubeRealIA(YOUTUBE_API_KEY)

# Endpoints
@app.get("/")
def root():
    return {
        "message": "Criptopedia API funcionando en producción",
        "status": "active", 
        "version": "3.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Criptopedia API"}

@app.get("/algorithms")
def get_algorithms():
    return algorithms_data

@app.get("/algorithms/{algorithm_id}")
def get_algorithm(algorithm_id: str):
    for algo in algorithms_data:
        if algo["id"] == algorithm_id:
            return algo
    raise HTTPException(status_code=404, detail="Algoritmo no encontrado")

@app.post("/auth/login")
def login(credentials: LoginRequest):
    if credentials.username == "admin" and credentials.password == "admin123":
        return {"success": True, "user": {"username": "admin"}}
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")

@app.get("/auth/check")
def check_auth():
    return {"authenticated": True}

@app.post("/videos/search")
def search_videos(request: VideoRequest):
    """IA que encuentra videos REALES en YouTube"""
    
    # Buscar información del algoritmo
    algoritmo_info = next((algo for algo in algorithms_data if algo["id"] == request.algorithm), None)
    algoritmo_nombre = algoritmo_info["name"] if algoritmo_info else request.algorithm
    
    # Usar IA para buscar videos en YouTube
    videos = youtube_ia.buscar_videos(request.algorithm, algoritmo_nombre)
    
    return {
        "status": "success", 
        "algorithm": request.algorithm,
        "algorithm_name": algoritmo_nombre,
        "videos": videos,
        "total_results": len(videos),
        "youtube_api": "ACTIVA"
    }

# Endpoints de administración
@app.post("/admin/algorithms")
def create_algorithm(algorithm: Algorithm):
    """Crear nuevo algoritmo"""
    # Verificar si el ID ya existe
    for algo in algorithms_data:
        if algo["id"] == algorithm.id:
            raise HTTPException(status_code=400, detail="El ID del algoritmo ya existe")
    
    # Agregar el nuevo algoritmo
    algorithms_data.append(algorithm.dict())
    
    return {
        "success": True,
        "message": "Algoritmo creado exitosamente",
        "algorithm": algorithm.dict()
    }

@app.put("/admin/algorithms/{algorithm_id}")
def update_algorithm(algorithm_id: str, algorithm: Algorithm):
    """Actualizar algoritmo"""
    for i, algo in enumerate(algorithms_data):
        if algo["id"] == algorithm_id:
            algorithms_data[i] = algorithm.dict()
            return {
                "success": True, 
                "message": f"Algoritmo {algorithm_id} actualizado",
                "algorithm": algorithm.dict()
            }
    
    raise HTTPException(status_code=404, detail="Algoritmo no encontrado")

@app.delete("/admin/algorithms/{algorithm_id}")
def delete_algorithm(algorithm_id: str):
    """Eliminar algoritmo"""
    for i, algo in enumerate(algorithms_data):
        if algo["id"] == algorithm_id:
            deleted_algo = algorithms_data.pop(i)
            return {
                "success": True,
                "message": f"Algoritmo {algorithm_id} eliminado",
                "algorithm": deleted_algo
            }
    
    raise HTTPException(status_code=404, detail="Algoritmo no encontrado")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Iniciando Criptopedia Universal en puerto {port}")
    print(f"📚 Algoritmos disponibles: {len(algorithms_data)}")
    print(f"🧠 YouTube API: {'ACTIVA' if YOUTUBE_API_KEY else 'INACTIVA'}")
    uvicorn.run(app, host="0.0.0.0", port=port)