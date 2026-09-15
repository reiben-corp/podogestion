"""
Router para la gestión de configuración del sistema.
Endpoints para obtener y actualizar valores personalizables.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_admin as require_admin
from app.models.configuracion import Configuracion
from app.schemas.configuracion import (
    ConfiguracionCreate,
    ConfiguracionUpdate,
    ConfiguracionResponse,
)

router = APIRouter(prefix="/api/configuracion", tags=["configuracion"], redirect_slashes=False)


@router.get("/", response_model=List[ConfiguracionResponse])
def listar_configuraciones(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Obtener todas las configuraciones."""
    return db.query(Configuracion).all()


@router.get("/public", response_model=dict)
def obtener_configuracion_publica(
    db: Session = Depends(get_db),
):
    """Obtener configuraciones públicas (sin autenticación)."""
    configs = db.query(Configuracion).all()
    return {c.clave: c.valor for c in configs}


@router.get("/{clave}", response_model=ConfiguracionResponse)
def obtener_configuracion(
    clave: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Obtener una configuración por su clave."""
    config = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return config


@router.put("/{clave}", response_model=ConfiguracionResponse)
def actualizar_configuracion(
    clave: str,
    data: ConfiguracionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Actualizar una configuración."""
    config = db.query(Configuracion).filter(Configuracion.clave == clave).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    if data.valor is not None:
        config.valor = data.valor
    if data.descripcion is not None:
        config.descripcion = data.descripcion
    
    db.commit()
    db.refresh(config)
    return config


@router.post("/", response_model=ConfiguracionResponse)
def crear_configuracion(
    data: ConfiguracionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Crear una nueva configuración."""
    existente = db.query(Configuracion).filter(Configuracion.clave == data.clave).first()
    if existente:
        raise HTTPException(status_code=400, detail="La clave ya existe")
    
    config = Configuracion(
        clave=data.clave,
        valor=data.valor,
        descripcion=data.descripcion,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config
