from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

app = FastAPI(title="Microservicio de Catálogo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Categoria(str, Enum):
    CIENCIAS = "ciencias"
    HUMANIDADES = "humanidades"
    TECNOLOGIA = "tecnologia"
    LITERATURA = "literatura"
    ARTES = "artes"

class Autor(BaseModel):
    id: int
    nombre: str
    nacionalidad: str

class Libro(BaseModel):
    id: int
    titulo: str
    autor_id: int
    categoria: Categoria
    isbn: str
    año_publicacion: int
    editorial: str
    ejemplares_disponibles: int
    ejemplares_totales: int

# Base de datos simulada
autores_db = {
    1: Autor(id=1, nombre="Gabriel García Márquez", nacionalidad="Colombiana"),
    2: Autor(id=2, nombre="Isaac Asimov", nacionalidad="Rusa"),
    3: Autor(id=3, nombre="Jane Austen", nacionalidad="Británica")
}

libros_db = {
    1: Libro(
        id=1, 
        titulo="Cien años de soledad", 
        autor_id=1, 
        categoria=Categoria.LITERATURA,
        isbn="978-0307474728", 
        año_publicacion=1967, 
        editorial="Sudamericana",
        ejemplares_disponibles=5, 
        ejemplares_totales=8
    ),
    2: Libro(
        id=2, 
        titulo="Fundación", 
        autor_id=2, 
        categoria=Categoria.CIENCIAS,
        isbn="978-0553293357", 
        año_publicacion=1951, 
        editorial="Gnome Press",
        ejemplares_disponibles=3, 
        ejemplares_totales=5
    ),
    3: Libro(
        id=3, 
        titulo="Orgullo y prejuicio", 
        autor_id=3, 
        categoria=Categoria.LITERATURA,
        isbn="978-0141439518", 
        año_publicacion=1813, 
        editorial="T. Egerton",
        ejemplares_disponibles=7, 
        ejemplares_totales=10
    )
}

@app.get("/")
async def root():
    return {"message": "Microservicio de Catálogo funcionando"}

@app.get("/libros", response_model=List[Libro])
async def listar_libros():
    return list(libros_db.values())

@app.get("/libros/{libro_id}", response_model=Libro)
async def obtener_libro(libro_id: int):
    if libro_id not in libros_db:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return libros_db[libro_id]

@app.get("/autores", response_model=List[Autor])
async def listar_autores():
    return list(autores_db.values())

@app.get("/autores/{autor_id}", response_model=Autor)
async def obtener_autor(autor_id: int):
    if autor_id not in autores_db:
        raise HTTPException(status_code=404, detail="Autor no encontrado")
    return autores_db[autor_id]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "catalogo", "total_libros": len(libros_db)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)