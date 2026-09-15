"""
Modelos SQLAlchemy para facturación.
Incluye presupuestos, facturas, líneas de facturación y caja.
"""
from datetime import datetime, date
from zoneinfo import ZoneInfo
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, Enum, ForeignKey, Float, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TipoDocumento(str, enum.Enum):
    """Tipos de documento de facturación."""
    PRESUPUESTO = "presupuesto"
    FACTURA = "factura"


class EstadoDocumento(str, enum.Enum):
    """Estados posibles de un documento."""
    BORRADOR = "borrador"
    PENDIENTE = "pendiente"
    ACEPTADO = "aceptado"
    RECHAZADO = "rechazado"
    FACTURADO = "facturado"
    COBRADO = "cobrado"
    ANULADO = "anulado"


class MetodoPago(str, enum.Enum):
    """Métodos de pago."""
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"
    OTRO = "otro"


class DocumentoFacturacion(Base):
    """Tabla de documentos de facturación (presupuestos y facturas)."""
    __tablename__ = "documentos_facturacion"
    
    id = Column(Integer, primary_key=True, index=True)
    # numero: formato {TIPO}-{año}-{correlativo:05d}
    #   TIPO = "PRE" para presupuestos, "FAC" para facturas
    #   año = año de fecha_emision (ej: 2026)
    #   correlativo = número secual por año y tipo (reinicia cada año)
    # Ejemplo: PRE-2026-00001, FAC-2026-00042, PRE-2027-00001
    # Se genera en el servicio tras obtener el año y el último correlativo.
    numero = Column(String(20), unique=True, index=True, nullable=False)
    tipo = Column(Enum(TipoDocumento), nullable=False)
    estado = Column(Enum(EstadoDocumento), default=EstadoDocumento.BORRADOR, nullable=False)
    
    paciente_id = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    profesional_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Fechas
    fecha_emision = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), nullable=False)
    fecha_validez = Column(Date, nullable=True)
    fecha_cobro = Column(DateTime, nullable=True)
    
    # Importes
    base_imponible = Column(Numeric(10, 2), default=0, nullable=False)
    iva_porcentaje = Column(Numeric(5, 2), default=21.00, nullable=False)
    iva_importe = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Pago
    metodo_pago = Column(Enum(MetodoPago), nullable=True)
    pagado = Column(Boolean, default=False)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relaciones
    paciente = relationship("Paciente", backref="documentos_facturacion")
    profesional = relationship("User", backref="documentos_facturacion")
    lineas = relationship("LineaFacturacion", back_populates="documento", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DocumentoFacturacion {self.numero} - {self.tipo}>"


class LineaFacturacion(Base):
    """Tabla de líneas de facturación."""
    __tablename__ = "lineas_facturacion"
    
    id = Column(Integer, primary_key=True, index=True)
    documento_id = Column(Integer, ForeignKey("documentos_facturacion.id"), nullable=False)
    
    concepto = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    cantidad = Column(Numeric(10, 2), default=1, nullable=False)
    precio_unitario = Column(Numeric(10, 2), default=0, nullable=False)
    descuento = Column(Numeric(5, 2), default=0, nullable=False)  # Porcentaje
    iva_porcentaje = Column(Numeric(5, 2), default=21.00, nullable=False)
    
    # Importes calculados
    importe_bruto = Column(Numeric(10, 2), default=0, nullable=False)
    importe_neto = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    
    # Relación
    documento = relationship("DocumentoFacturacion", back_populates="lineas")
    
    def __repr__(self):
        return f"<LineaFacturacion {self.id} - {self.concepto}>"


class CajaDiaria(Base):
    """Tabla de caja diaria."""
    __tablename__ = "caja_diaria"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, default=date.today, nullable=False, unique=True)
    
    # Saldo inicial
    saldo_inicial = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Totales
    total_ingresos = Column(Numeric(10, 2), default=0, nullable=False)
    total_gastos = Column(Numeric(10, 2), default=0, nullable=False)
    total_efectivo = Column(Numeric(10, 2), default=0, nullable=False)
    total_tarjeta = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Saldo final calculado
    saldo_final = Column(Numeric(10, 2), default=0, nullable=False)
    
    # Estado
    cerrada = Column(Boolean, default=False)
    fecha_cierre = Column(DateTime, nullable=True)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    updated_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), onupdate=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    def __repr__(self):
        return f"<CajaDiaria {self.fecha} - {'Cerrada' if self.cerrada else 'Abierta'}>"


class MovimientoCaja(Base):
    """Tabla de movimientos de caja."""
    __tablename__ = "movimientos_caja"
    
    id = Column(Integer, primary_key=True, index=True)
    caja_id = Column(Integer, ForeignKey("caja_diaria.id"), nullable=False)
    
    fecha = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")), nullable=False)
    tipo = Column(String(10), nullable=False)  # 'ingreso' o 'gasto'
    concepto = Column(String(255), nullable=False)
    importe = Column(Numeric(10, 2), nullable=False)
    metodo_pago = Column(Enum(MetodoPago), nullable=True)
    
    # Relación con documento (si aplica)
    documento_id = Column(Integer, ForeignKey("documentos_facturacion.id"), nullable=True)
    
    # Auditoría
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(ZoneInfo("Europe/Madrid")))
    
    # Relaciones
    caja = relationship("CajaDiaria", backref="movimientos")
    documento = relationship("DocumentoFacturacion", backref="movimientos_caja")
    
    def __repr__(self):
        return f"<MovimientoCaja {self.id} - {self.tipo} {self.importe}>"
