"""
Esquemas Pydantic para inventario.
"""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal

from app.models.inventario import CategoriaProducto, UnidadMedida, TipoMovimiento


# ── Producto ──

class ProductoBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    descripcion: Optional[str] = None
    categoria: CategoriaProducto = CategoriaProducto.OTRO
    stock_minimo: Decimal = Field(default=5, ge=0)
    stock_maximo: Optional[Decimal] = Field(None, ge=0)
    unidad_medida: UnidadMedida = UnidadMedida.UNIDAD
    precio_coste: Decimal = Field(default=0, ge=0)
    precio_venta: Decimal = Field(default=0, ge=0)
    proveedor: Optional[str] = None
    referencia_proveedor: Optional[str] = None
    ubicacion: Optional[str] = None


class ProductoCreate(ProductoBase):
    stock_actual: Decimal = Field(default=0, ge=0)
    codigo: Optional[str] = None  # Se genera automáticamente si no se proporciona


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[CategoriaProducto] = None
    stock_minimo: Optional[Decimal] = None
    stock_maximo: Optional[Decimal] = None
    unidad_medida: Optional[UnidadMedida] = None
    precio_coste: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    proveedor: Optional[str] = None
    referencia_proveedor: Optional[str] = None
    ubicacion: Optional[str] = None


class ProductoResponse(ProductoBase):
    id: int
    codigo: str
    stock_actual: Decimal
    stock_bajo: bool
    margen_ganancia: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductoListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    productos: List[ProductoResponse]


# ── Movimiento de Inventario ──

class MovimientoInventarioBase(BaseModel):
    tipo: TipoMovimiento
    cantidad: Decimal = Field(..., gt=0)
    motivo: Optional[str] = None
    documento_referencia: Optional[str] = None


class MovimientoInventarioCreate(MovimientoInventarioBase):
    producto_id: int
    usuario_id: Optional[int] = None


class MovimientoInventarioResponse(MovimientoInventarioBase):
    id: int
    producto_id: int
    stock_anterior: Decimal
    stock_nuevo: Decimal
    usuario_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MovimientoInventarioListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    movimientos: List[MovimientoInventarioResponse]


# ── Estadísticas ──

class EstadisticasInventario(BaseModel):
    total_productos: int
    productos_stock_bajo: int
    valoracion_total: Decimal
    entradas_mes: Decimal
    salidas_mes: Decimal
    productos_categoria: dict
