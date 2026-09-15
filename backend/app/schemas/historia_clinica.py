"""
Esquemas Pydantic para historia clínica.
"""
from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.models.historia_clinica import TipoExploracion, TipoTratamiento


# ── Exploración Biomecánica ──

class ExploracionBase(BaseModel):
    tipo: TipoExploracion
    datos: Optional[Dict[str, Any]] = None
    resultado: Optional[str] = None
    observaciones: Optional[str] = None


class ExploracionCreate(ExploracionBase):
    pass


class ExploracionResponse(ExploracionBase):
    id: int
    historia_id: int
    fecha: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ── Tratamiento ──

class TratamientoBase(BaseModel):
    tipo: TipoTratamiento
    descripcion: str
    zona: Optional[str] = None
    pie: Optional[str] = None
    resultado: Optional[str] = None
    observaciones: Optional[str] = None


class TratamientoCreate(TratamientoBase):
    pass


class TratamientoResponse(TratamientoBase):
    id: int
    historia_id: int
    fecha: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ── Podograma ──

class PodogramaBase(BaseModel):
    pie: str  # "izquierdo" o "derecho"
    datos: Dict[str, Any] = Field(default_factory=dict)
    imagen: Optional[str] = None
    observaciones: Optional[str] = None


class PodogramaCreate(PodogramaBase):
    pass


class PodogramaResponse(PodogramaBase):
    id: int
    historia_id: int
    fecha: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


# ── Historia Clínica ──

class HistoriaClinicaBase(BaseModel):
    motivo_consulta: Optional[str] = None
    antecedentes_personales: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    exploracion_fisica: Optional[str] = None
    diagnostico: Optional[str] = None
    codigo_diagnostico: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    evolucion: Optional[str] = None
    observaciones: Optional[str] = None


class HistoriaClinicaCreate(HistoriaClinicaBase):
    paciente_id: int
    profesional_id: int
    exploraciones: Optional[List[ExploracionCreate]] = []
    tratamientos: Optional[List[TratamientoCreate]] = []
    podogramas: Optional[List[PodogramaCreate]] = []


class HistoriaClinicaUpdate(BaseModel):
    motivo_consulta: Optional[str] = None
    antecedentes_personales: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    exploracion_fisica: Optional[str] = None
    diagnostico: Optional[str] = None
    codigo_diagnostico: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    evolucion: Optional[str] = None
    observaciones: Optional[str] = None


class HistoriaClinicaResponse(HistoriaClinicaBase):
    id: int
    numero_historia: str
    paciente_id: int
    profesional_id: int
    fecha_consulta: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Datos relacionados
    paciente_nombre: Optional[str] = None
    profesional_nombre: Optional[str] = None
    exploraciones: List[ExploracionResponse] = []
    tratamientos: List[TratamientoResponse] = []
    podogramas: List[PodogramaResponse] = []
    
    class Config:
        from_attributes = True


class HistoriaClinicaListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    historias: List[HistoriaClinicaResponse]


# ── Resumen de historia (para listados) ──

class HistoriaResumen(BaseModel):
    id: int
    numero_historia: str
    paciente_id: int
    paciente_nombre: Optional[str] = None
    fecha_consulta: datetime
    motivo_consulta: Optional[str] = None
    diagnostico: Optional[str] = None
    
    class Config:
        from_attributes = True
