"""
Lógica de negocio para facturación.
"""
from datetime import datetime, date
from zoneinfo import ZoneInfo
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.facturacion import (
    DocumentoFacturacion, LineaFacturacion, CajaDiaria, MovimientoCaja,
    TipoDocumento, EstadoDocumento, MetodoPago
)
from app.schemas.facturacion import LineaFacturacionCreate
from app.models.paciente import Paciente
from app.models.user import User


def generar_numero_documento(tipo: TipoDocumento, documento_id: int) -> str:
    """
    Genera un número único para el documento.
    Formatos: PRE-{year}-{id:05d} o FAC-{year}-{id:05d}
    El año se obtiene de la fecha actual (fecha_emision).
    El id es la PK del documento, asignada después de flush.
    Ejemplo: FAC-2026-00001, PRE-2026-00001
    """
    prefix = "PRE" if tipo == TipoDocumento.PRESUPUESTO else "FAC"
    year = datetime.now().year
    
    return f"{prefix}-{year}-{documento_id:05d}"


def calcular_linea(linea: LineaFacturacionCreate) -> tuple[Decimal, Decimal]:
    """Calcula importes de una línea."""
    importe_bruto = linea.cantidad * linea.precio_unitario
    descuento = importe_bruto * (linea.descuento / 100)
    importe_neto = importe_bruto - descuento
    return importe_bruto, importe_neto


def crear_documento(
    db: Session,
    tipo: TipoDocumento,
    paciente_id: int,
    profesional_id: int,
    lineas: list,
    iva_porcentaje: Decimal = Decimal("21"),
    fecha_validez: date = None,
    observaciones: str = None
) -> DocumentoFacturacion:
    """
    Crea un documento de facturación (presupuesto o factura).
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id, Paciente.is_active == True
    ).first()
    if not paciente:
        raise ValueError("Paciente no encontrado")
    
    profesional = db.query(User).filter(
        User.id == profesional_id, User.is_active == True
    ).first()
    if not profesional:
        raise ValueError("Profesional no encontrado")
    
    documento = DocumentoFacturacion(
        numero="TEMP",  # Se actualizará después de flush con PRE-{year}-{id:05d} o FAC-{year}-{id:05d}
        tipo=tipo,
        estado=EstadoDocumento.BORRADOR,
        paciente_id=paciente_id,
        profesional_id=profesional_id,
        iva_porcentaje=iva_porcentaje,
        fecha_validez=fecha_validez,
        observaciones=observaciones
    )
    db.add(documento)
    db.flush()
    
    # Asignar número de documento basado en PK: PRE-{year}-{id:05d} o FAC-{year}-{id:05d}
    documento.numero = generar_numero_documento(tipo=tipo, documento_id=documento.id)
    
    base_imponible = Decimal("0")
    
    for linea_data in lineas:
        if isinstance(linea_data, dict):
            linea_data = LineaFacturacionCreate(**linea_data)
        
        importe_bruto, importe_neto = calcular_linea(linea_data)
        
        linea = LineaFacturacion(
            documento_id=documento.id,
            concepto=linea_data.concepto,
            descripcion=linea_data.descripcion,
            cantidad=linea_data.cantidad,
            precio_unitario=linea_data.precio_unitario,
            descuento=linea_data.descuento,
            iva_porcentaje=linea_data.iva_porcentaje,
            importe_bruto=importe_bruto,
            importe_neto=importe_neto
        )
        db.add(linea)
        base_imponible += importe_neto
    
    db.flush()
    
    # Calcular totales del documento
    documento.base_imponible = base_imponible
    documento.iva_importe = base_imponible * (iva_porcentaje / 100)
    documento.total = base_imponible + documento.iva_importe
    
    db.commit()
    db.refresh(documento)
    return documento


def obtener_documentos_paciente(db: Session, paciente_id: int) -> list[DocumentoFacturacion]:
    """Obtiene todos los documentos de un paciente."""
    return db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.paciente_id == paciente_id,
        DocumentoFacturacion.is_active == True
    ).order_by(DocumentoFacturacion.fecha_emision.desc()).all()


def cambiar_estado_documento(db: Session, documento_id: int, nuevo_estado: EstadoDocumento) -> DocumentoFacturacion:
    """Cambia el estado de un documento."""
    documento = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.id == documento_id,
        DocumentoFacturacion.is_active == True
    ).first()
    
    if not documento:
        raise ValueError("Documento no encontrado")
    
    documento.estado = nuevo_estado
    db.commit()
    db.refresh(documento)
    return documento


def cobrar_documento(db: Session, documento_id: int, metodo_pago: MetodoPago) -> DocumentoFacturacion:
    """Marca un documento como cobrado."""
    documento = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.id == documento_id,
        DocumentoFacturacion.is_active == True
    ).first()
    
    if not documento:
        raise ValueError("Documento no encontrado")
    
    documento.estado = EstadoDocumento.COBRADO
    documento.pagado = True
    documento.metodo_pago = metodo_pago
    documento.fecha_cobro = datetime.now(ZoneInfo("Europe/Madrid"))
    
    db.commit()
    db.refresh(documento)
    return documento


def enriquecer_documento(documento: DocumentoFacturacion) -> dict:
    """Añade nombres de paciente y profesional a la respuesta."""
    return {
        "id": documento.id,
        "numero": documento.numero,
        "tipo": documento.tipo,
        "estado": documento.estado,
        "paciente_id": documento.paciente_id,
        "profesional_id": documento.profesional_id,
        "fecha_emision": documento.fecha_emision,
        "fecha_validez": documento.fecha_validez,
        "fecha_cobro": documento.fecha_cobro,
        "base_imponible": documento.base_imponible,
        "iva_porcentaje": documento.iva_porcentaje,
        "iva_importe": documento.iva_importe,
        "total": documento.total,
        "metodo_pago": documento.metodo_pago,
        "pagado": documento.pagado,
        "observaciones": documento.observaciones,
        "is_active": documento.is_active,
        "created_at": documento.created_at,
        "updated_at": documento.updated_at,
        "paciente_nombre": documento.paciente.nombre_completo if documento.paciente else None,
        "profesional_nombre": documento.profesional.full_name if documento.profesional else None,
        "lineas": [
            {
                "id": l.id,
                "concepto": l.concepto,
                "descripcion": l.descripcion,
                "cantidad": l.cantidad,
                "precio_unitario": l.precio_unitario,
                "descuento": l.descuento,
                "iva_porcentaje": l.iva_porcentaje,
                "importe_bruto": l.importe_bruto,
                "importe_neto": l.importe_neto,
                "documento_id": l.documento_id,
                "is_active": l.is_active
            }
            for l in documento.lineas if l.is_active
        ]
    }


# ── Caja ──

def obtener_crear_caja_hoy(db: Session) -> CajaDiaria:
    """Obtiene o crea la caja del día."""
    hoy = date.today()
    caja = db.query(CajaDiaria).filter(CajaDiaria.fecha == hoy).first()
    
    if not caja:
        caja = CajaDiaria(fecha=hoy, saldo_inicial=0)
        db.add(caja)
        db.commit()
        db.refresh(caja)
    
    return caja


def registrar_movimiento_caja(
    db: Session,
    caja_id: int,
    tipo: str,
    concepto: str,
    importe: Decimal,
    metodo_pago: MetodoPago = None,
    documento_id: int = None
) -> MovimientoCaja:
    """Registra un movimiento en caja."""
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise ValueError("Caja no encontrada")
    
    if caja.cerrada:
        raise ValueError("La caja está cerrada")
    
    movimiento = MovimientoCaja(
        caja_id=caja_id,
        tipo=tipo,
        concepto=concepto,
        importe=importe,
        metodo_pago=metodo_pago,
        documento_id=documento_id
    )
    db.add(movimiento)
    
    # Actualizar totales
    if tipo == "ingreso":
        caja.total_ingresos += importe
        if metodo_pago == MetodoPago.EFECTIVO:
            caja.total_efectivo += importe
        elif metodo_pago == MetodoPago.TARJETA:
            caja.total_tarjeta += importe
    else:
        caja.total_gastos += importe
    
    caja.saldo_final = caja.saldo_inicial + caja.total_ingresos - caja.total_gastos
    
    db.commit()
    db.refresh(movimiento)
    return movimiento


def cerrar_caja(db: Session, caja_id: int) -> CajaDiaria:
    """Cierra la caja del día."""
    caja = db.query(CajaDiaria).filter(CajaDiaria.id == caja_id).first()
    if not caja:
        raise ValueError("Caja no encontrada")
    
    caja.cerrada = True
    caja.fecha_cierre = datetime.now(ZoneInfo("Europe/Madrid"))
    
    db.commit()
    db.refresh(caja)
    return caja


def obtener_estadisticas(db: Session, fecha_inicio: date = None, fecha_fin: date = None) -> dict:
    """Obtiene estadísticas de facturación."""
    if not fecha_inicio:
        fecha_inicio = date.today().replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()
    
    # Total facturado
    total_facturado = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.tipo == TipoDocumento.FACTURA,
        DocumentoFacturacion.is_active == True
    ).scalar() or 0
    
    # Total cobrado
    total_cobrado = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.estado == EstadoDocumento.COBRADO,
        DocumentoFacturacion.is_active == True
    ).scalar() or 0
    
    # Pendiente
    total_pendiente = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.estado.in_([EstadoDocumento.PENDIENTE, EstadoDocumento.ACEPTADO]),
        DocumentoFacturacion.is_active == True
    ).scalar() or 0
    
    # Número de facturas
    numero_facturas = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.tipo == TipoDocumento.FACTURA,
        DocumentoFacturacion.is_active == True
    ).count()
    
    # Número de presupuestos
    numero_presupuestos = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.tipo == TipoDocumento.PRESUPUESTO,
        DocumentoFacturacion.is_active == True
    ).count()
    
    return {
        "total_facturado": total_facturado,
        "total_cobrado": total_cobrado,
        "total_pendiente": total_pendiente,
        "numero_facturas": numero_facturas,
        "numero_presupuestos": numero_presupuestos,
        "facturado_mes": total_facturado,
        "cobrado_mes": total_cobrado
    }
