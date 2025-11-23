// Configuración
const API_BASE = '/api';

// Estado
let currentUser = null;
let loans = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadLoans();
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

// Cargar préstamos
async function loadLoans() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/loans`);
        loans = await response.json();
        displayLoans(loans);
    } catch (error) {
        console.error('Error loading loans:', error);
        showAlert('Error al cargar los préstamos', 'danger');
    } finally {
        showLoading(false);
    }
}

// Mostrar préstamos
function displayLoans(loansToShow) {
    const container = document.getElementById('loans-container');
    const userLoans = loansToShow.filter(loan => loan.usuario_id === currentUser.id);
    
    if (userLoans.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card border-0 text-center py-5">
                    <div class="card-body">
                        <i class="bi bi-arrow-left-right display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No tienes préstamos activos</h4>
                        <p class="text-muted">Visita el catálogo para solicitar un préstamo</p>
                        <a href="/catalogo" class="btn btn-primary mt-3">
                            <i class="bi bi-book me-1"></i>Ir al Catálogo
                        </a>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userLoans.map(loan => `
        <div class="col-12">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="card-title fw-bold text-primary">Préstamo #${loan.id}</h5>
                            <div class="row text-muted small">
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-book me-1"></i><strong>Libro ID:</strong> ${loan.libro_id}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-calendar me-1"></i><strong>Fecha préstamo:</strong> ${new Date(loan.fecha_prestamo).toLocaleDateString()}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <i class="bi bi-clock me-1"></i><strong>Devolución:</strong> ${new Date(loan.fecha_devolucion_esperada).toLocaleDateString()}
                                </div>
                                <div class="col-sm-6 mb-2">
                                    <span class="badge ${getLoanStatusBadge(loan.estado)}">${loan.estado}</span>
                                </div>
                                ${loan.multa > 0 ? `
                                    <div class="col-12 mt-2">
                                        <span class="badge bg-danger">
                                            <i class="bi bi-exclamation-triangle me-1"></i>Multa: $${loan.multa}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            ${loan.estado === 'activo' ? `
                                <button class="btn btn-primary" onclick="returnBook(${loan.id})">
                                    <i class="bi bi-arrow-return-left me-1"></i>Devolver
                                </button>
                            ` : `
                                <span class="text-muted fst-italic">Finalizado</span>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Obtener clase del badge según estado
function getLoanStatusBadge(estado) {
    switch(estado) {
        case 'activo': return 'bg-success';
        case 'devuelto': return 'bg-secondary';
        case 'vencido': return 'bg-danger';
        default: return 'bg-light text-dark';
    }
}

// Devolver libro
async function returnBook(loanId) {
    if (!confirm('¿Estás seguro de que deseas devolver este libro?')) {
        return;
    }
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/loans/${loanId}/return`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Libro devuelto exitosamente', 'success');
            loadLoans();
        } else {
            showAlert('Error al devolver el libro: ' + (data.detail || data.error), 'danger');
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