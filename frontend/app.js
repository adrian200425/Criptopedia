// Configuración para producción - Render
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000' 
    : 'https://criptopedia-backend.onrender.com';

let currentUser = null;
let authToken = localStorage.getItem('authToken');
let algorithms = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Criptopedia Universal...');
    checkAuthentication();
    loadAlgorithms();
    setupEventListeners();
});

// Verificar autenticación al cargar
async function checkAuthentication() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE}/auth/check`);
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                currentUser = { username: 'admin' };
                updateUIAuthState(true);
                showNotification('🔓 Sesión restaurada - Modo edición activo', 'success');
            }
        }
    } catch (error) {
        console.log('No hay sesión activa');
    }
}

// Configurar eventos
function setupEventListeners() {
    // Botón Admin
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', function() {
            if (currentUser) {
                logout();
            } else {
                showModal('login-modal');
            }
        });
    }

    // Botón IA
    const iaBtn = document.getElementById('ia-btn');
    if (iaBtn) {
        iaBtn.addEventListener('click', function() {
            showModal('ia-modal');
        });
    }

    // Formulario Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Botón Agregar Algoritmo
    const addAlgoBtn = document.getElementById('add-algorithm-btn');
    if (addAlgoBtn) {
        addAlgoBtn.addEventListener('click', function() {
            showAddAlgorithmModal();
        });
    }

    // Selector de algoritmos
    const algorithmSelect = document.getElementById('algorithm-select');
    if (algorithmSelect) {
        algorithmSelect.addEventListener('change', function(e) {
            const customInput = document.getElementById('custom-algorithm');
            if (e.target.value === 'custom') {
                customInput.classList.remove('hidden');
                customInput.focus();
            } else {
                customInput.classList.add('hidden');
            }
        });
    }
}

// Cargar algoritmos
async function loadAlgorithms() {
    try {
        showLoadingAlgorithms();
        const response = await fetch(`${API_BASE}/algorithms`);
        if (response.ok) {
            algorithms = await response.json();
            displayAlgorithms(algorithms);
            updateAlgorithmSelect(algorithms);
        } else {
            throw new Error('Error en respuesta del servidor');
        }
    } catch (error) {
        console.error('Error cargando algoritmos:', error);
        showNotification('Error cargando los algoritmos', 'error');
        showErrorAlgorithms();
    }
}

function showLoadingAlgorithms() {
    const container = document.getElementById('algorithms-grid');
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-500">Cargando algoritmos...</p>
        </div>
    `;
}

function showErrorAlgorithms() {
    const container = document.getElementById('algorithms-grid');
    container.innerHTML = `
        <div class="col-span-full text-center py-16 text-gray-500">
            <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
            <p class="text-lg">Error al cargar los algoritmos</p>
            <p class="text-sm mt-2">Verifica que el backend esté ejecutándose</p>
            <button onclick="loadAlgorithms()" class="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                Reintentar
            </button>
        </div>
    `;
}

// Mostrar algoritmos CON BOTONES DE EDICIÓN
function displayAlgorithms(algorithms) {
    const container = document.getElementById('algorithms-grid');
    if (!container) return;

    if (algorithms.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No hay algoritmos disponibles</p>
                ${currentUser ? `
                    <button onclick="showAddAlgorithmModal()" 
                            class="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-sm">
                        <i class="fas fa-plus mr-2"></i>Agregar Primer Algoritmo
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = algorithms.map(algo => `
        <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 card-hover border border-gray-200 overflow-hidden fade-in">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${algo.name}</h3>
                        <div class="flex gap-2 mb-3 flex-wrap">
                            <span class="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">${algo.category}</span>
                            <span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">${algo.difficulty}</span>
                            <span class="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200">${algo.key_type}</span>
                        </div>
                    </div>
                    
                    <!-- BOTONES DE EDICIÓN - Solo visible para admin -->
                    ${currentUser ? `
                        <div class="flex gap-2 ml-4">
                            <button onclick="editAlgorithm('${algo.id}')" 
                                    class="text-yellow-600 hover:text-yellow-800 transition-all p-2 rounded-lg hover:bg-yellow-50 border border-yellow-200"
                                    title="Editar algoritmo">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteAlgorithm('${algo.id}')" 
                                    class="text-red-600 hover:text-red-800 transition-all p-2 rounded-lg hover:bg-red-50 border border-red-200"
                                    title="Eliminar algoritmo">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <p class="text-gray-600 text-sm mb-4 leading-relaxed">${algo.description}</p>
                
                <div class="space-y-2 text-sm text-gray-700">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-lock text-green-600 mt-0.5"></i>
                        <span><strong class="text-gray-800">Encriptar:</strong> ${algo.encryption_example}</span>
                    </div>
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-unlock text-blue-600 mt-0.5"></i>
                        <span><strong class="text-gray-800">Desencriptar:</strong> ${algo.decryption_example}</span>
                    </div>
                </div>
                
                <!-- Botón de búsqueda rápida -->
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <button onclick="quickSearch('${algo.id}', '${algo.name}')" 
                            class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all font-medium flex items-center justify-center space-x-2 shadow-sm">
                        <i class="fab fa-youtube"></i>
                        <span>Buscar Videos YouTube REAL</span>
                    </button>
                </div>
            </div>
            
            <!-- Información admin -->
            ${currentUser ? `
                <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-500">
                            ID: <code class="bg-gray-100 px-1 rounded">${algo.id}</code>
                        </span>
                        <span class="text-xs text-gray-400">
                            <i class="fas fa-edit mr-1"></i>Editable
                        </span>
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Actualizar selector de algoritmos
function updateAlgorithmSelect(algorithms) {
    const select = document.getElementById('algorithm-select');
    if (!select) return;

    select.innerHTML = `
        <option value="">Selecciona un algoritmo...</option>
        ${algorithms.map(algo => `<option value="${algo.id}">${algo.name}</option>`).join('')}
        <option value="custom">⚡ Escribir algoritmo personalizado...</option>
    `;
}

// 🧠 BUSQUEDA CON IA YOUTUBE REAL
async function searchVideos() {
    const algorithmSelect = document.getElementById('algorithm-select');
    const customInput = document.getElementById('custom-algorithm');
    const resultsDiv = document.getElementById('video-results');
    
    let algorithmId;
    let algorithmName;
    
    if (algorithmSelect.value === 'custom') {
        algorithmId = customInput.value.trim();
        algorithmName = algorithmId;
        if (!algorithmId) {
            showNotification('Por favor escribe un algoritmo', 'error');
            return;
        }
    } else {
        algorithmId = algorithmSelect.value;
        if (!algorithmId) {
            showNotification('Por favor selecciona un algoritmo', 'error');
            return;
        }
        const selectedOption = algorithmSelect.options[algorithmSelect.selectedIndex];
        algorithmName = selectedOption.text;
    }
    
    // Mostrar loading
    resultsDiv.innerHTML = `
        <div class="text-center py-12">
            <i class="fab fa-youtube text-5xl text-red-500 mb-4 animate-pulse"></i>
            <p class="text-gray-600 text-lg">🎯 Búsqueda REAL en YouTube para:</p>
            <p class="font-semibold text-gray-800 text-xl">${algorithmName}</p>
            <p class="text-gray-400 text-sm mt-2">Consultando API de YouTube...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_BASE}/videos/search`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ algorithm: algorithmId })
        });
        
        if (response.ok) {
            const data = await response.json();
            displayVideoResults(data);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error en la búsqueda');
        }
    } catch (error) {
        console.error('❌ Error en búsqueda YouTube REAL:', error);
        resultsDiv.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-3xl text-red-600 mb-3"></i>
                <h4 class="text-lg font-semibold text-red-800 mb-2">Error en búsqueda YouTube</h4>
                <p class="text-red-700 mb-4">${error.message || 'No se pudo conectar con YouTube API'}</p>
                <button onclick="searchVideos()" class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded text-sm hover:from-red-600 hover:to-red-700 transition-all">
                    Reintentar Búsqueda
                </button>
            </div>
        `;
    }
}

// Mostrar resultados de YouTube REAL
function displayVideoResults(data) {
    const resultsDiv = document.getElementById('video-results');
    if (!resultsDiv) return;
    
    const { videos, algorithm_name, total_results, youtube_api } = data;
    
    if (!videos || videos.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-video-slash text-4xl mb-4"></i>
                <p class="text-lg">No se encontraron videos</p>
                <p class="text-sm mt-2">YouTube no tiene contenido para este algoritmo</p>
            </div>
        `;
        return;
    }
    
    const hasRealVideos = videos.some(video => video.api_real);
    
    resultsDiv.innerHTML = `
        <div class="bg-gradient-to-r from-red-50 to-blue-50 border border-red-200 rounded-xl p-6 mb-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h4 class="font-bold text-red-800 text-xl">${algorithm_name}</h4>
                    <p class="text-red-600">${total_results} videos encontrados en YouTube</p>
                    <p class="text-red-500 text-sm mt-1">${youtube_api} - Búsqueda en tiempo real</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                        <i class="fab fa-youtube"></i>
                        <span>YouTube REAL</span>
                    </span>
                    ${hasRealVideos ? `
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                            <i class="fas fa-check"></i>
                            <span>API Activa</span>
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${videos.map(video => `
                <div class="border border-gray-200 rounded-xl overflow-hidden hover:border-red-300 transition-all duration-300 bg-white shadow-sm">
                    <div class="flex flex-col sm:flex-row">
                        <div class="w-full sm:w-40 h-32 relative cursor-pointer group" onclick="playVideo('${video.video_id}')">
                            <img src="${video.thumbnail}" alt="${video.title}" 
                                 class="w-full h-full object-cover group-hover:opacity-90 transition">
                            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                                <i class="fab fa-youtube text-white text-2xl opacity-0 group-hover:opacity-100 transition"></i>
                            </div>
                            ${video.api_real ? `
                                <div class="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                    REAL
                                </div>
                            ` : video.fallback ? `
                                <div class="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                    Respaldo
                                </div>
                            ` : ''}
                        </div>
                        <div class="p-4 flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 leading-tight">${video.title}</h4>
                            <p class="text-gray-600 text-xs mb-3">${video.channel}</p>
                            ${video.search_term ? `
                                <p class="text-gray-500 text-xs mb-2">
                                    <i class="fas fa-search mr-1"></i>Búsqueda: "${video.search_term}"
                                </p>
                            ` : ''}
                            <button onclick="playVideo('${video.video_id}')" 
                                    class="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all flex items-center space-x-2">
                                <i class="fab fa-youtube"></i>
                                <span>Ver en YouTube</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div class="flex items-start space-x-3">
                <i class="fas fa-info-circle text-blue-600 text-xl mt-1"></i>
                <div>
                    <h5 class="font-semibold text-blue-800 mb-2">Búsqueda REAL en YouTube</h5>
                    <p class="text-blue-700 text-sm">
                        Estos videos fueron encontrados en <strong>tiempo real</strong> usando la API oficial de YouTube.
                        La IA generó términos de búsqueda específicos para <strong>"${algorithm_name}"</strong> y consultó
                        directamente los servidores de YouTube para obtener los resultados más relevantes.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// Búsqueda rápida
function quickSearch(algorithmId, algorithmName) {
    const algorithmSelect = document.getElementById('algorithm-select');
    if (algorithmSelect) {
        algorithmSelect.value = algorithmId;
    }
    showModal('ia-modal');
    setTimeout(() => searchVideos(), 500);
}

// Reproducir video
function playVideo(videoId) {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
}

// 🔐 SISTEMA DE AUTENTICACIÓN COMPLETO
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            authToken = 'authenticated';
            localStorage.setItem('authToken', authToken);
            
            updateUIAuthState(true);
            closeModal('login-modal');
            
            // Recargar algoritmos para mostrar botones de edición
            await loadAlgorithms();
            
            showNotification('✅ Modo edición ACTIVADO - Ahora puedes gestionar algoritmos', 'success');
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Credenciales incorrectas', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('Error de conexión con el servidor', 'error');
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    updateUIAuthState(false);
    
    // Recargar algoritmos para ocultar botones de edición
    loadAlgorithms();
    
    showNotification('🔒 Modo edición DESACTIVADO', 'info');
}

function updateUIAuthState(isAuthenticated) {
    const adminBtn = document.getElementById('admin-btn');
    const adminIndicator = document.getElementById('admin-indicator');
    const addAlgorithmBtn = document.getElementById('add-algorithm-btn');
    
    if (isAuthenticated) {
        // Modo administrador activado
        adminBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión';
        adminBtn.className = 'bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-sm';
        
        if (adminIndicator) adminIndicator.classList.remove('hidden');
        if (addAlgorithmBtn) addAlgorithmBtn.classList.remove('hidden');
        
    } else {
        // Modo normal
        adminBtn.innerHTML = '<i class="fas fa-user-shield mr-2"></i>Administrador';
        adminBtn.className = 'bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-sm';
        
        if (adminIndicator) adminIndicator.classList.add('hidden');
        if (addAlgorithmBtn) addAlgorithmBtn.classList.add('hidden');
    }
}

// 📝 FUNCIONES DE EDICIÓN COMPLETAMENTE FUNCIONALES

// FUNCIÓN DE EDICIÓN CORREGIDA - COMPLETA
function editAlgorithm(algorithmId) {
    console.log('🔧 Ejecutando editAlgorithm para:', algorithmId);
    
    const algorithm = algorithms.find(a => a.id === algorithmId);
    if (!algorithm) {
        showNotification('Algoritmo no encontrado', 'error');
        return;
    }

    // Crear modal de edición
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl my-8 mx-auto shadow-2xl">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800">✏️ Editar "${algorithm.name}"</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-gray-500 hover:text-gray-700 transition-all p-1 sm:p-2 rounded-lg hover:bg-gray-100">
                    <i class="fas fa-times text-lg sm:text-xl"></i>
                </button>
            </div>

            <!-- Formulario -->
            <div class="space-y-4">
                <!-- Nombre e ID -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" id="edit-algo-name" value="${algorithm.name}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ID único</label>
                        <input type="text" value="${algorithm.id}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500" readonly>
                        <p class="text-xs text-gray-500 mt-1">El ID no se puede modificar</p>
                    </div>
                </div>

                <!-- Categoría y Dificultad -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                        <select id="edit-algo-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Criptografía Clásica" ${algorithm.category === 'Criptografía Clásica' ? 'selected' : ''}>Criptografía Clásica</option>
                            <option value="Criptografía Moderna" ${algorithm.category === 'Criptografía Moderna' ? 'selected' : ''}>Criptografía Moderna</option>
                            <option value="Criptografía Asimétrica" ${algorithm.category === 'Criptografía Asimétrica' ? 'selected' : ''}>Criptografía Asimétrica</option>
                            <option value="Codificación" ${algorithm.category === 'Codificación' ? 'selected' : ''}>Codificación</option>
                            <option value="Funciones Hash" ${algorithm.category === 'Funciones Hash' ? 'selected' : ''}>Funciones Hash</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Dificultad *</label>
                        <select id="edit-algo-difficulty" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="Principiante" ${algorithm.difficulty === 'Principiante' ? 'selected' : ''}>Principiante</option>
                            <option value="Intermedio" ${algorithm.difficulty === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
                            <option value="Avanzado" ${algorithm.difficulty === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
                        </select>
                    </div>
                </div>

                <!-- Descripción -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                    <textarea id="edit-algo-description" 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                              rows="3">${algorithm.description}</textarea>
                </div>

                <!-- Ejemplos -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ejemplo Encriptar *</label>
                        <input type="text" id="edit-algo-encrypt" value="${algorithm.encryption_example}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ejemplo Desencriptar *</label>
                        <input type="text" id="edit-algo-decrypt" value="${algorithm.decryption_example}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>

                <!-- Tipo de clave -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Clave *</label>
                    <select id="edit-algo-keytype" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Clave simétrica" ${algorithm.key_type === 'Clave simétrica' ? 'selected' : ''}>Clave simétrica</option>
                        <option value="Clave asimétrica" ${algorithm.key_type === 'Clave asimétrica' ? 'selected' : ''}>Clave asimétrica</option>
                        <option value="Palabra clave" ${algorithm.key_type === 'Palabra clave' ? 'selected' : ''}>Palabra clave</option>
                        <option value="Número entero" ${algorithm.key_type === 'Número entero' ? 'selected' : ''}>Número entero</option>
                        <option value="Par de claves" ${algorithm.key_type === 'Par de claves' ? 'selected' : ''}>Par de claves</option>
                        <option value="No aplica" ${algorithm.key_type === 'No aplica' ? 'selected' : ''}>No aplica</option>
                    </select>
                </div>

                <!-- Botones -->
                <div class="flex space-x-3 pt-4 border-t">
                    <button onclick="updateAlgorithm('${algorithmId}')" 
                            class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold">
                        <i class="fas fa-save mr-2"></i>Guardar Cambios
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// FUNCIÓN PARA ACTUALIZAR EL ALGORITMO
async function updateAlgorithm(algorithmId) {
    console.log('🔄 Actualizando algoritmo:', algorithmId);
    
    const name = document.getElementById('edit-algo-name').value;
    const category = document.getElementById('edit-algo-category').value;
    const description = document.getElementById('edit-algo-description').value;
    const encryptExample = document.getElementById('edit-algo-encrypt').value;
    const decryptExample = document.getElementById('edit-algo-decrypt').value;
    const keyType = document.getElementById('edit-algo-keytype').value;
    const difficulty = document.getElementById('edit-algo-difficulty').value;
    
    // Validación
    if (!name || !category || !description || !encryptExample || !decryptExample || !keyType || !difficulty) {
        showNotification('❌ Completa todos los campos obligatorios', 'error');
        return;
    }
    
    const updatedAlgorithm = {
        id: algorithmId,
        name: name,
        category: category,
        description: description,
        encryption_example: encryptExample,
        decryption_example: decryptExample,
        key_type: keyType,
        difficulty: difficulty
    };
    
    try {
        console.log('📤 Enviando actualización:', updatedAlgorithm);
        
        const response = await fetch(`${API_BASE}/admin/algorithms/${algorithmId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAlgorithm)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Respuesta del servidor:', data);
            
            showNotification('✅ Algoritmo actualizado exitosamente', 'success');
            
            // Cerrar modal
            const modal = document.querySelector('.fixed');
            if (modal) modal.remove();
            
            // Recargar algoritmos
            await loadAlgorithms();
            
        } else {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.detail || 'Error del servidor');
        }
    } catch (error) {
        console.error('❌ Error actualizando:', error);
        showNotification('❌ Error: ' + error.message, 'error');
    }
}

function showAddAlgorithmModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl my-8 mx-auto shadow-2xl">
            <!-- Header fijo -->
            <div class="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 border-b">
                <h3 class="text-lg sm:text-xl font-bold text-gray-800">➕ Agregar Nuevo Algoritmo</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-gray-500 hover:text-gray-700 transition-all p-1 sm:p-2 rounded-lg hover:bg-gray-100">
                    <i class="fas fa-times text-lg sm:text-xl"></i>
                </button>
            </div>

            <!-- Contenido desplazable -->
            <div class="space-y-3 sm:space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                <!-- Fila 1: Nombre e ID -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" id="new-algo-name" placeholder="Ej: AES Encryption" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ID único *</label>
                        <input type="text" id="new-algo-id" placeholder="aes-encryption" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                    </div>
                </div>

                <!-- Fila 2: Categoría y Dificultad -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                        <select id="new-algo-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                            <option value="Criptografía Clásica">Criptografía Clásica</option>
                            <option value="Criptografía Moderna">Criptografía Moderna</option>
                            <option value="Criptografía Asimétrica">Criptografía Asimétrica</option>
                            <option value="Codificación">Codificación</option>
                            <option value="Funciones Hash">Funciones Hash</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Dificultad *</label>
                        <select id="new-algo-difficulty" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                            <option value="Principiante">Principiante</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                        </select>
                    </div>
                </div>

                <!-- Descripción (ocupará toda la fila) -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                    <textarea id="new-algo-description" placeholder="Describe brevemente cómo funciona el algoritmo..." 
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
                              rows="2"></textarea>
                </div>

                <!-- Fila 3: Ejemplos de encriptación/desencriptación -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ejemplo Encriptar</label>
                        <input type="text" id="new-algo-encrypt" placeholder="Texto 'HOLA' → 'KROD'" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ejemplo Desencriptar</label>
                        <input type="text" id="new-algo-decrypt" placeholder="Texto 'KROD' → 'HOLA'" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                    </div>
                </div>

                <!-- Tipo de clave -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Clave</label>
                    <select id="new-algo-keytype" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                        <option value="Clave simétrica">Clave simétrica</option>
                        <option value="Clave asimétrica">Clave asimétrica</option>
                        <option value="Palabra clave">Palabra clave</option>
                        <option value="Número entero">Número entero</option>
                        <option value="Par de claves">Par de claves</option>
                        <option value="No aplica">No aplica</option>
                    </select>
                </div>

                <!-- Botones de acción -->
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                    <button onclick="addNewAlgorithm()" 
                            class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-sm sm:text-base order-2 sm:order-1 shadow-sm">
                        <i class="fas fa-plus mr-2"></i>Crear Algoritmo
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 sm:py-3 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all font-medium text-sm sm:text-base order-1 sm:order-2">
                        Cancelar
                    </button>
                </div>

                <!-- Información de ayuda -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div class="flex items-start space-x-2">
                        <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                        <div>
                            <p class="text-blue-700 text-xs">
                                <strong>Tip:</strong> Completa al menos los campos obligatorios (*). 
                                Los ejemplos ayudan a entender mejor el algoritmo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);

    // Auto-generar ID basado en el nombre
    const nameInput = document.getElementById('new-algo-name');
    const idInput = document.getElementById('new-algo-id');
    
    nameInput.addEventListener('input', function() {
        if (!idInput.value) {
            const generatedId = nameInput.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            idInput.value = generatedId;
        }
    });
}

async function addNewAlgorithm() {
    const name = document.getElementById('new-algo-name').value;
    const id = document.getElementById('new-algo-id').value;
    const category = document.getElementById('new-algo-category').value;
    const description = document.getElementById('new-algo-description').value;
    const encryptExample = document.getElementById('new-algo-encrypt').value || "Ejemplo de encriptación";
    const decryptExample = document.getElementById('new-algo-decrypt').value || "Ejemplo de desencriptación";
    const keyType = document.getElementById('new-algo-keytype').value || "Por definir";
    const difficulty = document.getElementById('new-algo-difficulty').value;
    
    if (!name || !id || !category || !description) {
        showNotification('Por favor completa los campos obligatorios (*)', 'error');
        return;
    }
    
    const newAlgorithm = {
        id: id.toLowerCase().replace(/ /g, '-'),
        name: name,
        category: category,
        description: description,
        encryption_example: encryptExample,
        decryption_example: decryptExample,
        key_type: keyType,
        difficulty: difficulty
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/algorithms`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newAlgorithm)
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification('✅ Algoritmo creado exitosamente', 'success');
            document.querySelector('.fixed').remove();
            // Recargar algoritmos para mostrar el nuevo
            await loadAlgorithms();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error creando algoritmo');
        }
    } catch (error) {
        console.error('Error agregando algoritmo:', error);
        showNotification('Error creando algoritmo: ' + error.message, 'error');
    }
}

async function deleteAlgorithm(algorithmId) {
    const algorithm = algorithms.find(a => a.id === algorithmId);
    if (!algorithm) return;
    
    if (!confirm(`¿Estás seguro de que quieres ELIMINAR permanentemente el algoritmo "${algorithm.name}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/algorithms/${algorithmId}`, {
            method: 'DELETE',
            headers: { 
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showNotification('🗑️ Algoritmo eliminado correctamente', 'success');
            // Recargar algoritmos
            await loadAlgorithms();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error eliminando algoritmo');
        }
    } catch (error) {
        console.error('Error eliminando algoritmo:', error);
        showNotification('Error eliminando algoritmo: ' + error.message, 'error');
    }
}

// Funciones UI
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                   type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                   type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-600';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 fade-in`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(event) {
    if (event.target.id === 'login-modal') closeModal('login-modal');
    if (event.target.id === 'ia-modal') closeModal('ia-modal');
});

// Cerrar con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal('login-modal');
        closeModal('ia-modal');
        // Cerrar modales dinámicos
        const dynamicModals = document.querySelectorAll('.fixed');
        dynamicModals.forEach(modal => modal.remove());
    }
});

// Exportar funciones globales
window.searchVideos = searchVideos;
window.quickSearch = quickSearch;
window.playVideo = playVideo;
window.closeModal = closeModal;
window.editAlgorithm = editAlgorithm;
window.deleteAlgorithm = deleteAlgorithm;
window.showAddAlgorithmModal = showAddAlgorithmModal;
window.addNewAlgorithm = addNewAlgorithm;