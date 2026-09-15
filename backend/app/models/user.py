"""
Modelo SQLAlchemy para la tabla de usuarios.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """Roles disponibles en el sistema."""
    ADMIN = "admin"
    MEDICO = "medico"
    ASISTENTE = "asistente"


class User(Base):
    """Tabla de usuarios del sistema."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ASISTENTE, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Auditoría
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relaciones
    citas = relationship("Cita", back_populates="profesional")
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
