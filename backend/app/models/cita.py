"""
Modelo SQLAlchemy para la tabla de citas.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class EstadoCita(str, enum.Enum):
    """Estados posibles de una cita."""
    CONFIRMADA = "confirmada"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"
    NO_ASISTE = "no_asiste"


class Cita(Base):
    """Tabla de citas médicas."""
    __tablename__ = "citas"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Relaciones
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    profesional_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Fecha y hora
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    
    # Detalles de la cita
    motivo = Column(String(255), nullable=True)
    notas = Column(Text, nullable=True)
    estado = Column(Enum(EstadoCita), default=EstadoCita.CONFIRMADA, nullable=False)
    
    # Recordatorio
    recordatorio_enviado = Column(Boolean, default=False)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relaciones ORM
    paciente = relationship("Paciente", backref="citas")
    profesional = relationship("User", back_populates="citas")
    
    def __repr__(self):
        return f"<Cita {self.id} - {self.fecha} {self.hora_inicio}>"
