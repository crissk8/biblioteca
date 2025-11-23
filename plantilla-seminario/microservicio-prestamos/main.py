from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum

app = FastAPI(title="Microservicio de Préstamos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EstadoPrestamo(str, Enum):
    ACTIVO = "activo"
    DEVUELTO = "devuelto"
    VENCIDO = "vencido"

class Prestamo(BaseModel):
    id: int
    usuario_id: int
    libro_id: int
    fecha_prestamo: datetime
    fecha_devolucion_esperada: datetime
    fecha_devolucion_real: Optional[datetime] = None
    estado: EstadoPrestamo
    multa: float = 0.0

class PrestamoCreate(BaseModel):
    usuario_id: int
    libro_id: int
    dias_prestamo: int = 15

# Base de datos simulada
prestamos_db = {}
prestamo_counter = 1

@app.get("/")
async def root():
    return {"message": "Microservicio de Préstamos funcionando"}

@app.post("/prestamos", response_model=Prestamo)
async def crear_prestamo(prestamo_data: PrestamoCreate):
    global prestamo_counter
    
    fecha_prestamo = datetime.now()
    fecha_devolucion = fecha_prestamo + timedelta(days=prestamo_data.dias_prestamo)
    
    prestamo = Prestamo(
        id=prestamo_counter,
        usuario_id=prestamo_data.usuario_id,
        libro_id=prestamo_data.libro_id,
        fecha_prestamo=fecha_prestamo,
        fecha_devolucion_esperada=fecha_devolucion,
        estado=EstadoPrestamo.ACTIVO
    )
    
    prestamos_db[prestamo_counter] = prestamo
    prestamo_counter += 1
    
    return prestamo

@app.get("/prestamos", response_model=List[Prestamo])
async def listar_prestamos():
    return list(prestamos_db.values())

@app.get("/prestamos/usuario/{usuario_id}", response_model=List[Prestamo])
async def obtener_prestamos_usuario(usuario_id: int):
    return [p for p in prestamos_db.values() if p.usuario_id == usuario_id]

@app.get("/prestamos/{prestamo_id}", response_model=Prestamo)
async def obtener_prestamo(prestamo_id: int):
    if prestamo_id not in prestamos_db:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamos_db[prestamo_id]

@app.post("/prestamos/{prestamo_id}/devolver")
async def devolver_libro(prestamo_id: int):
    if prestamo_id not in prestamos_db:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    
    prestamo = prestamos_db[prestamo_id]
    prestamo.fecha_devolucion_real = datetime.now()
    prestamo.estado = EstadoPrestamo.DEVUELTO
    
    # Calcular multa si hay retraso
    if prestamo.fecha_devolucion_real > prestamo.fecha_devolucion_esperada:
        dias_retraso = (prestamo.fecha_devolucion_real - prestamo.fecha_devolucion_esperada).days
        prestamo.multa = dias_retraso * 2.0
    
    return {"message": "Libro devuelto exitosamente", "multa": prestamo.multa}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "prestamos", "total_prestamos": len(prestamos_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)