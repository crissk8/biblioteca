from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hashlib
import time

app = FastAPI(title="Microservicio de Autenticación")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Base de datos SIMPLIFICADA - SIN BCRYPT
users_db = {
    "admin": {
        "id": 1, 
        "username": "admin", 
        "email": "admin@universidad.edu", 
        "role": "administrador", 
        "full_name": "Administrador Principal",
        "password": "admin123",  # Contraseña en texto plano
        "is_active": True
    },
    "profesor1": {
        "id": 2, 
        "username": "profesor1", 
        "email": "profesor@universidad.edu", 
        "role": "profesor", 
        "full_name": "Profesor Ejemplo",
        "password": "prof123",
        "is_active": True
    },
    "estudiante1": {
        "id": 3, 
        "username": "estudiante1", 
        "email": "estudiante@universidad.edu", 
        "role": "estudiante", 
        "full_name": "Estudiante Ejemplo",
        "password": "est123",
        "is_active": True
    }
}

def create_access_token(username: str, role: str):
    token_data = f"{username}_{role}_{time.time()}"
    return hashlib.sha256(token_data.encode()).hexdigest()

@app.get("/")
async def root():
    return {"message": "Microservicio de Autenticación funcionando"}

@app.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    try:
        user = users_db.get(login_data.username)
        
        if not user:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Verificación SIMPLE sin bcrypt
        if login_data.password != user["password"]:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        access_token = create_access_token(user["username"], user["role"])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "full_name": user["full_name"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/users/me")
async def read_users_me(token: str):
    return users_db.get("admin", {})

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "autenticacion"}

@app.get("/test")
async def test():
    return {"message": "Test exitoso", "users": list(users_db.keys())}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)