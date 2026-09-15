"""
Endpoints de gestión de facturación.
"""
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.facturacion import DocumentoFacturacion, CajaDiaria, MetodoPago
from app.models.facturacion import TipoDocumento, EstadoDocumento
from app.schemas.facturacion import (
    DocumentoFacturacionCreate, DocumentoFacturacionUpdate,
    DocumentoFacturacionResponse, DocumentoFacturacionListResponse,
    CajaDiariaResponse, MovimientoCajaCreate, MovimientoCajaResponse,
    EstadisticasFacturacion, LineaFacturacionCreate
)
from app.services.facturacion_service import (
    crear_documento, obtener_documentos_paciente,
    cambiar_estado_documento, cobrar_documento, enriquecer_documento,
    obtener_crear_caja_hoy, registrar_movimiento_caja, cerrar_caja,
    obtener_estadisticas
)

router = APIRouter(prefix="/api/facturacion", tags=["Facturación"], redirect_slashes=False)


# ── Documentos (Presupuestos y Facturas) ──

@router.post("/", response_model=DocumentoFacturacionResponse, status_code=201)
async def crear_nuevo_documento(
    data: DocumentoFacturacionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo documento (presupuesto o factura).
    """
    try:
        documento = crear_documento(
            db=db,
            tipo=data.tipo,
            paciente_id=data.paciente_id,
            profesional_id=data.profesional_id,
            lineas=data.lineas,
            iva_porcentaje=data.iva_porcentaje,
            fecha_validez=data.fecha_validez,
            observaciones=data.observaciones
        )
        return enriquecer_documento(documento)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ── Caja ──

@router.get("/caja/hoy", response_model=CajaDiariaResponse)
async def caja_hoy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la caja del día.
    """
    caja = obtener_crear_caja_hoy(db)
    return caja


@router.post("/caja/movimiento", response_model=MovimientoCajaResponse)
async def nuevo_movimiento(
    data: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registra un movimiento en caja.
    """
    try:
        caja = obtener_crear_caja_hoy(db)
        movimiento = registrar_movimiento_caja(
            db=db,
            caja_id=caja.id,
            tipo=data.tipo,
            concepto=data.concepto,
            importe=data.importe,
            metodo_pago=data.metodo_pago,
            documento_id=data.documento_id
        )
        return movimiento
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/caja/cerrar")
async def cerrar_caja_diaria(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cierra la caja del día.
    """
    try:
        caja = obtener_crear_caja_hoy(db)
        cerrar_caja(db, caja.id)
        return {"message": "Caja cerrada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ── Estadísticas ──

@router.get("/estadisticas", response_model=EstadisticasFacturacion)
async def estadisticas(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene estadísticas de facturación.
    """
    return obtener_estadisticas(db, fecha_inicio, fecha_fin)


@router.get("/paciente/{paciente_id}", response_model=List[DocumentoFacturacionResponse])
async def documentos_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todos los documentos de un paciente.
    """
    documentos = obtener_documentos_paciente(db, paciente_id)
    return [enriquecer_documento(d) for d in documentos]


@router.get("/", response_model=DocumentoFacturacionListResponse)
async def listar_documentos(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    paciente_id: Optional[int] = Query(None),
    tipo: Optional[TipoDocumento] = Query(None),
    estado: Optional[EstadoDocumento] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista documentos con filtros opcionales.
    """
    query = db.query(DocumentoFacturacion).filter(DocumentoFacturacion.is_active == True)
    
    if paciente_id:
        query = query.filter(DocumentoFacturacion.paciente_id == paciente_id)
    if tipo:
        query = query.filter(DocumentoFacturacion.tipo == tipo)
    if estado:
        query = query.filter(DocumentoFacturacion.estado == estado)
    
    total = query.count()
    offset = (pagina - 1) * por_pagina
    documentos = query.order_by(DocumentoFacturacion.fecha_emision.desc()).offset(offset).limit(por_pagina).all()
    
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "documentos": [enriquecer_documento(d) for d in documentos]
    }


@router.get("/{documento_id}", response_model=DocumentoFacturacionResponse)
async def obtener_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene un documento por su ID.
    """
    documento = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.id == documento_id,
        DocumentoFacturacion.is_active == True
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    return enriquecer_documento(documento)


@router.put("/{documento_id}", response_model=DocumentoFacturacionResponse)
async def actualizar_documento(
    documento_id: int,
    data: DocumentoFacturacionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza el estado de un documento.
    """
    documento = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.id == documento_id,
        DocumentoFacturacion.is_active == True
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(documento, campo, valor)
    
    db.commit()
    db.refresh(documento)
    
    return enriquecer_documento(documento)


@router.post("/{documento_id}/cobrar", response_model=DocumentoFacturacionResponse)
async def cobrar(
    documento_id: int,
    metodo_pago: MetodoPago,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca un documento como cobrado.
    """
    try:
        documento = cobrar_documento(db, documento_id, metodo_pago)
        
        # Registrar en caja
        caja = obtener_crear_caja_hoy(db)
        registrar_movimiento_caja(
            db=db,
            caja_id=caja.id,
            tipo="ingreso",
            concepto=f"Cobro {documento.numero}",
            importe=documento.total,
            metodo_pago=metodo_pago,
            documento_id=documento.id
        )
        
        return enriquecer_documento(documento)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{documento_id}", status_code=204)
async def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Elimina un documento (soft delete).
    """
    documento = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.id == documento_id,
        DocumentoFacturacion.is_active == True
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    documento.is_active = False
    db.commit()
    
    return None
