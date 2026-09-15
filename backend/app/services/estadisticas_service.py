"""
Servicio de estadísticas para Dashboard e Informes.
Agrega datos de múltiples módulos para KPIs y reportes.
"""
from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo

# Zona horaria de España (CEST/CET)
TZ_MADRID = ZoneInfo("Europe/Madrid")

def get_fecha_hoy() -> date:
    """Obtiene la fecha actual en la zona horaria de España."""
    return datetime.now(TZ_MADRID).date()

from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from typing import Optional

from app.models.user import User
from app.models.paciente import Paciente
from app.models.cita import Cita, EstadoCita
from app.models.historia_clinica import HistoriaClinica
from app.models.facturacion import DocumentoFacturacion, TipoDocumento, EstadoDocumento
from app.models.inventario import Producto, MovimientoInventario, TipoMovimiento


def get_dashboard_stats(db: Session) -> dict:
    """Obtiene estadísticas principales para el dashboard."""
    hoy = get_fecha_hoy()
    manana = hoy + timedelta(days=1)
    
    # Solo citas CONFIRMADAS hoy
    citas_hoy = db.query(Cita).filter(
        Cita.fecha == hoy,
        Cita.estado == EstadoCita.CONFIRMADA,
        Cita.is_active == True
    ).order_by(Cita.hora_inicio).all()
    
    # Solo citas CONFIRMADAS mañana
    citas_manana = db.query(Cita).filter(
        Cita.fecha == manana,
        Cita.estado == EstadoCita.CONFIRMADA,
        Cita.is_active == True
    ).order_by(Cita.hora_inicio).all()
    
    # Total pacientes activos
    total_pacientes = db.query(Paciente).filter(Paciente.is_active == True).count()
    
    # Años con citas (para el selector)
    anios_con_citas = db.query(
        func.extract('year', Cita.fecha).label('anio')
    ).filter(
        Cita.is_active == True
    ).distinct().order_by('anio').all()
    anios = [int(a[0]) for a in anios_con_citas] if anios_con_citas else [hoy.year]
    
    return {
        "citas_hoy": [
            {
                "id": c.id,
                "paciente_nombre": c.paciente.nombre_completo if c.paciente else None,
                "paciente_telefono": c.paciente.telefono if c.paciente else None,
                "hora_inicio": c.hora_inicio.isoformat() if c.hora_inicio else None,
                "estado": c.estado.value if c.estado else None,
                "paciente_id": c.paciente_id,
            }
            for c in citas_hoy
        ],
        "citas_manana": [
            {
                "id": c.id,
                "paciente_nombre": c.paciente.nombre_completo if c.paciente else None,
                "paciente_telefono": c.paciente.telefono if c.paciente else None,
                "hora_inicio": c.hora_inicio.isoformat() if c.hora_inicio else None,
                "estado": c.estado.value if c.estado else None,
                "paciente_id": c.paciente_id,
            }
            for c in citas_manana
        ],
        "total_pacientes": total_pacientes,
        "anios_disponibles": anios,
    }


def get_citas_por_mes(db: Session, year: int, month: int) -> list:
    """Obtiene las citas CONFIRMADAS de un mes específico para gráficas."""
    primer_dia = date(year, month, 1)
    ultimo_dia = (primer_dia + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    citas = db.query(Cita).filter(
        Cita.fecha >= primer_dia,
        Cita.fecha <= ultimo_dia,
        Cita.is_active == True,
        Cita.estado == EstadoCita.CONFIRMADA
    ).all()
    
    # Agrupar por día
    dias = {}
    for cita in citas:
        dia = cita.fecha.day
        if dia not in dias:
            dias[dia] = 0
        dias[dia] += 1
    
    return [{"dia": d, "citas": dias[d]} for d in sorted(dias.keys())]


def get_citas_por_estado_mes(db: Session, year: int, month: int) -> dict:
    """Obtiene el desglose de citas por estado para un mes (solo confirmadas)."""
    primer_dia = date(year, month, 1)
    ultimo_dia = (primer_dia + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    resultados = db.query(
        Cita.estado,
        func.count(Cita.id)
    ).filter(
        Cita.fecha >= primer_dia,
        Cita.fecha <= ultimo_dia,
        Cita.is_active == True,
        Cita.estado == EstadoCita.CONFIRMADA
    ).group_by(Cita.estado).all()
    
    return {r[0].value if r[0] else "desconocido": r[1] for r in resultados}


def get_auditoria_reciente(db: Session, limite: int = 15) -> list:
    """
    Obtiene auditoría de acciones recientes sobre:
    - Pacientes: alta, edición, deshabilitado
    - Citas: creada, editada, eliminada (cambio de estado)
    - Consultas: creada con paciente y facultativo
    
    Incluye enlaces a las fichas correspondientes.
    """
    auditoria = []
    
    # ── Pacientes: altas recientes ──
    pacientes_altas = db.query(Paciente).filter(
        Paciente.is_active == True
    ).order_by(Paciente.created_at.desc()).limit(limite).all()
    
    for p in pacientes_altas:
        auditoria.append({
            "tipo": "paciente_alta",
            "descripcion": f"Alta paciente: {p.nombre_completo}",
            "fecha": p.created_at,
            "icono": "👤+",
            "enlace": f"/pacientes/{p.id}",
            "entidad": "paciente",
            "id_entidad": p.id,
        })
    
    # ── Pacientes: editados recientemente ──
    pacientes_editados = db.query(Paciente).filter(
        Paciente.is_active == True,
        Paciente.updated_at > Paciente.created_at
    ).order_by(Paciente.updated_at.desc()).limit(limite).all()
    
    for p in pacientes_editados:
        auditoria.append({
            "tipo": "paciente_editado",
            "descripcion": f"Paciente editado: {p.nombre_completo}",
            "fecha": p.updated_at,
            "icono": "✏️",
            "enlace": f"/pacientes/{p.id}",
            "entidad": "paciente",
            "id_entidad": p.id,
        })
    
    # ── Pacientes: deshabilitados (is_active=False) ──
    pacientes_deshabilitados = db.query(Paciente).filter(
        Paciente.is_active == False
    ).order_by(Paciente.updated_at.desc()).limit(limite).all()
    
    for p in pacientes_deshabilitados:
        auditoria.append({
            "tipo": "paciente_deshabilitado",
            "descripcion": f"Paciente deshabilitado: {p.nombre_completo}",
            "fecha": p.updated_at,
            "icono": "🚫",
            "enlace": f"/pacientes/{p.id}",
            "entidad": "paciente",
            "id_entidad": p.id,
        })
    
    # ── Citas: creadas ──
    citas_creadas = db.query(Cita).filter(
        Cita.is_active == True
    ).order_by(Cita.created_at.desc()).limit(limite).all()
    
    for c in citas_creadas:
        auditoria.append({
            "tipo": "cita_creada",
            "descripcion": f"Cita creada: {c.paciente.nombre_completo if c.paciente else 'Paciente'} - {c.fecha}",
            "fecha": c.created_at,
            "icono": "📅+",
            "enlace": f"/citas",
            "entidad": "cita",
            "id_entidad": c.id,
        })
    
    # ── Citas: editadas (updated_at > created_at) ──
    citas_editadas = db.query(Cita).filter(
        Cita.is_active == True,
        Cita.updated_at > Cita.created_at
    ).order_by(Cita.updated_at.desc()).limit(limite).all()
    
    for c in citas_editadas:
        auditoria.append({
            "tipo": "cita_editada",
            "descripcion": f"Cita editada: {c.paciente.nombre_completo if c.paciente else 'Paciente'} - {c.fecha}",
            "fecha": c.updated_at,
            "icono": "📝",
            "enlace": f"/citas",
            "entidad": "cita",
            "id_entidad": c.id,
        })
    
    # ── Citas: eliminadas/deshabilitadas ──
    citas_eliminadas = db.query(Cita).filter(
        Cita.is_active == False
    ).order_by(Cita.updated_at.desc()).limit(limite).all()
    
    for c in citas_eliminadas:
        auditoria.append({
            "tipo": "cita_eliminada",
            "descripcion": f"Cita eliminada: {c.paciente.nombre_completo if c.paciente else 'Paciente'} - {c.fecha}",
            "fecha": c.updated_at,
            "icono": "🗑️",
            "enlace": f"/citas",
            "entidad": "cita",
            "id_entidad": c.id,
        })
    
    # ── Consultas (Historias clínicas): creadas ──
    consultas = db.query(HistoriaClinica).filter(
        HistoriaClinica.is_active == True
    ).order_by(HistoriaClinica.created_at.desc()).limit(limite).all()
    
    for h in consultas:
        profesional_nombre = h.profesional.full_name if h.profesional else 'Facultativo'
        paciente_nombre = h.paciente.nombre_completo if h.paciente else 'Paciente'
        auditoria.append({
            "tipo": "consulta_creada",
            "descripcion": f"Consulta: {paciente_nombre} - {profesional_nombre}",
            "fecha": h.created_at,
            "icono": "📋",
            "enlace": f"/historia-clinica/{h.id}",
            "entidad": "historia",
            "id_entidad": h.id,
        })
    
    # Ordenar por fecha descendente y limitar
    auditoria.sort(key=lambda x: x["fecha"], reverse=True)
    return auditoria[:limite]


# ── Informes ──

def informe_pacientes(db: Session, fecha_inicio: date = None, fecha_fin: date = None) -> dict:
    """Informe de pacientes: nuevos, activos, distribución."""
    if not fecha_inicio:
        fecha_inicio = date.today().replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()
    
    total = db.query(Paciente).filter(Paciente.is_active == True).count()
    nuevos = db.query(Paciente).filter(
        Paciente.created_at >= fecha_inicio,
        Paciente.created_at <= fecha_fin + timedelta(days=1),
        Paciente.is_active == True
    ).count()
    
    # Por sexo
    por_sexo = db.query(
        Paciente.sexo,
        func.count(Paciente.id)
    ).filter(
        Paciente.is_active == True
    ).group_by(Paciente.sexo).all()
    
    # Por ciudad
    por_ciudad = db.query(
        Paciente.ciudad,
        func.count(Paciente.id)
    ).filter(
        Paciente.is_active == True,
        Paciente.ciudad != None
    ).group_by(Paciente.ciudad).order_by(func.count(Paciente.id).desc()).limit(10).all()
    
    return {
        "total": total,
        "nuevos_periodo": nuevos,
        "por_sexo": {s.value if s else "no_especificado": c for s, c in por_sexo},
        "por_ciudad": {ciudad: c for ciudad, c in por_ciudad},
    }


def informe_facturacion(db: Session, fecha_inicio: date = None, fecha_fin: date = None) -> dict:
    """Informe de facturación: facturado, cobrado, pendiente."""
    if not fecha_inicio:
        fecha_inicio = date.today().replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()
    
    # Total facturado
    total_facturado = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.fecha_emision >= fecha_inicio,
        DocumentoFacturacion.fecha_emision <= fecha_fin + timedelta(days=1),
        DocumentoFacturacion.is_active == True
    ).scalar() or Decimal("0")
    
    # Total cobrado
    total_cobrado = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.fecha_emision >= fecha_inicio,
        DocumentoFacturacion.fecha_emision <= fecha_fin + timedelta(days=1),
        DocumentoFacturacion.estado == EstadoDocumento.COBRADO,
        DocumentoFacturacion.is_active == True
    ).scalar() or Decimal("0")
    
    # Total pendiente
    total_pendiente = db.query(func.sum(DocumentoFacturacion.total)).filter(
        DocumentoFacturacion.fecha_emision >= fecha_inicio,
        DocumentoFacturacion.fecha_emision <= fecha_fin + timedelta(days=1),
        DocumentoFacturacion.estado.in_([EstadoDocumento.PENDIENTE, EstadoDocumento.BORRADOR]),
        DocumentoFacturacion.is_active == True
    ).scalar() or Decimal("0")
    
    # Número de documentos
    num_facturas = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.fecha_emision >= fecha_inicio,
        DocumentoFacturacion.fecha_emision <= fecha_fin + timedelta(days=1),
        DocumentoFacturacion.tipo == TipoDocumento.FACTURA,
        DocumentoFacturacion.is_active == True
    ).count()
    
    num_presupuestos = db.query(DocumentoFacturacion).filter(
        DocumentoFacturacion.fecha_emision >= fecha_inicio,
        DocumentoFacturacion.fecha_emision <= fecha_fin + timedelta(days=1),
        DocumentoFacturacion.tipo == TipoDocumento.PRESUPUESTO,
        DocumentoFacturacion.is_active == True
    ).count()
    
    return {
        "total_facturado": float(total_facturado),
        "total_cobrado": float(total_cobrado),
        "total_pendiente": float(total_pendiente),
        "num_facturas": num_facturas,
        "num_presupuestos": num_presupuestos,
        "porcentaje_cobrado": (float(total_cobrado) / float(total_facturado) * 100) if total_facturado > 0 else 0,
    }


def informe_inventario(db: Session) -> dict:
    """Informe de inventario: valoración, stock bajo, movimientos."""
    total_productos = db.query(Producto).filter(Producto.is_active == True).count()
    
    productos_stock_bajo = db.query(Producto).filter(
        Producto.is_active == True,
        Producto.stock_actual <= Producto.stock_minimo
    ).all()
    
    valoracion_total = db.query(
        func.sum(Producto.stock_actual * Producto.precio_coste)
    ).filter(Producto.is_active == True).scalar() or Decimal("0")
    
    valoracion_venta = db.query(
        func.sum(Producto.stock_actual * Producto.precio_venta)
    ).filter(Producto.is_active == True).scalar() or Decimal("0")
    
    # Productos por categoría
    por_categoria = db.query(
        Producto.categoria,
        func.count(Producto.id)
    ).filter(
        Producto.is_active == True
    ).group_by(Producto.categoria).all()
    
    return {
        "total_productos": total_productos,
        "productos_stock_bajo": [
            {"codigo": p.codigo, "nombre": p.nombre, "stock": float(p.stock_actual), "minimo": float(p.stock_minimo)}
            for p in productos_stock_bajo
        ],
        "valoracion_coste": float(valoracion_total),
        "valoracion_venta": float(valoracion_venta),
        "por_categoria": {c.value: n for c, n in por_categoria},
    }


def informe_citas(db: Session, fecha_inicio: date = None, fecha_fin: date = None) -> dict:
    """Informe de citas: total, por estado, por profesional."""
    if not fecha_inicio:
        fecha_inicio = date.today().replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()
    
    total = db.query(Cita).filter(
        Cita.fecha >= fecha_inicio,
        Cita.fecha <= fecha_fin,
        Cita.is_active == True
    ).count()
    
    # Por estado
    por_estado = db.query(
        Cita.estado,
        func.count(Cita.id)
    ).filter(
        Cita.fecha >= fecha_inicio,
        Cita.fecha <= fecha_fin,
        Cita.is_active == True
    ).group_by(Cita.estado).all()
    
    # Por profesional
    por_profesional = db.query(
        User.full_name,
        func.count(Cita.id)
    ).join(Cita, Cita.profesional_id == User.id).filter(
        Cita.fecha >= fecha_inicio,
        Cita.fecha <= fecha_fin,
        Cita.is_active == True
    ).group_by(User.full_name).all()
    
    return {
        "total": total,
        "por_estado": {e.value if e else "desconocido": c for e, c in por_estado},
        "por_profesional": {nombre: c for nombre, c in por_profesional},
    }
