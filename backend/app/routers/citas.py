"""
Endpoints de gestión de citas y agenda.
"""
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.cita import Cita, EstadoCita
from app.schemas.cita import (
    CitaCreate, CitaUpdate, CitaResponse, CitaListResponse, AgendaDiaResponse
)
from app.services.cita_service import (
    crear_cita, verificar_disponibilidad, obtener_citas_dia, cambiar_estado_cita
)

router = APIRouter(prefix="/api/citas", tags=["Citas"], redirect_slashes=False)


def enriquecer_cita(cita: Cita) -> CitaResponse:
    """Agrega nombres de paciente y profesional a la respuesta."""
    return CitaResponse(
        id=cita.id,
        paciente_id=cita.paciente_id,
        profesional_id=cita.profesional_id,
        fecha=cita.fecha,
        hora_inicio=cita.hora_inicio,
        hora_fin=cita.hora_fin,
        motivo=cita.motivo,
        notas=cita.notas,
        estado=cita.estado,
        recordatorio_enviado=cita.recordatorio_enviado,
        created_at=cita.created_at,
        updated_at=cita.updated_at,
        paciente_nombre=cita.paciente.nombre_completo if cita.paciente else None,
        profesional_nombre=cita.profesional.full_name if cita.profesional else None
    )


@router.post("/", response_model=CitaResponse, status_code=201)
async def crear_nueva_cita(
    cita_data: CitaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea una nueva cita.
    Solo requiere: paciente, fecha, hora inicio, hora fin, motivo, notas.
    El estado por defecto es CONFIRMADA.
    """
    try:
        cita = crear_cita(
            db=db,
            paciente_id=cita_data.paciente_id,
            fecha=cita_data.fecha,
            hora_inicio=cita_data.hora_inicio,
            hora_fin=cita_data.hora_fin,
            motivo=cita_data.motivo,
            notas=cita_data.notas
        )
        return CitaResponse.model_validate(cita)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=CitaListResponse)
async def listar_citas(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    profesional_id: Optional[int] = Query(None),
    estado: Optional[EstadoCita] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista citas con filtros opcionales.
    """
    query = db.query(Cita).filter(Cita.is_active == True)
    
    if fecha_desde:
        query = query.filter(Cita.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Cita.fecha <= fecha_hasta)
    if profesional_id:
        query = query.filter(Cita.profesional_id == profesional_id)
    if estado:
        query = query.filter(Cita.estado == estado)
    
    total = query.count()
    offset = (pagina - 1) * por_pagina
    citas = query.order_by(Cita.fecha.desc(), Cita.hora_inicio).offset(offset).limit(por_pagina).all()
    
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "citas": [enriquecer_cita(c) for c in citas]
    }


@router.get("/dia/{fecha}", response_model=AgendaDiaResponse)
async def obtener_agenda_dia(
    fecha: date,
    profesional_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todas las citas de un día específico (vista de agenda).
    """
    citas = obtener_citas_dia(db, fecha, profesional_id)
    
    return {
        "fecha": fecha,
        "total_citas": len(citas),
        "citas": [enriquecer_cita(c) for c in citas]
    }


@router.get("/{cita_id}", response_model=CitaResponse)
async def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene los datos de una cita específica.
    """
    cita = db.query(Cita).filter(
        Cita.id == cita_id,
        Cita.is_active == True
    ).first()
    
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    return enriquecer_cita(cita)


@router.put("/{cita_id}", response_model=CitaResponse)
async def actualizar_cita(
    cita_id: int,
    cita_data: CitaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza los datos de una cita.
    """
    cita = db.query(Cita).filter(
        Cita.id == cita_id,
        Cita.is_active == True
    ).first()
    
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    # Actualizar campos proporcionados
    update_data = cita_data.model_dump(exclude_unset=True)
    
    # Verificar disponibilidad si cambia horario
    if any(k in update_data for k in ["fecha", "hora_inicio", "hora_fin"]):
        nueva_fecha = update_data.get("fecha", cita.fecha)
        nueva_hora_inicio = update_data.get("hora_inicio", cita.hora_inicio)
        nueva_hora_fin = update_data.get("hora_fin", cita.hora_fin)
        
        if not verificar_disponibilidad(db, nueva_fecha, nueva_hora_inicio, nueva_hora_fin, cita_excluir_id=cita_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una cita en ese horario"
            )
    
    for campo, valor in update_data.items():
        setattr(cita, campo, valor)
    
    db.commit()
    db.refresh(cita)
    
    return enriquecer_cita(cita)


@router.patch("/{cita_id}/estado", response_model=CitaResponse)
async def actualizar_estado_cita(
    cita_id: int,
    estado: EstadoCita,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cambia el estado de una cita (confirmar, cancelar, completar, etc.).
    """
    try:
        cita = cambiar_estado_cita(db, cita_id, estado)
        return enriquecer_cita(cita)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{cita_id}", status_code=204)
async def eliminar_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina una cita (soft delete).
    """
    cita = db.query(Cita).filter(
        Cita.id == cita_id,
        Cita.is_active == True
    ).first()
    
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    
    cita.is_active = False
    db.commit()
    
    return None


@router.get("/disponibilidad/{profesional_id}")
async def consultar_disponibilidad(
    profesional_id: int,
    fecha: date = Query(...),
    hora_inicio: str = Query(..., description="Formato HH:MM"),
    hora_fin: str = Query(..., description="Formato HH:MM"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Consulta si un profesional tiene disponibilidad en un horario específico.
    """
    from datetime import time as time_module
    try:
        h_inicio = datetime.strptime(hora_inicio, "%H:%M").time()
        h_fin = datetime.strptime(hora_fin, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de hora inválido. Use HH:MM"
        )
    
    disponible = verificar_disponibilidad(db, profesional_id, fecha, h_inicio, h_fin)
    
    return {
        "profesional_id": profesional_id,
        "fecha": fecha,
        "hora_inicio": hora_inicio,
        "hora_fin": hora_fin,
        "disponible": disponible
    }
