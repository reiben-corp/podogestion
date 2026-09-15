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


def ensure_admin():
    """
    Garantiza que siempre exista un usuario admin activo.
    
    - Si no existe: lo crea con la contraseña por defecto.
    - Si existe y ENVIRONMENT=development: resetea la contraseña al valor por defecto
      para evitar perder acceso durante el desarrollo.
    - Si existe y ENVIRONMENT=production: NO modifica la contraseña, solo verifica
      que esté activo y tenga rol admin.
    
    La contraseña se lee de la variable de entorno ADMIN_DEFAULT_PASSWORD
    (default: "admin123456").
    """
    db = SessionLocal()
    try:
        from app.models.user import User, UserRole
        from app.core.security import get_password_hash
        
        admin_password = "admin123456"  # TODO: leer de variable de entorno
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if not admin_user:
            # Crear admin desde cero
            admin_user = User(
                username="admin",
                email="admin@clinica.com",
                hashed_password=get_password_hash(admin_password),
                full_name="Administrador",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("🔐 ADMIN CREADO - username: admin / password: " + admin_password)
        elif settings.ENVIRONMENT == "development":
            # En desarrollo: resetea contraseña para evitar bloqueos
            admin_user.hashed_password = get_password_hash(admin_password)
            admin_user.is_active = True
            admin_user.role = UserRole.ADMIN
            db.commit()
            print("🔐 ADMIN RESET (development) - password: " + admin_password)
        else:
            # En producción: solo garantizar que está activo
            if not admin_user.is_active or admin_user.role != UserRole.ADMIN:
                admin_user.is_active = True
                admin_user.role = UserRole.ADMIN
                db.commit()
                print("🔐 ADMIN REACTIVADO (production)")
            else:
                print("✅ Admin verificado")
                
    except Exception as e:
        db.rollback()
        print(f"⚠️ Error en ensure_admin: {e}")
    finally:
        db.close()


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


def aplicar_configuracion_documentos():
    """Aplica la ruta de documentos de consentimiento desde la configuración."""
    db = SessionLocal()
    try:
        from app.models.configuracion import Configuracion
        from app.core.static_files import set_documentos_dir
        
        config = db.query(Configuracion).filter(
            Configuracion.clave == "documentos_ruta"
        ).first()
        
        if config and config.valor:
            set_documentos_dir(config.valor)
            print(f"📁 Ruta de documentos configurada: {config.valor}")
    except Exception as e:
        print(f"⚠️ Error aplicando configuración de documentos: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evento de inicio de la aplicación."""
    # Startup
    ensure_admin()
    seed_configuraciones()
    aplicar_configuracion_documentos()
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
