"""
Modelo SQLAlchemy para la historia clínica.
Incluye exploraciones biomecánicas, estudios de la pisada y tratamientos.
Basado en protocolos de historia clínica podológica profesional.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, Enum, ForeignKey, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TipoExploracion(str, enum.Enum):
    """Tipos de exploración biomecánica."""
    ESTATICA = "estatica"
    DINAMICA = "dinamica"
    MARCHA = "marcha"
    CARRERA = "carrera"
    EQUILIBRIO = "equilibrio"


class TipoTratamiento(str, enum.Enum):
    """Tipos de tratamiento podológico."""
    QUIROPODIA = "quiropodologia"
    ORTESIS = "ortesis"
    PLANTILLAS = "plantillas"
    REHABILITACION = "rehabilitacion"
    CIRUGIA = "cirurgia"
    OTRO = "otro"


class HistoriaClinica(Base):
    """Tabla de historia clínica del paciente."""
    __tablename__ = "historias_clinicas"
    
    id = Column(Integer, primary_key=True, index=True)
    # numero_historia: formato HC-{paciente_id:05d}-{num_consulta:03d}
    # donde num_consulta es el número de consulta de ESE paciente (1, 2, 3...).
    # Se genera en el servicio tras contar las historias previas del paciente.
    # Ejemplo: HC-00001-001, HC-00001-002, HC-00002-001
    numero_historia = Column(String(20), unique=True, index=True, nullable=False)
    
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    profesional_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Fecha de la consulta
    fecha_consulta = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), nullable=False)
    
    # 1. Motivo de consulta
    motivo_consulta = Column(Text, nullable=True)
    
    # 2. Antecedentes médicos generales
    antecedentes_personales = Column(Text, nullable=True)
    antecedentes_familiares = Column(Text, nullable=True)
    
    # 3. Exploración física
    exploracion_fisica = Column(Text, nullable=True)
    
    # 4. Diagnóstico
    diagnostico = Column(Text, nullable=True)
    codigo_diagnostico = Column(String(20), nullable=True)  # CIAP-2 o similar
    
    # 5. Plan de tratamiento
    plan_tratamiento = Column(Text, nullable=True)
    
    # 6. Evolución/Notas de evolucion
    evolucion = Column(Text, nullable=True)
    
    # 7. Observaciones generales
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relaciones
    paciente = relationship("Paciente", backref="historias_clinicas")
    profesional = relationship("User", backref="historias_clinicas")
    exploraciones = relationship("ExploracionBiomecanica", back_populates="historia", cascade="all, delete-orphan")
    tratamientos = relationship("Tratamiento", back_populates="historia", cascade="all, delete-orphan")
    podogramas = relationship("Podograma", back_populates="historia", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<HistoriaClinica {self.numero_historia} - Paciente {self.paciente_id}>"


class ExploracionBiomecanica(Base):
    """Tabla de exploraciones biomecánicas."""
    __tablename__ = "exploraciones_biomecanicas"
    
    id = Column(Integer, primary_key=True, index=True)
    historia_id = Column(Integer, ForeignKey("historias_clinicas.id"), nullable=False)
    
    tipo = Column(Enum(TipoExploracion), nullable=False)
    fecha = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Datos de la exploración (flexible según tipo)
    datos = Column(JSONB, nullable=True)
    
    # Resultados
    resultado = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relación
    historia = relationship("HistoriaClinica", back_populates="exploraciones")
    
    def __repr__(self):
        return f"<ExploracionBiomecanica {self.id} - {self.tipo}>"


class Tratamiento(Base):
    """Tabla de tratamientos realizados."""
    __tablename__ = "tratamientos"
    
    id = Column(Integer, primary_key=True, index=True)
    historia_id = Column(Integer, ForeignKey("historias_clinicas.id"), nullable=False)
    
    tipo = Column(Enum(TipoTratamiento), nullable=False)
    fecha = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Descripción del tratamiento
    descripcion = Column(Text, nullable=False)
    
    # Zona tratada
    zona = Column(String(100), nullable=True)  # Ej: "Hallux", "Metatarso", etc.
    pie = Column(String(10), nullable=True)  # "izquierdo", "derecho", "ambos"
    
    # Resultados
    resultado = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relación
    historia = relationship("HistoriaClinica", back_populates="tratamientos")
    
    def __repr__(self):
        return f"<Tratamiento {self.id} - {self.tipo}>"


class Podograma(Base):
    """Tabla de podogramas (registro visual del pie)."""
    __tablename__ = "podogramas"
    
    id = Column(Integer, primary_key=True, index=True)
    historia_id = Column(Integer, ForeignKey("historias_clinicas.id"), nullable=False)
    
    fecha = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    pie = Column(String(10), nullable=False)  # "izquierdo" o "derecho"
    
    # Datos del podograma (puntos de presión, zonas, etc.)
    # Estructura JSON: {"puntos": [{"x": 10, "y": 20, "presion": 50}], "zonas": [...]}
    datos = Column(JSONB, nullable=False, default=dict)
    
    # Imagen generada (base64 o URL)
    imagen = Column(Text, nullable=True)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relación
    historia = relationship("HistoriaClinica", back_populates="podogramas")
    
    def __repr__(self):
        return f"<Podograma {self.id} - Pie {self.pie}>"
