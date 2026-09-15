"""
Endpoints de gestión de pacientes.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

# Zona horaria de España (UTC+2 verano / UTC+1 invierno)
TZ_MADRID = ZoneInfo("Europe/Madrid")

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.paciente import Paciente
from app.schemas.paciente import (
    PacienteCreate, PacienteUpdate, PacienteResponse, PacienteListResponse
)

router = APIRouter(prefix="/api/pacientes", tags=["Pacientes"])

# Formato de codigo_paciente: PAC-{id:05d} (basado en PK, asignado después de flush)


def generar_codigo_paciente(db: Session, paciente_id: int) -> str:
    """
    Genera un código de paciente único.
    Formato: PAC-{id:05d} (basado en PK después de flush)
    """
    return f"PAC-{paciente_id:05d}"


@router.post("/", response_model=PacienteResponse, status_code=201)
async def crear_paciente(
    paciente_data: PacienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo paciente en el sistema.
    Genera automáticamente el código de paciente.
    DNI es obligatorio y único.
    """
    if not paciente_data.dni or not paciente_data.dni.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI es obligatorio"
        )
    
    existente = db.query(Paciente).filter(Paciente.dni == paciente_data.dni).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un paciente con DNI {paciente_data.dni}"
        )
    
    nuevo_paciente = Paciente(
        codigo_paciente="TEMP",  # Se actualizará después de flush con PAC-{id:05d}
        nombre=paciente_data.nombre,
        apellidos=paciente_data.apellidos,
        fecha_nacimiento=paciente_data.fecha_nacimiento,
        sexo=paciente_data.sexo,
        dni=paciente_data.dni,
        estado_civil=paciente_data.estado_civil,
        profesion=paciente_data.profesion,
        telefono=paciente_data.telefono,
        email=paciente_data.email,
        direccion=paciente_data.direccion,
        ciudad=paciente_data.ciudad,
        codigo_postal=paciente_data.codigo_postal,
        contacto_emergencia=paciente_data.contacto_emergencia,
        telefono_emergencia=paciente_data.telefono_emergencia,
        alergias=paciente_data.alergias,
        medicacion_actual=paciente_data.medicacion_actual,
        antecedentes=paciente_data.antecedentes,
        diabetes=paciente_data.diabetes,
        diabetes_detalle=paciente_data.diabetes_detalle,
        problemas_cardiovasculares=paciente_data.problemas_cardiovasculares,
        problemas_cardiovasculares_detalle=paciente_data.problemas_cardiovasculares_detalle,
        problemas_coagulacion=paciente_data.problemas_coagulacion,
        problemas_coagulacion_detalle=paciente_data.problemas_coagulacion_detalle,
        enfermedades_reumaticas=paciente_data.enfermedades_reumaticas,
        enfermedades_reumaticas_detalle=paciente_data.enfermedades_reumaticas_detalle,
        enfermedades_neurologicas=paciente_data.enfermedades_neurologicas,
        enfermedades_neurologicas_detalle=paciente_data.enfermedades_neurologicas_detalle,
        enfermedades_oseas=paciente_data.enfermedades_oseas,
        enfermedades_oseas_detalle=paciente_data.enfermedades_oseas_detalle,
        hepatitis_vih=paciente_data.hepatitis_vih,
        hepatitis_vih_detalle=paciente_data.hepatitis_vih_detalle,
        embarazada=paciente_data.embarazada,
        embarazada_detalle=paciente_data.embarazada_detalle,
        cirugias_previas=paciente_data.cirugias_previas,
        traumatismos_pies=paciente_data.traumatismos_pies,
        traumatismos_pies_detalle=paciente_data.traumatismos_pies_detalle,
        plantillas_previas=paciente_data.plantillas_previas,
        plantillas_previas_detalle=paciente_data.plantillas_previas_detalle,
        deporte=paciente_data.deporte,
        frecuencia_deporte=paciente_data.frecuencia_deporte,
        tipo_calzado=paciente_data.tipo_calzado,
        horas_pie_dia=paciente_data.horas_pie_dia,
        fumador=paciente_data.fumador,
        consentimiento_datos=paciente_data.consentimiento_datos,
        consentimiento_fecha=datetime.now(TZ_MADRID) if paciente_data.consentimiento_datos else None,
        consentimiento_tratamiento=paciente_data.consentimiento_tratamiento,
        consentimiento_fecha_tratamiento=datetime.now(TZ_MADRID) if paciente_data.consentimiento_tratamiento else None,
        datos_extra=paciente_data.datos_extra,
    )
    
    db.add(nuevo_paciente)
    db.flush()  # Para obtener el ID

    # Asignar código de paciente basado en PK: PAC-{id:05d}
    nuevo_paciente.codigo_paciente = f"PAC-{nuevo_paciente.id:05d}"
    
    db.commit()
    db.refresh(nuevo_paciente)
    
    return nuevo_paciente


@router.get("/", response_model=PacienteListResponse)
async def listar_pacientes(
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(100, ge=1, le=200, description="Resultados por página"),
    busqueda: Optional[str] = Query(None, description="Buscar por nombre, apellidos o DNI"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista pacientes con paginación y búsqueda opcional.
    """
    query = db.query(Paciente).filter(Paciente.is_active == True)
    
    if busqueda:
        filtro = f"%{busqueda}%"
        query = query.filter(
            (Paciente.nombre.ilike(filtro)) |
            (Paciente.apellidos.ilike(filtro)) |
            (Paciente.dni.ilike(filtro))
        )
    
    total = query.count()
    offset = (pagina - 1) * por_pagina
    pacientes = query.order_by(Paciente.id.desc()).offset(offset).limit(por_pagina).all()
    
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "pacientes": pacientes
    }


@router.get("/{paciente_id}", response_model=PacienteResponse)
async def obtener_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene los datos completos de un paciente por su ID.
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )
    
    return paciente


@router.put("/{paciente_id}", response_model=PacienteResponse)
async def actualizar_paciente(
    paciente_id: int,
    paciente_data: PacienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza los datos de un paciente existente.
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )
    
    update_data = paciente_data.model_dump(exclude_unset=True)
    
    if "consentimiento_datos" in update_data and update_data["consentimiento_datos"]:
        update_data["consentimiento_fecha"] = datetime.now(TZ_MADRID)
    
    if "consentimiento_tratamiento" in update_data and update_data["consentimiento_tratamiento"]:
        update_data["consentimiento_fecha_tratamiento"] = datetime.now(TZ_MADRID)
    
    # Validar que el DNI no esté siendo usado por otro paciente
    if "dni" in update_data and update_data["dni"]:
        existente = db.query(Paciente).filter(
            Paciente.dni == update_data["dni"],
            Paciente.id != paciente_id
        ).first()
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un paciente con DNI {update_data['dni']}"
            )

    for campo, valor in update_data.items():
        setattr(paciente, campo, valor)
    
    db.commit()
    db.refresh(paciente)
    
    return paciente


@router.get("/{paciente_id}/ultima-consulta", response_model=dict)
async def ultima_consulta(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la última consulta de un paciente.
    """
    from app.services.historia_service import obtener_ultima_consulta, enriquecer_historia
    
    historia = obtener_ultima_consulta(db, paciente_id)
    
    if not historia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay consultas para este paciente"
        )
    
    return enriquecer_historia(historia)


@router.delete("/{paciente_id}", status_code=204)
async def eliminar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina un paciente (soft delete - solo marca como inactivo).
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )
    
    paciente.is_active = False
    db.commit()
    
    return None
