from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from enum import Enum

app = FastAPI(title="Microservicio de Reservas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EstadoReserva(str, Enum):
    ACTIVA = "activa"
    CANCELADA = "cancelada"
    COMPLETADA = "completada"
    VENCIDA = "vencida"

class Reserva(BaseModel):
    id: int
    usuario_id: int
    libro_id: int
    fecha_reserva: datetime
    fecha_vencimiento: datetime
    estado: EstadoReserva
    notificado: bool = False

class ReservaCreate(BaseModel):
    usuario_id: int
    libro_id: int

# Base de datos simulada
reservas_db = {}
reserva_counter = 1

@app.get("/")
async def root():
    return {"message": "Microservicio de Reservas funcionando"}

@app.post("/reservas", response_model=Reserva)
async def crear_reserva(reserva_data: ReservaCreate):
    global reserva_counter
    
    fecha_reserva = datetime.now()
    fecha_vencimiento = fecha_reserva + timedelta(days=3)
    
    reserva = Reserva(
        id=reserva_counter,
        usuario_id=reserva_data.usuario_id,
        libro_id=reserva_data.libro_id,
        fecha_reserva=fecha_reserva,
        fecha_vencimiento=fecha_vencimiento,
        estado=EstadoReserva.ACTIVA
    )
    
    reservas_db[reserva_counter] = reserva
    reserva_counter += 1
    
    return reserva

@app.get("/reservas", response_model=List[Reserva])
async def listar_reservas():
    return list(reservas_db.values())

@app.get("/reservas/usuario/{usuario_id}", response_model=List[Reserva])
async def obtener_reservas_usuario(usuario_id: int):
    return [r for r in reservas_db.values() if r.usuario_id == usuario_id]

@app.get("/reservas/{reserva_id}", response_model=Reserva)
async def obtener_reserva(reserva_id: int):
    if reserva_id not in reservas_db:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reservas_db[reserva_id]

@app.post("/reservas/{reserva_id}/cancelar")
async def cancelar_reserva(reserva_id: int):
    if reserva_id not in reservas_db:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    reserva = reservas_db[reserva_id]
    reserva.estado = EstadoReserva.CANCELADA
    
    return {"message": "Reserva cancelada exitosamente"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "reservas", "total_reservas": len(reservas_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)