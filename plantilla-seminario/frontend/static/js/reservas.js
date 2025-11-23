// Configuración
const API_BASE = '/api';

// Estado
let currentUser = null;
let reservations = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadReservations();
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
}

// Cargar reservas
async function loadReservations() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/reservations`);
        reservations = await response.json();
        displayReservations(reservations);
    } catch (error) {
        console.error('Error loading reservations:', error);
        showAlert('Error al cargar las reservas', 'danger');
    } finally {
        showLoading(false);
    }
}

// Mostrar reservas
function displayReservations(reservationsToShow) {
    const container = document.getElementById('reservations-container');
    const userReservations = reservationsToShow.filter(res => res.usuario_id === currentUser.id);
    
    if (userReservations.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card border-0 text-center py-5">
                    <div class="card-body">
                        <i class="bi bi-calendar-x display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No tienes reservas activas</h4>
                        <p class="text-muted">Visita el catálogo para hacer una reserva</p>
                        <a href="/catalogo" class="btn btn-primary mt-3">
                            <i class="bi bi-book me-1"></i>Ir al Catálogo
                        </a>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userReservations.map(res => `
        <div class="col-12">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="card-title fw-bold text-primary">Reserva #${res.id}</h5>
                            <div class="row text-muted small">
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-book me-1"></i><strong>Libro ID:</strong> ${res.libro_id}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-calendar me-1"></i><strong>Fecha reserva:</strong> ${new Date(res.fecha_reserva).toLocaleDateString()}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-clock me-1"></i><strong>Vence:</strong> ${new Date(res.fecha_vencimiento).toLocaleDateString()}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <span class="badge ${getReservationStatusBadge(res.estado)}">${res.estado}</span>
                                </div>
                                ${isReservationExpiring(res) ? `
                                    <div class="col-12 mt-2">
                                        <span class="badge bg-warning text-dark">
                                            <i class="bi bi-exclamation-triangle me-1"></i>Próxima a vencer
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            ${res.estado === 'activa' ? `
                                <button class="btn btn-danger btn-sm" onclick="cancelReservation(${res.id})">
                                    <i class="bi bi-x-circle me-1"></i>Cancelar
                                </button>
                            ` : `
                                <span class="text-muted fst-italic">${res.estado}</span>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Obtener clase del badge según estado
function getReservationStatusBadge(estado) {
    switch(estado) {
        case 'activa': return 'bg-warning text-dark';
        case 'cancelada': return 'bg-secondary';
        case 'completada': return 'bg-success';
        case 'vencida': return 'bg-danger';
        default: return 'bg-light text-dark';
    }
}

// Verificar si la reserva está por vencer
function isReservationExpiring(reservation) {
    if (reservation.estado !== 'activa') return false;
    
    const vencimiento = new Date(reservation.fecha_vencimiento);
    const hoy = new Date();
    const diferenciaDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    
    return diferenciaDias <= 1; // Vence en 1 día o menos
}

// Cancelar reserva
async function cancelReservation(reservationId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/reservations/${reservationId}/cancel`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Reserva cancelada exitosamente', 'success');
            loadReservations();
        } else {
            showAlert('Error al cancelar la reserva: ' + (data.detail || data.error), 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
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
    // Remover alertas existentes
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
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