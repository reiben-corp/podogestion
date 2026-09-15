"""
Endpoints de gestión de historia clínica.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.historia_clinica import HistoriaClinica
from app.schemas.historia_clinica import (
    HistoriaClinicaCreate, HistoriaClinicaUpdate, 
    HistoriaClinicaResponse, HistoriaClinicaListResponse,
    ExploracionCreate, TratamientoCreate, PodogramaCreate
)
from app.services.historia_service import (
    crear_historia_completa, obtener_historias_paciente, 
    obtener_ultima_consulta, enriquecer_historia
)

router = APIRouter(prefix="/api/historias", tags=["Historia Clínica"])


@router.post("/", response_model=HistoriaClinicaResponse, status_code=201)
async def crear_historia(
    historia_data: HistoriaClinicaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea una nueva historia clínica para un paciente.
    Puede incluir exploraciones biomecánicas, tratamientos y podogramas.
    """
    try:
        historia = crear_historia_completa(
            db=db,
            paciente_id=historia_data.paciente_id,
            profesional_id=historia_data.profesional_id,
            motivo_consulta=historia_data.motivo_consulta,
            antecedentes_personales=historia_data.antecedentes_personales,
            antecedentes_familiares=historia_data.antecedentes_familiares,
            exploracion_fisica=historia_data.exploracion_fisica,
            diagnostico=historia_data.diagnostico,
            codigo_diagnostico=historia_data.codigo_diagnostico,
            plan_tratamiento=historia_data.plan_tratamiento,
            evolucion=historia_data.evolucion,
            observaciones=historia_data.observaciones,
            exploraciones=historia_data.exploraciones,
            tratamientos=historia_data.tratamientos,
            podogramas=historia_data.podogramas
        )
        return enriquecer_historia(historia)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=HistoriaClinicaListResponse)
async def listar_historias(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(100, ge=1, le=200),
    paciente_id: Optional[int] = Query(None),
    busqueda: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista historias clínicas con filtros opcionales.
    """
    from app.models.paciente import Paciente
    
    query = db.query(HistoriaClinica).filter(HistoriaClinica.is_active == True)
    
    if paciente_id:
        query = query.filter(HistoriaClinica.paciente_id == paciente_id)
    
    if busqueda:
        filtro = f"%{busqueda}%"
        query = query.join(Paciente).filter(
            (Paciente.nombre.ilike(filtro)) |
            (Paciente.apellidos.ilike(filtro)) |
            (Paciente.dni.ilike(filtro)) |
            (HistoriaClinica.numero_historia.ilike(filtro)) |
            (HistoriaClinica.motivo_consulta.ilike(filtro))
        )
    
    total = query.count()
    offset = (pagina - 1) * por_pagina
    historias = query.order_by(HistoriaClinica.fecha_consulta.desc()).offset(offset).limit(por_pagina).all()
    
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "historias": [enriquecer_historia(h) for h in historias]
    }


@router.get("/{historia_id}", response_model=HistoriaClinicaResponse)
async def obtener_historia(
    historia_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene una historia clínica por su ID.
    """
    historia = db.query(HistoriaClinica).filter(
        HistoriaClinica.id == historia_id,
        HistoriaClinica.is_active == True
    ).first()
    
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historia clínica no encontrada"
        )
    
    return enriquecer_historia(historia)


@router.put("/{historia_id}", response_model=HistoriaClinicaResponse)
async def actualizar_historia(
    historia_id: int,
    historia_data: HistoriaClinicaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza una historia clínica existente.
    """
    historia = db.query(HistoriaClinica).filter(
        HistoriaClinica.id == historia_id,
        HistoriaClinica.is_active == True
    ).first()
    
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historia clínica no encontrada"
        )
    
    update_data = historia_data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(historia, campo, valor)
    
    db.commit()
    db.refresh(historia)
    
    return enriquecer_historia(historia)


@router.delete("/{historia_id}", status_code=204)
async def eliminar_historia(
    historia_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina una historia clínica (soft delete).
    """
    historia = db.query(HistoriaClinica).filter(
        HistoriaClinica.id == historia_id,
        HistoriaClinica.is_active == True
    ).first()
    
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historia clínica no encontrada"
        )
    
    historia.is_active = False
    db.commit()
    
    return None


@router.get("/paciente/{paciente_id}", response_model=List[HistoriaClinicaResponse])
async def historias_paciente(
    paciente_id: int,
    por_pagina: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todas las historias clínicas de un paciente.
    """
    historias = obtener_historias_paciente(db, paciente_id)
    return [enriquecer_historia(h) for h in historias[:por_pagina]]


@router.get("/paciente/{paciente_id}/ultima", response_model=HistoriaClinicaResponse)
async def ultima_consulta_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la última consulta de un paciente.
    """
    historia = obtener_ultima_consulta(db, paciente_id)
    
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay historias clínicas para este paciente"
        )
    
    return enriquecer_historia(historia)
