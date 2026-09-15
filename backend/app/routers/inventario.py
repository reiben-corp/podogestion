"""
Endpoints de gestión de inventario.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.inventario import (
    ProductoCreate, ProductoUpdate, ProductoResponse, ProductoListResponse,
    MovimientoInventarioCreate, MovimientoInventarioResponse, MovimientoInventarioListResponse,
    EstadisticasInventario,
)
from app.services import inventario_service

router = APIRouter(prefix="/api/inventario", tags=["Inventario"], redirect_slashes=False)


# ── Productos ──

@router.post("/productos", response_model=ProductoResponse, status_code=201)
async def crear_producto(
    data: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo producto en el inventario."""
    try:
        producto = inventario_service.crear_producto(db, data)
        return producto
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/productos", response_model=ProductoListResponse)
async def listar_productos(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = None,
    categoria: Optional[str] = None,
    stock_bajo: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista productos con paginación y filtros."""
    return inventario_service.listar_productos(
        db, pagina=pagina, por_pagina=por_pagina,
        busqueda=busqueda, categoria=categoria, stock_bajo=stock_bajo
    )


@router.get("/productos/{producto_id}", response_model=ProductoResponse)
async def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene un producto por su ID."""
    producto = inventario_service.obtener_producto(db, producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return producto


@router.put("/productos/{producto_id}", response_model=ProductoResponse)
async def actualizar_producto(
    producto_id: int,
    data: ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza un producto existente."""
    try:
        return inventario_service.actualizar_producto(db, producto_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/productos/{producto_id}", status_code=204)
async def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina un producto (soft delete)."""
    try:
        inventario_service.eliminar_producto(db, producto_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ── Movimientos de Inventario ──

@router.post("/movimientos", response_model=MovimientoInventarioResponse, status_code=201)
async def registrar_movimiento(
    data: MovimientoInventarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra un movimiento de inventario (entrada, salida, ajuste)."""
    try:
        movimiento = inventario_service.registrar_movimiento(db, data)
        return movimiento
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/movimientos", response_model=MovimientoInventarioListResponse)
async def listar_movimientos(
    producto_id: Optional[int] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista movimientos de inventario."""
    return inventario_service.obtener_movimientos(
        db, producto_id=producto_id, pagina=pagina, por_pagina=por_pagina
    )


# ── Estadísticas ──

@router.get("/estadisticas", response_model=EstadisticasInventario)
async def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene estadísticas resumidas del inventario."""
    return inventario_service.obtener_estadisticas(db)
