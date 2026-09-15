"""
Modelos SQLAlchemy para inventario.
Incluye productos y movimientos de stock.
"""
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class CategoriaProducto(str, enum.Enum):
    """Categorías de productos del inventario."""
    MATERIAL_CURA = "material_cura"
    INSTRUMENTAL = "instrumental"
    ORTESIS = "ortesis"
    CALZADO_TERAPEUTICO = "calzado_terapeutico"
    COSMETICA_PIES = "cosmetica_pies"
    DESINFECTANTE = "desinfectante"
    PROTECCION = "proteccion"
    OFICINA = "oficina"
    OTRO = "otro"


class UnidadMedida(str, enum.Enum):
    """Unidades de medida para productos."""
    UNIDAD = "unidad"
    CAJA = "caja"
    PAQUETE = "paquete"
    MILILITROS = "ml"
    GRAMOS = "g"
    PAR = "par"


class TipoMovimiento(str, enum.Enum):
    """Tipos de movimiento de inventario."""
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"
    DEVOLUCION = "devolucion"


class Producto(Base):
    """Tabla de productos del inventario."""
    __tablename__ = "productos"

    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    # codigo: formato INV-{id:05d} (ej: INV-00001, INV-00002).
    # Se genera en el servicio DESPUÉS de flush/commit, cuando el id ya está asignado.
    # Ejemplo: self.codigo = f"INV-{self.id:05d}"
    codigo = Column(String(20), unique=True, index=True, nullable=False)

    # Datos del producto
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    categoria = Column(Enum(CategoriaProducto), default=CategoriaProducto.OTRO, nullable=False)

    # Stock
    stock_actual = Column(Numeric(10, 2), default=0, nullable=False)
    stock_minimo = Column(Numeric(10, 2), default=5, nullable=False)
    stock_maximo = Column(Numeric(10, 2), nullable=True)
    unidad_medida = Column(Enum(UnidadMedida), default=UnidadMedida.UNIDAD, nullable=False)

    # Precios
    precio_coste = Column(Numeric(10, 2), default=0, nullable=False)
    precio_venta = Column(Numeric(10, 2), default=0, nullable=False)

    # Proveedor y ubicación
    proveedor = Column(String(200), nullable=True)
    referencia_proveedor = Column(String(100), nullable=True)
    ubicacion = Column(String(100), nullable=True)

    # Control
    is_active = Column(Boolean, default=True)

    # Auditoría
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))

    # Relaciones
    movimientos = relationship("MovimientoInventario", back_populates="producto", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Producto {self.codigo} - {self.nombre}>"

    @property
    def stock_bajo(self) -> bool:
        """Indica si el stock está por debajo del mínimo."""
        return self.stock_actual <= self.stock_minimo

    @property
    def margen_ganancia(self) -> float:
        """Calcula el margen de ganancia en porcentaje."""
        if self.precio_coste > 0:
            return float((self.precio_venta - self.precio_coste) / self.precio_coste * 100)
        return 0


class MovimientoInventario(Base):
    """Tabla de movimientos de inventario (entradas, salidas, ajustes)."""
    __tablename__ = "movimientos_inventario"

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)

    # Datos del movimiento
    tipo = Column(Enum(TipoMovimiento), nullable=False)
    cantidad = Column(Numeric(10, 2), nullable=False)
    motivo = Column(Text, nullable=True)

    # Stock antes y después
    stock_anterior = Column(Numeric(10, 2), nullable=False)
    stock_nuevo = Column(Numeric(10, 2), nullable=False)

    # Relación con usuario que realiza el movimiento
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Referencia a documento (si aplica, ej: factura de compra)
    documento_referencia = Column(String(50), nullable=True)

    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))

    # Relaciones
    producto = relationship("Producto", back_populates="movimientos")
    usuario = relationship("User", backref="movimientos_inventario")

    def __repr__(self):
        return f"<Movimiento {self.tipo} - {self.cantidad} - Producto {self.producto_id}>"
