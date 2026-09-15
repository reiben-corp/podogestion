"""
Endpoints de estadísticas, dashboard e informes.
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, text
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.estadisticas import (
    DashboardResponse,
    CitasMesResponse,
    AuditoriaResponse,
    InformePacientesResponse,
    InformeFacturacionResponse,
    InformeInventarioResponse,
    InformeCitasResponse,
)
from app.services.estadisticas_service import (
    get_dashboard_stats,
    get_citas_por_mes,
    get_citas_por_estado_mes,
    get_auditoria_reciente,
    informe_pacientes,
    informe_facturacion,
    informe_inventario,
    informe_citas,
)

router = APIRouter(prefix="/api/estadisticas", tags=["Estadísticas"], redirect_slashes=False)


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene las estadísticas para el dashboard principal."""
    return get_dashboard_stats(db)


@router.get("/citas-mes", response_model=CitasMesResponse)
async def citas_mes(
    year: int = Query(..., description="Año"),
    month: int = Query(..., description="Mes (1-12)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene las citas de un mes para gráficas."""
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Mes inválido")
    return {
        "citas_por_dia": get_citas_por_mes(db, year, month),
        "citas_por_estado": get_citas_por_estado_mes(db, year, month),
    }


@router.get("/auditoria", response_model=AuditoriaResponse)
async def auditoria(
    limite: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene la auditoría de acciones recientes."""
    return {"eventos": get_auditoria_reciente(db, limite)}


# ── Informes ──

@router.get("/informe/pacientes", response_model=InformePacientesResponse)
async def informe_pacientes_endpoint(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informe de pacientes."""
    return informe_pacientes(db, fecha_inicio, fecha_fin)


@router.get("/informe/facturacion", response_model=InformeFacturacionResponse)
async def informe_facturacion_endpoint(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informe de facturación."""
    return informe_facturacion(db, fecha_inicio, fecha_fin)


@router.get("/informe/inventario", response_model=InformeInventarioResponse)
async def informe_inventario_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informe de inventario."""
    return informe_inventario(db)


@router.get("/informe/citas", response_model=InformeCitasResponse)
async def informe_citas_endpoint(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Informe de citas."""
    return informe_citas(db, fecha_inicio, fecha_fin)


@router.get("/meses-con-confirmadas")
async def meses_con_confirmadas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene los meses con al menos una cita confirmada."""
    from sqlalchemy import extract, text
    from app.models.cita import Cita, EstadoCita
    
    resultados = db.query(
        extract('year', Cita.fecha).label('anio'),
        extract('month', Cita.fecha).label('mes'),
        func.count(Cita.id).label('total')
    ).filter(
        Cita.is_active == True,
        Cita.estado == EstadoCita.CONFIRMADA
    ).group_by(text('anio'), text('mes')).order_by(text('anio'), text('mes')).all()
    
    anios = sorted(set(int(r[0]) for r in resultados))
    meses_por_anio = {}
    for anio, mes, total in resultados:
        anio_int = int(anio)
        if anio_int not in meses_por_anio:
            meses_por_anio[anio_int] = []
        meses_por_anio[anio_int].append({"mes": int(mes), "total": total})
    
    return {
        "anios": anios,
        "meses_por_anio": meses_por_anio,
    }
