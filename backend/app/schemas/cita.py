"""
Esquemas Pydantic para validación de datos de citas.
"""
from datetime import datetime, date, time
from pydantic import BaseModel, Field
from typing import Optional

from app.models.cita import EstadoCita


# ── Esquemas base ──

class CitaBase(BaseModel):
    """Campos comunes de cita."""
    fecha: date
    hora_inicio: time
    hora_fin: time
    motivo: Optional[str] = Field(None, max_length=255)
    notas: Optional[str] = None


# ── Requests ──

class CitaCreate(CitaBase):
    """Datos para crear una cita."""
    paciente_id: int


class CitaUpdate(BaseModel):
    """Datos actualizables de cita (todos opcionales)."""
    fecha: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    motivo: Optional[str] = None
    notas: Optional[str] = None
    estado: Optional[EstadoCita] = None


# ── Responses ──

class CitaResponse(BaseModel):
    """Datos de la cita que se devuelven al cliente."""
    id: int
    paciente_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    motivo: Optional[str] = None
    notas: Optional[str] = None
    estado: EstadoCita
    recordatorio_enviado: bool
    created_at: datetime
    updated_at: datetime
    
    # Datos relacionados
    paciente_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True


class CitaListResponse(BaseModel):
    """Respuesta paginada de lista de citas."""
    total: int
    pagina: int
    por_pagina: int
    citas: list[CitaResponse]


class AgendaDiaResponse(BaseModel):
    """Respuesta de agenda del día."""
    fecha: date
    total_citas: int
    citas: list[CitaResponse]
