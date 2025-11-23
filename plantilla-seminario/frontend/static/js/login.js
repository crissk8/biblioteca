// Configuración
const API_BASE = '/api';

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const loading = document.getElementById('loading');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const submitButton = loginForm?.querySelector('button[type="submit"]');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    checkAuthStatus();
    
    // Agregar validación en tiempo real
    if (loginForm) {
        setupFormValidation();
    }
    
    // Configurar toggle de contraseña si existe
    setupPasswordToggle();
});

// Configurar validación del formulario
function setupFormValidation() {
    const inputs = [usernameInput, passwordInput];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                validateField(this);
            });
            
            input.addEventListener('blur', function() {
                validateField(this);
            });
        }
    });
}

// Configurar toggle de visibilidad de contraseña
function setupPasswordToggle() {
    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        });
    }
}

// Validar campo individual
function validateField(field) {
    if (!field.value.trim()) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
    } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }
}

// Verificar estado de autenticación
async function checkAuthStatus() {
    try {
        console.log('Verificando estado de autenticación...');
        const response = await fetch(`${API_BASE}/check-auth`, {
            credentials: 'include' // Importante para enviar cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Estado de autenticación:', data);
            
            if (data.authenticated) {
                console.log('Usuario ya autenticado, redirigiendo a dashboard...');
                window.location.href = '/dashboard';
            }
        }
    } catch (error) {
        console.log('Usuario no autenticado:', error.message);
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    console.log('Iniciando proceso de login...');
    
    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;
    
    // Validación básica
    if (!username || !password) {
        showAlert('Por favor, complete todos los campos', 'danger');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('Enviando credenciales al servidor...');
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: username, 
                password: password 
            }),
            credentials: 'include' // CRUCIAL: incluir cookies en la request
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (response.ok && data.success) {
            // Login exitoso
            console.log('Login exitoso, redirigiendo...');
            showAlert('¡Login exitoso! Redirigiendo...', 'success');
            
            // Esperar un poco para que el usuario vea el mensaje de éxito
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
            
        } else {
            // Mostrar error
            const errorMessage = data.message || data.error || 'Credenciales inválidas';
            console.error('Error de login:', errorMessage);
            showAlert('Error: ' + errorMessage, 'danger');
            
            // Limpiar contraseña en caso de error
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showAlert('Error de conexión con el servidor. Verifique su conexión e intente nuevamente.', 'danger');
    } finally {
        showLoading(false);
    }
}

// Manejar logout - VERSIÓN MEJORADA
async function handleLogout() {
    console.log('Iniciando proceso de logout...');
    
    try {
        // Mostrar loading inmediatamente
        showLogoutLoading(true);
        
        // Enviar request de logout pero con timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const logoutPromise = fetch(`${API_BASE}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        // Esperar máximo 3 segundos
        const response = await Promise.race([logoutPromise, timeoutPromise]);
        
        if (response && response.ok) {
            const data = await response.json();
            console.log('Logout exitoso:', data);
        } else {
            console.log('Logout completado (con timeout o error)');
        }
        
    } catch (error) {
        console.log('Error/Timeout en logout:', error.message);
    } finally {
        // LIMPIAR TODO INMEDIATAMENTE
        clearUserData();
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            console.log('Redirigiendo a login...');
            window.location.href = '/login';
        }, 500);
    }
}

// Función rápida de logout (alternativa)
function quickLogout() {
    console.log('Logout rápido...');
    
    // Limpiar todo inmediatamente
    clearUserData();
    
    // Enviar request de logout pero no esperar
    fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include'
    }).catch(() => {}); // Ignorar errores
    
    // Redirigir inmediatamente
    setTimeout(() => {
        window.location.href = '/login';
    }, 100);
}

// Limpiar datos de usuario
function clearUserData() {
    localStorage.clear();
    sessionStorage.clear();
    
    // Intentar limpiar cookies específicas
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Mostrar loading durante logout
function showLogoutLoading(show) {
    // Crear overlay de loading si no existe
    let logoutOverlay = document.getElementById('logout-loading-overlay');
    
    if (show) {
        if (!logoutOverlay) {
            logoutOverlay = document.createElement('div');
            logoutOverlay.id = 'logout-loading-overlay';
            logoutOverlay.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(10px);
                ">
                    <div class="text-center text-white">
                        <div class="spinner-border mb-3" style="width: 3rem; height: 3rem;"></div>
                        <h5 class="fw-semibold">Cerrando Sesión</h5>
                        <p class="mb-0 text-white-50">Por favor espere...</p>
                    </div>
                </div>
            `;
            document.body.appendChild(logoutOverlay);
        }
        logoutOverlay.style.display = 'flex';
    } else {
        if (logoutOverlay) {
            logoutOverlay.style.display = 'none';
            setTimeout(() => {
                if (logoutOverlay.parentNode) {
                    logoutOverlay.parentNode.removeChild(logoutOverlay);
                }
            }, 1000);
        }
    }
}

// Mostrar alerta
function showAlert(message, type) {
    // Remover alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    if (loginForm && loginForm.parentNode) {
        loginForm.parentNode.insertBefore(alert, loginForm.nextSibling);
        
        // Auto-remover después de 5 segundos (excepto para mensajes de éxito)
        if (type !== 'success') {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

// Mostrar/ocultar loading del login
function showLoading(show) {
    if (!loading) return;
    
    if (show) {
        loading.classList.remove('hidden');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
        }
    } else {
        loading.classList.add('hidden');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión';
        }
    }
}

// Función para verificar token
function getAuthToken() {
    return getCookie('token');
}

// Función auxiliar para leer cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Función para debug (solo en desarrollo)
function debugAuth() {
    console.log('Cookies actuales:', document.cookie);
    console.log('Token en cookie:', getCookie('token'));
    console.log('LocalStorage:', localStorage);
    console.log('SessionStorage:', sessionStorage);
}

// Demo credentials
function fillDemoCredentials(username = 'admin', password = 'admin123') {
    if (usernameInput && passwordInput) {
        usernameInput.value = username;
        passwordInput.value = password;
        
        // Validar campos después de llenarlos
        validateField(usernameInput);
        validateField(passwordInput);
        
        showAlert(`Credenciales de ${username} cargadas. Puede iniciar sesión.`, 'info');
        
        // Auto-enfocar el botón de login
        setTimeout(() => {
            if (submitButton) {
                submitButton.focus();
            }
        }, 100);
    }
}

// Función específica para cada tipo de usuario
function fillAdminCredentials() {
    fillDemoCredentials('admin', 'admin123');
}

function fillProfesorCredentials() {
    fillDemoCredentials('profesor1', 'prof123');
}

function fillEstudianteCredentials() {
    fillDemoCredentials('estudiante1', 'est123');
}

// Event listeners
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    
    // Prevenir envío con Enter en campos individuales
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.type !== 'submit') {
                e.preventDefault();
            }
        });
    });
}

// Hacer funciones disponibles globalmente
window.handleLogout = handleLogout;
window.quickLogout = quickLogout;
window.getAuthToken = getAuthToken;
window.debugAuth = debugAuth;
window.fillDemoCredentials = fillDemoCredentials;
window.fillAdminCredentials = fillAdminCredentials;
window.fillProfesorCredentials = fillProfesorCredentials;
window.fillEstudianteCredentials = fillEstudianteCredentials;

// Manejar errores no capturados
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
});

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada no capturada:', e.reason);
});

console.log('Login.js cargado correctamente');