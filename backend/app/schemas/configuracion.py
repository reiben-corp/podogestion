"""
Esquemas Pydantic para la configuración del sistema.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConfiguracionBase(BaseModel):
    clave: str
    valor: Optional[str] = None
    descripcion: Optional[str] = None


class ConfiguracionCreate(ConfiguracionBase):
    pass


class ConfiguracionUpdate(BaseModel):
    valor: Optional[str] = None
    descripcion: Optional[str] = None


class ConfiguracionResponse(ConfiguracionBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
