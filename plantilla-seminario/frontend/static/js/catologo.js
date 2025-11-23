// Configuración
const API_BASE = '/api';

// Estado
let currentUser = null;
let books = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadBooks();
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

// Cargar libros
async function loadBooks() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/books`);
        books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
        showAlert('Error al cargar los libros', 'danger');
    } finally {
        showLoading(false);
    }
}

// Mostrar libros
function displayBooks(booksToShow) {
    const booksGrid = document.getElementById('books-grid');
    
    if (booksToShow.length === 0) {
        booksGrid.innerHTML = `
            <div class="col-12">
                <div class="card border-0 text-center py-5">
                    <div class="card-body">
                        <i class="bi bi-book-x display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">No se encontraron libros</h4>
                        <p class="text-muted">Intenta con otros términos de búsqueda</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    booksGrid.innerHTML = booksToShow.map(book => `
        <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="card book-card h-100">
                <div class="card-body">
                    <h5 class="card-title fw-bold text-primary">${book.titulo}</h5>
                    <div class="mb-2">
                        <span class="badge bg-light text-dark me-1">${book.categoria}</span>
                        <span class="badge availability-badge ${book.ejemplares_disponibles > 0 ? 'available' : 'unavailable'}">
                            ${book.ejemplares_disponibles} disponibles
                        </span>
                    </div>
                    <div class="book-meta text-muted small mb-3">
                        <div><i class="bi bi-upc-scan me-1"></i> ISBN: ${book.isbn}</div>
                        <div><i class="bi bi-calendar me-1"></i> Año: ${book.año_publicacion}</div>
                        <div><i class="bi bi-building me-1"></i> ${book.editorial}</div>
                    </div>
                    <div class="book-actions d-grid gap-2">
                        <button class="btn btn-primary btn-sm" onclick="reserveBook(${book.id})" 
                                ${book.ejemplares_disponibles === 0 ? 'disabled' : ''}>
                            <i class="bi bi-calendar-plus me-1"></i> Reservar
                        </button>
                        <button class="btn btn-success btn-sm" onclick="loanBook(${book.id})"
                                ${book.ejemplares_disponibles === 0 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-left-right me-1"></i> Prestar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar libros
function filterBooks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filteredBooks = books.filter(book => 
        book.titulo.toLowerCase().includes(searchTerm) ||
        book.categoria.toLowerCase().includes(searchTerm) ||
        book.editorial.toLowerCase().includes(searchTerm)
    );
    displayBooks(filteredBooks);
}

// Reservar libro
async function reserveBook(bookId) {
    if (!currentUser) return;
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/reservations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                libro_id: bookId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Libro reservado exitosamente', 'success');
            loadBooks(); // Recargar lista
        } else {
            showAlert('Error al reservar el libro: ' + (data.detail || data.error), 'danger');
        }
    } catch (error) {
        showAlert('Error de conexión', 'danger');
    } finally {
        showLoading(false);
    }
}

// Prestar libro
async function loanBook(bookId) {
    if (!currentUser) return;
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/loans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                libro_id: bookId,
                dias_prestamo: 15
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Préstamo realizado exitosamente', 'success');
            loadBooks(); // Recargar lista
        } else {
            showAlert('Error al realizar el préstamo: ' + (data.detail || data.error), 'danger');
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