"""
Punto de entrada de la aplicación FastAPI.
Configura la app, middleware y registra los routers.
"""
import sys
sys.path.insert(0, '.')

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, pacientes, citas, historias, facturacion, inventario, estadisticas, admin, users, configuracion, documentos

# Crear tablas en la base de datos (solo para desarrollo; en producción usar Alembic)
Base.metadata.create_all(bind=engine)


def seed_configuraciones():
    """Inserta las configuraciones por defecto si no existen."""
    db = SessionLocal()
    try:
        from app.models.configuracion import Configuracion
        
        defaults = [
            {
                "clave": "clinica_nombre",
                "valor": "Clínica Podológica",
                "descripcion": "Nombre de la clínica que aparece en el dashboard",
            },
            {
                "clave": "clinica_direccion",
                "valor": "Calle Principal 123, Madrid",
                "descripcion": "Dirección de la clínica que aparece en el dashboard",
            },
            {
                "clave": "clinica_telefono",
                "valor": "912 345 678",
                "descripcion": "Teléfono de contacto",
            },
            {
                "clave": "clinica_email",
                "valor": "info@clinica-podologica.es",
                "descripcion": "Email de contacto",
            },
            {
                "clave": "documentos_ruta",
                "valor": "documentos_consentimiento",
                "descripcion": "Ruta de almacenamiento de documentos de consentimiento",
            },
        ]
        
        for item in defaults:
            existente = db.query(Configuracion).filter(
                Configuracion.clave == item["clave"]
            ).first()
            if not existente:
                config = Configuracion(**item)
                db.add(config)
                print(f"✅ Creada configuración: {item['clave']}")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error en seed de configuraciones: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evento de inicio de la aplicación."""
    # Startup
    seed_configuraciones()
    yield
    # Shutdown (si se necesita)


# Crear aplicación FastAPI
app = FastAPI(
    title="Clínica Podología API",
    description="API de gestión integral para clínica de podología",
    version="0.1.0",
    docs_url="/docs",  # Documentación Swagger automática
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS (Cross-Origin Resource Sharing) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Registrar routers ──
app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(citas.router)
app.include_router(historias.router)
app.include_router(facturacion.router)
app.include_router(inventario.router)
app.include_router(estadisticas.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(configuracion.router)
app.include_router(documentos.router)


# ── Endpoints de salud ──

@app.get("/api/health", tags=["Sistema"])
async def health_check():
    return {
        "status": "ok",
        "message": "Sistema funcionando correctamente",
        "version": "0.1.0"
    }


@app.get("/", tags=["Sistema"])
async def root():
    return {
        "message": "API Clínica Podología",
        "docs": "/docs",
        "health": "/api/health"
    }
