"""
Esquemas Pydantic para facturación.
"""
from datetime import datetime, date
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal

from app.models.facturacion import TipoDocumento, EstadoDocumento, MetodoPago


# ── Línea de Facturación ──

class LineaFacturacionBase(BaseModel):
    concepto: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    cantidad: Decimal = Field(default=1, ge=0)
    precio_unitario: Decimal = Field(default=0, ge=0)
    descuento: Decimal = Field(default=0, ge=0, le=100)
    iva_porcentaje: Decimal = Field(default=21, ge=0, le=100)


class LineaFacturacionCreate(LineaFacturacionBase):
    pass


class LineaFacturacionResponse(LineaFacturacionBase):
    id: int
    documento_id: int
    importe_bruto: Decimal
    importe_neto: Decimal
    is_active: bool
    
    class Config:
        from_attributes = True


# ── Documento de Facturación ──

class DocumentoFacturacionBase(BaseModel):
    tipo: TipoDocumento
    paciente_id: int
    profesional_id: int
    fecha_validez: Optional[date] = None
    iva_porcentaje: Decimal = Field(default=21, ge=0, le=100)
    observaciones: Optional[str] = None


class DocumentoFacturacionCreate(DocumentoFacturacionBase):
    lineas: List[LineaFacturacionCreate] = []


class DocumentoFacturacionUpdate(BaseModel):
    estado: Optional[EstadoDocumento] = None
    fecha_validez: Optional[date] = None
    iva_porcentaje: Optional[Decimal] = None
    observaciones: Optional[str] = None
    metodo_pago: Optional[MetodoPago] = None
    pagado: Optional[bool] = None


class DocumentoFacturacionResponse(BaseModel):
    id: int
    numero: str
    tipo: TipoDocumento
    estado: EstadoDocumento
    paciente_id: int
    profesional_id: int
    fecha_emision: datetime
    fecha_validez: Optional[date] = None
    fecha_cobro: Optional[datetime] = None
    base_imponible: Decimal
    iva_porcentaje: Decimal
    iva_importe: Decimal
    total: Decimal
    metodo_pago: Optional[MetodoPago] = None
    pagado: bool
    observaciones: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Datos relacionados
    paciente_nombre: Optional[str] = None
    profesional_nombre: Optional[str] = None
    lineas: List[LineaFacturacionResponse] = []
    
    class Config:
        from_attributes = True


class DocumentoFacturacionListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    documentos: List[DocumentoFacturacionResponse]


# ── Caja Diaria ──

class CajaDiariaBase(BaseModel):
    fecha: date
    saldo_inicial: Decimal = Field(default=0, ge=0)
    observaciones: Optional[str] = None


class CajaDiariaCreate(CajaDiariaBase):
    pass


class CajaDiariaUpdate(BaseModel):
    saldo_inicial: Optional[Decimal] = None
    observaciones: Optional[str] = None
    cerrada: Optional[bool] = None


class CajaDiariaResponse(BaseModel):
    id: int
    fecha: date
    saldo_inicial: Decimal
    total_ingresos: Decimal
    total_gastos: Decimal
    total_efectivo: Decimal
    total_tarjeta: Decimal
    saldo_final: Decimal
    cerrada: bool
    fecha_cierre: Optional[datetime] = None
    observaciones: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ── Movimiento de Caja ──

class MovimientoCajaBase(BaseModel):
    tipo: str  # 'ingreso' o 'gasto'
    concepto: str
    importe: Decimal = Field(..., gt=0)
    metodo_pago: Optional[MetodoPago] = None
    documento_id: Optional[int] = None


class MovimientoCajaCreate(MovimientoCajaBase):
    pass


class MovimientoCajaResponse(MovimientoCajaBase):
    id: int
    caja_id: int
    fecha: datetime
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ── Estadísticas ──

class EstadisticasFacturacion(BaseModel):
    total_facturado: Decimal
    total_cobrado: Decimal
    total_pendiente: Decimal
    numero_facturas: int
    numero_presupuestos: int
    facturado_mes: Decimal
    cobrado_mes: Decimal
