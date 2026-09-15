"""
Esquemas Pydantic para validación de datos de pacientes.
"""
from datetime import datetime, date
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any

from app.models.paciente import EstadoCivil, Sexo


# ── Esquemas base ──

class PacienteBase(BaseModel):
    """Campos comunes de paciente."""
    nombre: str = Field(..., min_length=1, max_length=100)
    apellidos: str = Field(..., min_length=1, max_length=150)
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[Sexo] = None
    dni: str = Field(..., max_length=20, description="DNI del paciente (obligatorio y único)")
    estado_civil: Optional[EstadoCivil] = None
    profesion: Optional[str] = Field(None, max_length=100)
    
    telefono: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = Field(None, max_length=10)
    contacto_emergencia: Optional[str] = Field(None, max_length=200)
    telefono_emergencia: Optional[str] = Field(None, max_length=20)
    
    alergias: Optional[str] = None
    medicacion_actual: Optional[str] = None
    antecedentes: Optional[str] = None
    
    diabetes: bool = False
    diabetes_detalle: Optional[str] = None
    problemas_cardiovasculares: bool = False
    problemas_cardiovasculares_detalle: Optional[str] = None
    problemas_coagulacion: bool = False
    problemas_coagulacion_detalle: Optional[str] = None
    enfermedades_reumaticas: bool = False
    enfermedades_reumaticas_detalle: Optional[str] = None
    enfermedades_neurologicas: bool = False
    enfermedades_neurologicas_detalle: Optional[str] = None
    enfermedades_oseas: bool = False
    enfermedades_oseas_detalle: Optional[str] = None
    hepatitis_vih: bool = False
    hepatitis_vih_detalle: Optional[str] = None
    embarazada: bool = False
    embarazada_detalle: Optional[str] = None
    
    cirugias_previas: Optional[str] = None
    traumatismos_pies: bool = False
    traumatismos_pies_detalle: Optional[str] = None
    plantillas_previas: bool = False
    plantillas_previas_detalle: Optional[str] = None
    
    deporte: bool = False
    frecuencia_deporte: Optional[str] = None
    tipo_calzado: Optional[str] = None
    horas_pie_dia: Optional[int] = None
    fumador: bool = False
    
    # Documento de consentimiento digitalizado (ruta al archivo)
    documento_consentimiento: Optional[str] = None


# ── Requests ──

class PacienteCreate(PacienteBase):
    """Datos para crear un paciente."""
    consentimiento_datos: bool = False
    consentimiento_tratamiento: bool = False
    documento_consentimiento: Optional[str] = Field(None, max_length=500, description="Ruta al documento digitalizado de consentimiento")
    datos_extra: Optional[Dict[str, Any]] = None


class PacienteUpdate(BaseModel):
    """Datos actualizables de paciente (todos opcionales)."""
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    sexo: Optional[Sexo] = None
    dni: Optional[str] = Field(None, max_length=20, description="DNI del paciente - no se puede cambiar a uno existente")
    estado_civil: Optional[EstadoCivil] = None
    profesion: Optional[str] = None
    
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    
    alergias: Optional[str] = None
    medicacion_actual: Optional[str] = None
    antecedentes: Optional[str] = None
    
    diabetes: Optional[bool] = None
    diabetes_detalle: Optional[str] = None
    problemas_cardiovasculares: Optional[bool] = None
    problemas_cardiovasculares_detalle: Optional[str] = None
    problemas_coagulacion: Optional[bool] = None
    problemas_coagulacion_detalle: Optional[str] = None
    enfermedades_reumaticas: Optional[bool] = None
    enfermedades_reumaticas_detalle: Optional[str] = None
    enfermedades_neurologicas: Optional[bool] = None
    enfermedades_neurologicas_detalle: Optional[str] = None
    enfermedades_oseas: Optional[bool] = None
    enfermedades_oseas_detalle: Optional[str] = None
    hepatitis_vih: Optional[bool] = None
    hepatitis_vih_detalle: Optional[str] = None
    embarazada: Optional[bool] = None
    embarazada_detalle: Optional[str] = None
    
    cirugias_previas: Optional[str] = None
    traumatismos_pies: Optional[bool] = None
    traumatismos_pies_detalle: Optional[str] = None
    plantillas_previas: Optional[bool] = None
    plantillas_previas_detalle: Optional[str] = None
    
    deporte: Optional[bool] = None
    frecuencia_deporte: Optional[str] = None
    tipo_calzado: Optional[str] = None
    horas_pie_dia: Optional[int] = None
    fumador: Optional[bool] = None
    
    consentimiento_datos: Optional[bool] = None
    consentimiento_tratamiento: Optional[bool] = None
    documento_consentimiento: Optional[str] = Field(None, max_length=500, description="Ruta al documento de consentimiento digitalizado")
    datos_extra: Optional[Dict[str, Any]] = None


# ── Responses ──

class PacienteResponse(PacienteBase):
    """Datos del paciente que se devuelven al cliente."""
    id: int
    codigo_paciente: str
    consentimiento_datos: bool
    consentimiento_fecha: Optional[datetime] = None
    consentimiento_tratamiento: bool
    consentimiento_fecha_tratamiento: Optional[datetime] = None
    documento_consentimiento: Optional[str] = None
    edad: int = 0
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PacienteListResponse(BaseModel):
    """Respuesta paginada de lista de pacientes."""
    total: int
    pagina: int
    por_pagina: int
    pacientes: list[PacienteResponse]
