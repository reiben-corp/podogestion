"""
Lógica de negocio para inventario.
Gestiona productos y movimientos de stock.
"""
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import List, Optional

from app.models.inventario import Producto, MovimientoInventario, CategoriaProducto, TipoMovimiento


def generar_codigo_producto(producto_id: int) -> str:
    """
    Genera un código único para producto.
    Formato: INV-{id:05d} (basado en PK después de flush)
    El código se asigna después de flush en crear_producto()
    """
    return f"INV-{producto_id:05d}"


# ── CRUD Productos ──

def crear_producto(db: Session, data) -> Producto:
    """Crea un nuevo producto en el inventario."""
    # Si el usuario proporciona un código, verificar duplicado
    if data.codigo:
        existente = db.query(Producto).filter(Producto.codigo == data.codigo).first()
        if existente:
            raise ValueError(f"Ya existe un producto con código {data.codigo}")
        codigo = data.codigo
    else:
        codigo = None  # Se asignará después de flush

    producto = Producto(
        codigo=codigo,
        nombre=data.nombre,
        descripcion=data.descripcion,
        categoria=data.categoria,
        stock_actual=data.stock_actual,
        stock_minimo=data.stock_minimo,
        stock_maximo=data.stock_maximo,
        unidad_medida=data.unidad_medida,
        precio_coste=data.precio_coste,
        precio_venta=data.precio_venta,
        proveedor=data.proveedor,
        referencia_proveedor=data.referencia_proveedor,
        ubicacion=data.ubicacion,
    )

    db.add(producto)
    db.flush()  # Para obtener el ID

    # Asignar código basado en PK: INV-{id:05d}
    if not producto.codigo:
        producto.codigo = generar_codigo_producto(producto_id=producto.id)

    db.commit()
    db.refresh(producto)
    return producto


def obtener_producto(db: Session, producto_id: int) -> Optional[Producto]:
    """Obtiene un producto por su ID."""
    return db.query(Producto).filter(
        Producto.id == producto_id,
        Producto.is_active == True
    ).first()


def listar_productos(
    db: Session,
    pagina: int = 1,
    por_pagina: int = 20,
    busqueda: Optional[str] = None,
    categoria: Optional[str] = None,
    stock_bajo: Optional[bool] = None,
) -> dict:
    """Lista productos con filtros y paginación."""
    query = db.query(Producto).filter(Producto.is_active == True)

    if busqueda:
        filtro = f"%{busqueda}%"
        query = query.filter(
            (Producto.nombre.ilike(filtro)) |
            (Producto.codigo.ilike(filtro)) |
            (Producto.proveedor.ilike(filtro))
        )

    if categoria:
        query = query.filter(Producto.categoria == categoria)

    if stock_bajo is not None:
        if stock_bajo:
            query = query.filter(Producto.stock_actual <= Producto.stock_minimo)
        else:
            query = query.filter(Producto.stock_actual > Producto.stock_minimo)

    total = query.count()
    offset = (pagina - 1) * por_pagina
    productos = query.order_by(Producto.nombre).offset(offset).limit(por_pagina).all()

    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "productos": productos,
    }


def actualizar_producto(db: Session, producto_id: int, data) -> Producto:
    """Actualiza un producto existente."""
    producto = db.query(Producto).filter(
        Producto.id == producto_id,
        Producto.is_active == True
    ).first()

    if not producto:
        raise ValueError("Producto no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


def eliminar_producto(db: Session, producto_id: int) -> None:
    """Elimina un producto (soft delete)."""
    producto = db.query(Producto).filter(
        Producto.id == producto_id,
        Producto.is_active == True
    ).first()

    if not producto:
        raise ValueError("Producto no encontrado")

    producto.is_active = False
    db.commit()


# ── Movimientos de Inventario ──

def registrar_movimiento(db: Session, data) -> MovimientoInventario:
    """Registra un movimiento de inventario y actualiza el stock."""
    producto = db.query(Producto).filter(
        Producto.id == data.producto_id,
        Producto.is_active == True
    ).first()

    if not producto:
        raise ValueError("Producto no encontrado")

    stock_anterior = producto.stock_actual
    cantidad = data.cantidad

    if data.tipo == TipoMovimiento.ENTRADA or data.tipo == TipoMovimiento.DEVOLUCION:
        stock_nuevo = stock_anterior + cantidad
    elif data.tipo == TipoMovimiento.SALIDA:
        stock_nuevo = stock_anterior - cantidad
        if stock_nuevo < 0:
            raise ValueError("Stock insuficiente para la salida")
    elif data.tipo == TipoMovimiento.AJUSTE:
        stock_nuevo = cantidad  # En ajustes, la cantidad es el nuevo stock
    else:
        raise ValueError("Tipo de movimiento inválido")

    # Crear movimiento
    movimiento = MovimientoInventario(
        producto_id=producto.id,
        tipo=data.tipo,
        cantidad=cantidad,
        motivo=data.motivo,
        stock_anterior=stock_anterior,
        stock_nuevo=stock_nuevo,
        usuario_id=data.usuario_id,
        documento_referencia=data.documento_referencia,
    )

    # Actualizar stock del producto
    producto.stock_actual = stock_nuevo

    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento


def obtener_movimientos(
    db: Session,
    producto_id: Optional[int] = None,
    pagina: int = 1,
    por_pagina: int = 20,
) -> dict:
    """Lista movimientos con filtros opcionales."""
    query = db.query(MovimientoInventario).filter(MovimientoInventario.is_active == True)

    if producto_id:
        query = query.filter(MovimientoInventario.producto_id == producto_id)

    total = query.count()
    offset = (pagina - 1) * por_pagina
    movimientos = query.order_by(MovimientoInventario.created_at.desc()).offset(offset).limit(por_pagina).all()

    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "movimientos": movimientos,
    }


# ── Estadísticas ──

def obtener_estadisticas(db: Session) -> dict:
    """Obtiene estadísticas resumidas del inventario."""
    total_productos = db.query(Producto).filter(Producto.is_active == True).count()

    productos_stock_bajo = db.query(Producto).filter(
        Producto.is_active == True,
        Producto.stock_actual <= Producto.stock_minimo
    ).count()

    # Valoración total del inventario
    resultado = db.query(func.sum(Producto.stock_actual * Producto.precio_coste)).filter(
        Producto.is_active == True
    ).first()
    valoracion_total = resultado[0] if resultado[0] else Decimal("0")

    # Movimientos del mes actual
    primer_dia_mes = date.today().replace(day=1)
    entradas_mes = db.query(func.sum(MovimientoInventario.cantidad)).filter(
        MovimientoInventario.is_active == True,
        MovimientoInventario.tipo.in_([TipoMovimiento.ENTRADA, TipoMovimiento.DEVOLUCION]),
        MovimientoInventario.created_at >= primer_dia_mes,
    ).scalar() or Decimal("0")

    salidas_mes = db.query(func.sum(MovimientoInventario.cantidad)).filter(
        MovimientoInventario.is_active == True,
        MovimientoInventario.tipo == TipoMovimiento.SALIDA,
        MovimientoInventario.created_at >= primer_dia_mes,
    ).scalar() or Decimal("0")

    # Productos por categoría
    categorias = {}
    for cat in CategoriaProducto:
        count = db.query(Producto).filter(
            Producto.is_active == True,
            Producto.categoria == cat
        ).count()
        categorias[cat.value] = count

    return {
        "total_productos": total_productos,
        "productos_stock_bajo": productos_stock_bajo,
        "valoracion_total": valoracion_total,
        "entradas_mes": entradas_mes,
        "salidas_mes": salidas_mes,
        "productos_categoria": categorias,
    }
