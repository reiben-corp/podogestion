"""
Configuración de la base de datos SQLAlchemy.
Crea el engine, la sesión y la base para los modelos.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Engine: conexión a PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica que la conexión esté viva antes de usarla
    echo=False,  # True para ver SQL en consola (útil en desarrollo)
)

# SessionLocal: fábrica de sesiones (cada petición obtiene una)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base: clase base para todos los modelos ORM
Base = declarative_base()


def get_db():
    """
    Dependencia de FastAPI que proporciona una sesión de BD.
    Se usa con 'Depends(get_db)' en los endpoints.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
