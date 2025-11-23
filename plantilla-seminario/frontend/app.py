from flask import Flask, render_template, jsonify, request, redirect, url_for
import requests
import os
from functools import wraps

app = Flask(__name__, 
    static_folder='static',
    template_folder='templates'
)
app.secret_key = 'biblioteca_secret_2024'

# Configuración
API_BASE = os.environ.get('API_BASE', 'http://api-gateway:8000')

# Decorador para verificar autenticación
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('token')
        
        # Solo verificamos el token
        if not token:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Rutas de páginas
@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login')
def login():
    # Si ya está autenticado, redirigir al dashboard
    token = request.cookies.get('token')
    if token:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/catalogo')
@login_required
def catalogo():
    return render_template('catalogo.html')

@app.route('/prestamos')
@login_required
def prestamos():
    return render_template('prestamos.html')

@app.route('/reservas')
@login_required
def reservas():
    return render_template('reservas.html')

# API endpoints
@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        response = requests.post(f'{API_BASE}/autenticacion/login', json=data)
        
        if response.status_code == 200:
            login_data = response.json()
            
            # Crear respuesta y establecer cookies
            resp = jsonify({
                'success': True,
                'message': 'Login exitoso',
                'token': login_data.get('access_token', login_data.get('token', '')),
                'user': login_data.get('user', {})
            })
            
            # Establecer cookies - IMPORTANTE para desarrollo
            resp.set_cookie(
                'token', 
                login_data.get('access_token', login_data.get('token', '')),
                httponly=False,  # True en producción
                secure=False,    # True en producción
                samesite='Lax',
                path='/',
                max_age=3600*24  # 24 horas
            )
            
            return resp, 200
        else:
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            }), 401
    except requests.RequestException as e:
        return jsonify({
            'success': False,
            'message': 'Error de conexión con el servidor'
        }), 503

@app.route('/api/logout', methods=['POST'])
def api_logout():
    try:
        # Respuesta inmediata sin procesamiento complejo
        resp = jsonify({
            'success': True,
            'message': 'Sesión cerrada'
        })
        
        # Limpiar cookies de forma agresiva
        resp.set_cookie('token', '', expires=0, path='/')
        resp.set_cookie('user_id', '', expires=0, path='/')
        
        return resp, 200
        
    except Exception as e:
        # En caso de error, devolver respuesta básica igual
        resp = jsonify({'success': True, 'message': 'Sesión cerrada'})
        resp.set_cookie('token', '', expires=0, path='/')
        return resp, 200
        
    except Exception as e:
        print(f"Error en logout: {e}")
        # Forzar respuesta incluso con error
        resp = jsonify({'success': True, 'message': 'Sesión cerrada'})
        resp.set_cookie('token', '', expires=0)
        return resp, 200

@app.route('/api/check-auth')
def check_auth():
    token = request.cookies.get('token')
    if token:
        return jsonify({'authenticated': True}), 200
    else:
        return jsonify({'authenticated': False}), 401

# Endpoints de API (sin cambios)
@app.route('/api/books')
@login_required
def get_books():
    try:
        token = request.cookies.get('token')
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        response = requests.get(f'{API_BASE}/catalogo/libros', headers=headers)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({'error': 'Error de conexión'}), 503

@app.route('/api/loans')
@login_required
def get_loans():
    try:
        token = request.cookies.get('token')
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        response = requests.get(f'{API_BASE}/prestamos/prestamos', headers=headers)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({'error': 'Error de conexión'}), 503

@app.route('/api/reservations')
@login_required
def get_reservations():
    try:
        token = request.cookies.get('token')
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        response = requests.get(f'{API_BASE}/reservas/reservas', headers=headers)
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({'error': 'Error de conexión'}), 503

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'frontend'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)