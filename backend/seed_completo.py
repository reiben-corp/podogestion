"""
Script de seed para datos de prueba interrelacionados.
Genera pacientes, historias clínicas, facturas e inventario.

Nomenclatura de IDs:
- Paciente.numero_historia: PAC-{id:05d} (ej: PAC-00001)
- HistoriaClinica.numero_historia: HC-{paciente_id:05d}-{num_consulta:03d} (ej: HC-00001-001)
- DocumentoFacturacion.numero: {TIPO}-{year}-{id:05d} (ej: FAC-2026-00001, PRE-2026-00001)
- Producto.codigo: INV-{id:05d} (ej: INV-00001)

Ejecutar: docker exec -it clinica_backend python /app/scripts/seed_completo.py
"""
import sys
sys.path.insert(0, '/app')

import random
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.paciente import Paciente, Sexo, EstadoCivil
from app.models.historia_clinica import (
    HistoriaClinica, ExploracionBiomecanica, Tratamiento, Podograma,
    TipoExploracion, TipoTratamiento
)
from app.models.facturacion import (
    DocumentoFacturacion, LineaFacturacion, CajaDiaria,
    TipoDocumento, EstadoDocumento, MetodoPago
)
from app.models.inventario import (
    Producto, MovimientoInventario,
    CategoriaProducto, UnidadMedida, TipoMovimiento
)
from app.core.security import get_password_hash


# ── Datos de ejemplo ──

NOMBRES = [
    ("María", "García López"), ("Carlos", "Martínez Ruiz"), ("Ana", "Fernández Gómez"),
    ("Pedro", "Sánchez Torres"), ("Laura", "Díaz Moreno"), ("Javier", "Pérez Romero"),
    ("Carmen", "Jiménez Navarro"), ("Antonio", "Ruiz Herrera"), ("Isabel", "Moreno Castro"),
    ("Francisco", "Álvarez Gil"), ("Dolores", "Ortega Ramos"), ("Manuel", "Molina Serrano"),
    ("Pilar", "Rubio Iglesias"), ("José", "Garrido Flores"), ("Teresa", "Medina Vargas"),
]

PROFESIONALES = [
    ("Dra. Elena Vázquez", "elena@clinica.com", "medico"),
    ("Dr. Miguel Torres", "miguel@clinica.com", "medico"),
    ("Lucía Ramírez", "lucia@clinica.com", "asistente"),
]

PRODUCTOS = [
    ("Gasas estériles 10x10", "material_cura", "paquete", 2.50, 5.00, 50, 10, "MediSupply"),
    ("Desinfectante manos 500ml", "desinfectante", "unidad", 4.00, 8.00, 20, 5, "CleanPro"),
    ("Bisturí desechable #10", "instrumental", "caja", 8.50, 15.00, 30, 10, "SurgiTools"),
    ("Algodón hidrófilo 500g", "material_cura", "paquete", 3.00, 6.00, 40, 8, "MediSupply"),
    ("Guantes látex talla M", "proteccion", "caja", 5.00, 10.00, 25, 5, "SafeHands"),
    ("Cinta adhesiva 5m", "material_cura", "unidad", 1.50, 3.50, 60, 15, "MediSupply"),
    ("Crema hidratante pies 100ml", "cosmetica_pies", "unidad", 6.00, 12.00, 15, 5, "DermaCare"),
    ("Órtesis de silicona", "ortesis", "par", 12.00, 25.00, 10, 3, "OrtoPlus"),
    ("Calzado post-quirúrgico", "calzado_terapeutico", "par", 35.00, 70.00, 5, 2, "OrtoPlus"),
    ("Lima uñas profesional", "instrumental", "unidad", 2.00, 4.50, 40, 10, "SurgiTools"),
    ("Separador dedos", "ortesis", "par", 8.00, 16.00, 12, 4, "OrtoPlus"),
    ("Esparadrapo 10cm", "material_cura", "unidad", 2.00, 4.00, 35, 8, "MediSupply"),
]

MOTIVOS_CONSULTA = [
    "Dolor en talón derecho desde hace 2 semanas",
    "Uña encajada en pie izquierdo",
    "Revisión podológica rutinaria",
    "Callosidades en planta del pie",
    "Plantar fascitis crónica",
    "Control post-quirúrgico",
    "Dolor en arco del pie",
    "Problemas de sudoración excesiva",
    "Revisión ortesis plantar",
    "Dedo en garra - seguimiento",
]

DIAGNOSTICOS = [
    ("M20.1", "Hallux valgus"),
    ("M77.3", "Espolón calcáneo"),
    ("L84", "Callosidades"),
    ("B35.1", "Onicomicosis"),
    ("M79.6", "Dolor en pie"),
    ("S93.4", "Esguince de tobillo"),
    ("M21.6", "Pie plano"),
    ("G62.9", "Neuropatía periférica"),
]

TRATAMIENTOS = [
    ("Quiropodia", "Tratamiento básico de podología"),
    ("Desbridamiento", "Eliminación de callosidades"),
    ("Onicotomía", "Corte y fresado de uñas"),
    ("Ortesis plantar", "Toma de molde para plantillas"),
    ("Curación", "Curación de herida post-quirúrgica"),
    ("Fisioterapia", "Ejercicios de rehabilitación"),
]


def seed_usuarios(db):
    """Crea usuarios profesionales."""
    print("👤 Creando usuarios...")
    
    # Admin
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@clinica.com",
            hashed_password=get_password_hash("admin123456"),
            full_name="Administrador",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
    
    for nombre, email, role in PROFESIONALES:
        username = email.split("@")[0]
        existente = db.query(User).filter(User.username == username).first()
        if not existente:
            user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash("profesional123"),
                full_name=nombre,
                role=UserRole(role),
                is_active=True
            )
            db.add(user)
    
    db.commit()
    print(f"   ✅ {len(PROFESIONALES) + 1} usuarios creados")


def seed_productos(db):
    """Crea productos de inventario."""
    print("📦 Creando productos...")
    
    for nombre, categoria, unidad, coste, venta, stock, minimo, proveedor in PRODUCTOS:
        existente = db.query(Producto).filter(Producto.nombre == nombre).first()
        if not existente:
            producto = Producto(
                codigo=None,  # Se asigna después de flush: INV-{id:05d}
                nombre=nombre,
                descripcion=f"Producto de {categoria.replace('_', ' ')}",
                categoria=CategoriaProducto(categoria),
                stock_actual=stock,
                stock_minimo=minimo,
                unidad_medida=UnidadMedida(unidad),
                precio_coste=Decimal(str(coste)),
                precio_venta=Decimal(str(venta)),
                proveedor=proveedor,
                ubicacion=f"Estante {random.choice(['A', 'B', 'C'])}-{random.randint(1, 5)}",
            )
            db.add(producto)
            db.flush()
            # Asignar código basado en PK: INV-{id:05d}
            producto.codigo = f"INV-{producto.id:05d}"
    
    db.commit()
    print(f"   ✅ {len(PRODUCTOS)} productos creados")


def seed_pacientes(db, num_pacientes=15):
    """Crea pacientes con datos realistas."""
    print("🏥 Creando pacientes...")
    
    pacientes = []
    for i, (nombre, apellidos) in enumerate(NOMBRES[:num_pacientes]):
        existente = db.query(Paciente).filter(
            Paciente.nombre == nombre,
            Paciente.apellidos == apellidos
        ).first()
        if not existente:
            paciente = Paciente(
                numero_historia=None,  # Se asigna después de flush: PAC-{id:05d}
                nombre=nombre,
                apellidos=apellidos,
                fecha_nacimiento=date(
                    random.randint(1945, 2000),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ),
                sexo=random.choice([Sexo.MASCULINO, Sexo.FEMENINO]),
                dni=f"{random.randint(10000000, 99999999)}{random.choice('TRWAGMYFPDXBNJZSQVHLCKE')}",
                estado_civil=random.choice(list(EstadoCivil)),
                telefono=f"6{random.randint(10000000, 99999999)}",
                email=f"{nombre.lower()}.{apellidos.split(' ')[0].lower()}@email.com",
                direccion=f"Calle {random.choice(['Mayor', 'Nueva', 'Real', 'San Juan'])} {random.randint(1, 50)}",
                ciudad=random.choice(["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza"]),
                codigo_postal=f"{random.randint(1000, 52999)}",
                alergias=random.choice([None, "Penicilina", "Yodo", "Látex", None, None]),
                consentimiento_datos=True,
                consentimiento_fecha=datetime(2026, 1, 15),
                consentimiento_tratamiento=True,
                consentimiento_fecha_tratamiento=datetime(2026, 1, 15),
            )
            db.add(paciente)
            db.flush()
            # Asignar número de historia basado en PK: PAC-{id:05d}
            paciente.numero_historia = f"PAC-{paciente.id:05d}"
            pacientes.append(paciente)
    
    db.commit()
    print(f"   ✅ {len(pacientes)} pacientes creados")
    return pacientes


def seed_historias_clinicas(db, pacientes):
    """Crea historias clínicas interrelacionadas."""
    print("📋 Creando historias clínicas...")
    
    profesionales = db.query(User).filter(User.role != UserRole.ADMIN).all()
    num_historias = 0
    
    for paciente in pacientes:
        # Cada paciente tiene 1-3 consultas
        num_consultas = random.randint(1, 3)
        for j in range(num_consultas):
            fecha_consulta = datetime(
                2026,
                random.randint(1, 9),
                random.randint(1, 28),
                random.randint(9, 18),
                random.choice([0, 30])
            )
            
            motivo = random.choice(MOTIVOS_CONSULTA)
            diagnostico_codigo, diagnostico_nombre = random.choice(DIAGNOSTICOS)
            tratamiento_tipo, tratamiento_desc = random.choice(TRATAMIENTOS)
            
            # Calcular num_consulta para el formato HC-{paciente_id:05d}-{num_consulta:03d}
            count_previas = db.query(HistoriaClinica).filter(
                HistoriaClinica.paciente_id == paciente.id
            ).count()
            num_consulta = count_previas + 1
            
            historia = HistoriaClinica(
                numero_historia=f"HC-{paciente.id:05d}-{num_consulta:03d}",
                paciente_id=paciente.id,
                profesional_id=random.choice(profesionales).id,
                fecha_consulta=fecha_consulta,
                motivo_consulta=motivo,
                antecedentes_personales=random.choice([None, "Diabetes tipo 2", "Hipertensión", "Cirugía previa pie izquierdo"]),
                exploracion_fisica="Exploración dentro de la normalidad" if random.random() > 0.3 else "Se observa alteración biomecánica",
                diagnostico=f"{diagnostico_nombre} ({diagnostico_codigo})",
                codigo_diagnostico=diagnostico_codigo,
                plan_tratamiento=tratamiento_desc,
                evolucion="Mejoría progresiva" if random.random() > 0.5 else "Requiere seguimiento",
                observaciones="Próxima revisión en 3 meses" if random.random() > 0.5 else None,
            )
            db.add(historia)
            db.flush()
            
            # Añadir exploración biomecánica
            if random.random() > 0.3:
                exploracion = ExploracionBiomecanica(
                    historia_id=historia.id,
                    tipo=random.choice(list(TipoExploracion)),
                    datos={"presion_max": f"{random.randint(200, 400)} kPa"},
                    resultado="Normal" if random.random() > 0.4 else "Alteración detectada",
                )
                db.add(exploracion)
            
            # Añadir tratamiento
            tratamiento = Tratamiento(
                historia_id=historia.id,
                tipo=TipoTratamiento(tratamiento_tipo.split()[0].lower() if ' ' in tratamiento_tipo else tratamiento_tipo.lower()),
                descripcion=tratamiento_desc,
                pie=random.choice(["izquierdo", "derecho", "ambos"]),
                resultado="Tolerado correctamente",
            )
            db.add(tratamiento)
            
            # Añadir podograma
            if random.random() > 0.5:
                podograma = Podograma(
                    historia_id=historia.id,
                    pie=random.choice(["izquierdo", "derecho"]),
                    datos={"tipo_apoyo": random.choice(["normal", "pronador", "supinador"])},
                )
                db.add(podograma)
            
            num_historias += 1
    
    db.commit()
    print(f"   ✅ {num_historias} historias clínicas creadas")


def seed_facturas(db, pacientes):
    """Crea presupuestos y facturas interrelacionados."""
    print("💰 Creando documentos de facturación...")
    
    profesionales = db.query(User).filter(User.role != UserRole.ADMIN).all()
    num_docs = 0
    
    for paciente in pacientes:
        # 70% de pacientes tienen documentos
        if random.random() > 0.3:
            num_docs_paciente = random.randint(1, 3)
            for j in range(num_docs_paciente):
                tipo = random.choice([TipoDocumento.PRESUPUESTO, TipoDocumento.FACTURA])
                fecha_emision = datetime(
                    2026,
                    random.randint(1, 9),
                    random.randint(1, 28),
                )
                
                # Crear documento
                documento = DocumentoFacturacion(
                    numero=None,  # Se asigna después de flush: {TIPO}-{year}-{id:05d}
                    tipo=tipo,
                    estado=random.choice([
                        EstadoDocumento.BORRADOR,
                        EstadoDocumento.ACEPTADO,
                        EstadoDocumento.COBRADO,
                        EstadoDocumento.COBRADO,
                    ]),
                    paciente_id=paciente.id,
                    profesional_id=random.choice(profesionales).id,
                    fecha_emision=fecha_emision,
                    fecha_validez=fecha_emision + timedelta(days=30) if tipo == TipoDocumento.PRESUPUESTO else None,
                    iva_porcentaje=Decimal("21"),
                    metodo_pago=random.choice([MetodoPago.EFECTIVO, MetodoPago.TARJETA, MetodoPago.TRANSFERENCIA]),
                    pagado=random.random() > 0.3,
                    fecha_cobro=fecha_emision + timedelta(days=random.randint(0, 15)) if random.random() > 0.3 else None,
                )
                db.add(documento)
                db.flush()
                
                # Asignar número: {TIPO}-{year}-{id:05d}
                prefix = "PRE" if tipo == TipoDocumento.PRESUPUESTO else "FAC"
                year = fecha_emision.year
                documento.numero = f"{prefix}-{year}-{documento.id:05d}"
                
                # Añadir líneas
                num_lineas = random.randint(1, 4)
                base_imponible = Decimal("0")
                for k in range(num_lineas):
                    cantidad = Decimal(str(random.randint(1, 3)))
                    precio = Decimal(str(random.choice([15.0, 25.0, 35.0, 45.0, 60.0])))
                    importe_neto = cantidad * precio
                    base_imponible += importe_neto
                    
                    linea = LineaFacturacion(
                        documento_id=documento.id,
                        concepto=random.choice([
                            "Consulta podológica",
                            "Quiropodia",
                            "Ortesis plantar",
                            "Tratamiento biomecánico",
                            "Revisión y control",
                        ]),
                        cantidad=cantidad,
                        precio_unitario=precio,
                        descuento=Decimal("0"),
                        iva_porcentaje=Decimal("21"),
                        importe_bruto=cantidad * precio,
                        importe_neto=importe_neto,
                    )
                    db.add(linea)
                
                # Calcular totales
                documento.base_imponible = base_imponible
                documento.iva_importe = base_imponible * Decimal("0.21")
                documento.total = base_imponible + documento.iva_importe
                
                num_docs += 1
    
    db.commit()
    print(f"   ✅ {num_docs} documentos de facturación creados")


def seed_movimientos_inventario(db):
    """Crea movimientos de inventario desde enero 2026."""
    print("📊 Creando movimientos de inventario...")
    
    productos = db.query(Producto).all()
    profesionales = db.query(User).all()
    num_movimientos = 0
    
    for producto in productos:
        # Entrada inicial
        movimiento = MovimientoInventario(
            producto_id=producto.id,
            tipo=TipoMovimiento.ENTRADA,
            cantidad=producto.stock_actual,
            motivo="Stock inicial",
            stock_anterior=Decimal("0"),
            stock_nuevo=producto.stock_actual,
            usuario_id=random.choice(profesionales).id,
            created_at=datetime(2026, 1, 10, 10, 0),
        )
        db.add(movimiento)
        num_movimientos += 1
        
        # Movimientos aleatorios
        for _ in range(random.randint(2, 5)):
            tipo = random.choice([TipoMovimiento.ENTRADA, TipoMovimiento.SALIDA, TipoMovimiento.SALIDA])
            cantidad = Decimal(str(random.randint(1, 10)))
            
            if tipo == TipoMovimiento.ENTRADA:
                stock_anterior = producto.stock_actual
                stock_nuevo = stock_anterior + cantidad
                motivo = random.choice([
                    "Compra a proveedor",
                    "Reposición mensual",
                    "Pedido urgente",
                ])
            else:
                stock_anterior = producto.stock_actual
                stock_nuevo = max(Decimal("0"), stock_anterior - cantidad)
                motivo = random.choice([
                    "Uso en consulta",
                    "Consumo diario",
                    "Tratamiento paciente",
                ])
            
            movimiento = MovimientoInventario(
                producto_id=producto.id,
                tipo=tipo,
                cantidad=cantidad,
                motivo=motivo,
                stock_anterior=stock_anterior,
                stock_nuevo=stock_nuevo,
                usuario_id=random.choice(profesionales).id,
                created_at=datetime(
                    2026,
                    random.randint(1, 9),
                    random.randint(1, 28),
                    random.randint(9, 18),
                ),
            )
            db.add(movimiento)
            num_movimientos += 1
    
    db.commit()
    print(f"   ✅ {num_movimientos} movimientos creados")


def main():
    db = SessionLocal()
    
    try:
        print("=" * 50)
        print("🌱 SEED COMPLETO - CLÍNICA PODOLOGÍA")
        print("=" * 50)
        print()
        
        seed_usuarios(db)
        seed_productos(db)
        pacientes = seed_pacientes(db, num_pacientes=15)
        seed_historias_clinicas(db, pacientes)
        seed_facturas(db, pacientes)
        seed_movimientos_inventario(db)
        
        print()
        print("=" * 50)
        print("✅ SEED COMPLETADO EXITOSAMENTE")
        print("=" * 50)
        print()
        print("Resumen:")
        print(f"  - Usuarios: {db.query(User).count()}")
        print(f"  - Pacientes: {db.query(Paciente).count()}")
        print(f"  - Historias clínicas: {db.query(HistoriaClinica).count()}")
        print(f"  - Documentos facturación: {db.query(DocumentoFacturacion).count()}")
        print(f"  - Productos: {db.query(Producto).count()}")
        print(f"  - Movimientos inventario: {db.query(MovimientoInventario).count()}")
        print()
        print("Credenciales:")
        print("  - Admin: admin / admin123456")
        print("  - Profesionales: elena / miguel / lucia → profesional123")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
