// Configuración
const API_BASE = '/api';

// Estado
let currentUser = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
    loadDashboardData();
});

// Verificar autenticación
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
        window.location.href = '/login';
        return;
    }
    
    currentUser = JSON.parse(userData);
    updateUserInfo();
}

// Actualizar información del usuario
function updateUserInfo() {
    document.getElementById('user-name').textContent = currentUser.full_name;
    document.getElementById('user-role').textContent = currentUser.role;
    document.getElementById('dropdown-user-name').textContent = currentUser.full_name;
    document.getElementById('dropdown-user-role').textContent = currentUser.role;
    document.getElementById('user-welcome').textContent = `Bienvenido, ${currentUser.full_name.split(' ')[0]}`;
}

// Actualizar hora actual
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = timeString.charAt(0).toUpperCase() + timeString.slice(1);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        showLoading(true);
        const [booksRes, loansRes, reservationsRes] = await Promise.all([
            fetch(`${API_BASE}/books`),
            fetch(`${API_BASE}/loans`),
            fetch(`${API_BASE}/reservations`)
        ]);
        
        const booksData = await booksRes.json();
        const loansData = await loansRes.json();
        const reservationsData = await reservationsRes.json();
        
        const activeLoans = loansData.filter(loan => loan.estado === 'activo').length;
        const activeReservations = reservationsData.filter(res => res.estado === 'activa').length;
        
        document.getElementById('stats-grid').innerHTML = `
            <div class="col-md-4">
                <div class="card stat-card books border-0 shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon bg-primary bg-opacity-10 text-primary me-3">
                                <i class="bi bi-book-half fs-2"></i>
                            </div>
                            <div>
                                <h3 class="h2 fw-bold text-primary mb-0">${booksData.length}</h3>
                                <p class="text-muted mb-0 fw-semibold">Total de Libros</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card loans border-0 shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon bg-success bg-opacity-10 text-success me-3">
                                <i class="bi bi-arrow-left-right fs-2"></i>
                            </div>
                            <div>
                                <h3 class="h2 fw-bold text-success mb-0">${activeLoans}</h3>
                                <p class="text-muted mb-0 fw-semibold">Préstamos Activos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card reservations border-0 shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center">
                            <div class="stat-icon bg-warning bg-opacity-10 text-warning me-3">
                                <i class="bi bi-calendar-check fs-2"></i>
                            </div>
                            <div>
                                <h3 class="h2 fw-bold text-warning mb-0">${activeReservations}</h3>
                                <p class="text-muted mb-0 fw-semibold">Reservas Activas</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error al cargar el dashboard', 'danger');
    } finally {
        showLoading(false);
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container-fluid').prepend(alert);
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}