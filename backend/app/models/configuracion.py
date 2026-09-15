"""
Modelo SQLAlchemy para la tabla de configuración del sistema.
Almacena valores personalizables como nombre de la clínica y dirección.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, DateTime, Text

from app.core.database import Base


class Configuracion(Base):
    """Tabla de configuración del sistema - clave/valor personalizable."""
    __tablename__ = "configuracion"
    
    id = Column(Integer, primary_key=True, index=True)
    clave = Column(String(100), unique=True, index=True, nullable=False)
    valor = Column(Text, nullable=True)
    descripcion = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
