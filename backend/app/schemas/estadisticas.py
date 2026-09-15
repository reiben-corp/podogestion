"""
Esquemas Pydantic para estadísticas, dashboard e informes.
"""
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


# ── Dashboard ──

class CitaResumen(BaseModel):
    id: int
    paciente_nombre: Optional[str] = None
    paciente_telefono: Optional[str] = None
    hora_inicio: Optional[str] = None
    estado: Optional[str] = None
    paciente_id: int


class DashboardResponse(BaseModel):
    citas_hoy: List[CitaResumen]
    citas_manana: List[CitaResumen]
    total_pacientes: int
    anios_disponibles: List[int]


# ── Citas Mes (para gráficas) ──

class CitaPorDia(BaseModel):
    dia: int
    citas: int


class CitasMesResponse(BaseModel):
    citas_por_dia: List[CitaPorDia]
    citas_por_estado: dict


# ── Auditoría ──

class AuditoriaEvento(BaseModel):
    tipo: str
    descripcion: str
    fecha: datetime
    icono: str
    enlace: str
    entidad: str
    id_entidad: int


class AuditoriaResponse(BaseModel):
    eventos: List[AuditoriaEvento]


# ── Informes ──

class InformePacientesResponse(BaseModel):
    total: int
    nuevos_periodo: int
    por_sexo: dict
    por_ciudad: dict


class InformeFacturacionResponse(BaseModel):
    total_facturado: float
    total_cobrado: float
    total_pendiente: float
    num_facturas: int
    num_presupuestos: int
    porcentaje_cobrado: float


class InformeInventarioResponse(BaseModel):
    total_productos: int
    productos_stock_bajo: list
    valoracion_coste: float
    valoracion_venta: float
    por_categoria: dict


class InformeCitasResponse(BaseModel):
    total: int
    por_estado: dict
    por_profesional: dict
