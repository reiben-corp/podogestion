"""
Modelo SQLAlchemy para la tabla de pacientes.
Incluye datos demográficos y consentimientos GDPR.
"""
from datetime import datetime, date
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.core.database import Base


class EstadoCivil(str, enum.Enum):
    SOLTERO = "soltero"
    CASADO = "casado"
    DIVORCIADO = "divorciado"
    VIUDO = "viudo"
    PAREJA_HECHO = "pareja_hecho"


class Sexo(str, enum.Enum):
    MASCULINO = "masculino"
    FEMENINO = "femenino"
    OTRO = "otro"


class Paciente(Base):
    """Tabla de pacientes de la clínica."""
    __tablename__ = "pacientes"
    
    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    # numero_historia: formato PAC-{id:05d} (ej: PAC-00001, PAC-00002).
    # Se genera en el servicio DESPUÉS de flush/commit, cuando el id ya está asignado.
    # Ejemplo: self.numero_historia = f"PAC-{self.id:05d}"
    numero_historia = Column(String(20), unique=True, index=True, nullable=False)
    
    # Datos demográficos
    nombre = Column(String(100), nullable=False)
    apellidos = Column(String(150), nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    sexo = Column(Enum(Sexo), nullable=True)
    dni = Column(String(20), unique=True, nullable=False)
    estado_civil = Column(Enum(EstadoCivil), nullable=True)
    profesion = Column(String(100), nullable=True)
    
    # Contacto
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    direccion = Column(String(255), nullable=True)
    ciudad = Column(String(100), nullable=True)
    codigo_postal = Column(String(10), nullable=True)
    contacto_emergencia = Column(String(200), nullable=True)
    telefono_emergencia = Column(String(20), nullable=True)
    
    # Datos médicos básicos
    alergias = Column(Text, nullable=True)
    medicacion_actual = Column(Text, nullable=True)
    antecedentes = Column(Text, nullable=True)
    
    # Antecedentes de salud - checks
    diabetes = Column(Boolean, default=False)
    diabetes_detalle = Column(Text, nullable=True)
    problemas_cardiovasculares = Column(Boolean, default=False)
    problemas_cardiovasculares_detalle = Column(Text, nullable=True)
    problemas_coagulacion = Column(Boolean, default=False)
    problemas_coagulacion_detalle = Column(Text, nullable=True)
    enfermedades_reumaticas = Column(Boolean, default=False)
    enfermedades_reumaticas_detalle = Column(Text, nullable=True)
    enfermedades_neurologicas = Column(Boolean, default=False)
    enfermedades_neurologicas_detalle = Column(Text, nullable=True)
    enfermedades_oseas = Column(Boolean, default=False)
    enfermedades_oseas_detalle = Column(Text, nullable=True)
    hepatitis_vih = Column(Boolean, default=False)
    hepatitis_vih_detalle = Column(Text, nullable=True)
    embarazada = Column(Boolean, default=False)
    embarazada_detalle = Column(Text, nullable=True)
    
    # Antecedentes podológicos
    cirugias_previas = Column(Text, nullable=True)
    traumatismos_pies = Column(Boolean, default=False)
    traumatismos_pies_detalle = Column(Text, nullable=True)
    plantillas_previas = Column(Boolean, default=False)
    plantillas_previas_detalle = Column(Text, nullable=True)
    
    # Estilo de vida
    deporte = Column(Boolean, default=False)
    frecuencia_deporte = Column(Text, nullable=True)
    tipo_calzado = Column(String(50), nullable=True)
    horas_pie_dia = Column(Integer, nullable=True)
    fumador = Column(Boolean, default=False)
    
    # Consentimientos GDPR/LOPD
    consentimiento_datos = Column(Boolean, default=False)
    consentimiento_fecha = Column(DateTime, nullable=True)
    consentimiento_tratamiento = Column(Boolean, default=False)
    consentimiento_fecha_tratamiento = Column(DateTime, nullable=True)
    documento_consentimiento = Column(String(500), nullable=True)
    
    # Datos adicionales flexibles (JSONB)
    datos_extra = Column(JSONB, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    def __repr__(self):
        return f"<Paciente {self.nombre} {self.apellidos}>"
    
    @property
    def nombre_completo(self) -> str:
        return f"{self.nombre} {self.apellidos}"
    
    @property
    def edad(self) -> int:
        """Calcula la edad a partir de la fecha de nacimiento."""
        if self.fecha_nacimiento:
            today = date.today()
            return today.year - self.fecha_nacimiento.year - (
                (today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day)
            )
        return 0
