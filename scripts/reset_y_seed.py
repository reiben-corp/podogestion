"""
Script de reset completo: limpia BD y crea datos de prueba interrelacionados.
Fechas desde enero 2026 para simular actividad previa al arranque.

Ejecutar: docker exec clinica_backend python /app/reset_y_seed.py
"""
import sys
sys.path.insert(0, '/app')

import random
from datetime import datetime, date, timedelta, time
from decimal import Decimal

from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.paciente import Paciente, Sexo, EstadoCivil
from app.models.historia_clinica import (
    HistoriaClinica, ExploracionBiomecanica, Tratamiento, Podograma,
    TipoExploracion, TipoTratamiento
)
from app.models.facturacion import (
    DocumentoFacturacion, LineaFacturacion, CajaDiaria, MovimientoCaja,
    TipoDocumento, EstadoDocumento, MetodoPago
)
from app.models.inventario import (
    Producto, MovimientoInventario,
    CategoriaProducto, UnidadMedida, TipoMovimiento
)
from app.models.cita import Cita, EstadoCita
from app.core.security import get_password_hash


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

TRATAMIENTOS_DESC = [
    ("Quiropodia", "Tratamiento básico de podología"),
    ("Desbridamiento", "Eliminación de callosidades"),
    ("Onicotomía", "Corte y fresado de uñas"),
    ("Ortesis plantar", "Toma de molde para plantillas"),
    ("Curación", "Curación de herida post-quirúrgica"),
    ("Fisioterapia", "Ejercicios de rehabilitación"),
]


def reset_y_seed():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("🔄 RESET + SEED - CLÍNICA PODOLOGÍA")
        print("=" * 60)
        
        # ── LIMPIEZA ──
        print("\n🧹 Limpiando datos existentes...")
        
        db.query(MovimientoInventario).delete()
        db.query(Producto).delete()
        db.query(MovimientoCaja).delete()
        db.query(LineaFacturacion).delete()
        db.query(DocumentoFacturacion).delete()
        db.query(CajaDiaria).delete()
        db.query(ExploracionBiomecanica).delete()
        db.query(Tratamiento).delete()
        db.query(Podograma).delete()
        db.query(HistoriaClinica).delete()
        db.query(Cita).delete()
        db.query(Paciente).delete()
        db.query(User).filter(User.username != "admin").delete()
        
        db.commit()
        print("   ✅ Datos eliminados")
        
        # Reiniciar secuencias
        db.execute(text("ALTER SEQUENCE pacientes_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE historias_clinicas_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE documentos_facturacion_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE productos_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE movimientos_inventario_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE citas_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 2"))
        print("   ✅ Secuencias reiniciadas")
        
        # ── USUARIOS ──
        print("\n👤 Creando usuarios...")
        
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
        
        profesionales_obj = []
        for nombre, email, role in PROFESIONALES:
            username = email.split("@")[0]
            user = User(
                username=username,
                email=email,
                hashed_password=get_password_hash("profesional123"),
                full_name=nombre,
                role=UserRole(role),
                is_active=True
            )
            db.add(user)
            profesionales_obj.append(user)
        
        db.commit()
        print(f"   ✅ {len(profesionales_obj) + 1} usuarios creados")
        
        # ── PRODUCTOS ──
        print("\n📦 Creando productos...")
        
        for i, (nombre, categoria, unidad, coste, venta, stock, minimo, proveedor) in enumerate(PRODUCTOS, 1):
            producto = Producto(
                codigo=f"INV-{i:05d}",
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
        
        db.commit()
        print(f"   ✅ {len(PRODUCTOS)} productos creados")
        
        # ── PACIENTES ──
        print("\n🏥 Creando pacientes...")
        
        pacientes = []
        for i, (nombre, apellidos) in enumerate(NOMBRES, 1):
            paciente = Paciente(
                numero_historia=f"PAC-{i:05d}",
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
            pacientes.append(paciente)
        
        db.commit()
        print(f"   ✅ {len(pacientes)} pacientes creados")
        
        # ── HISTORIAS CLÍNICAS ──
        print("\n📋 Creando historias clínicas...")
        
        num_historias = 0
        for idx, paciente in enumerate(pacientes, 1):
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
                tratamiento_tipo, tratamiento_desc = random.choice(TRATAMIENTOS_DESC)
                
                historia = HistoriaClinica(
                    numero_historia=f"HC-{num_historias + 1:05d}",
                    paciente_id=paciente.id,
                    profesional_id=random.choice(profesionales_obj).id,
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
                
                if random.random() > 0.3:
                    exploracion = ExploracionBiomecanica(
                        historia_id=historia.id,
                        tipo=random.choice(list(TipoExploracion)),
                        datos={"presion_max": f"{random.randint(200, 400)} kPa"},
                        resultado="Normal" if random.random() > 0.4 else "Alteración detectada",
                    )
                    db.add(exploracion)
                
                tratamiento = Tratamiento(
                    historia_id=historia.id,
                    tipo=random.choice(list(TipoTratamiento)),
                    descripcion=tratamiento_desc,
                    pie=random.choice(["izquierdo", "derecho", "ambos"]),
                    resultado="Tolerado correctamente",
                )
                db.add(tratamiento)
                
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
        
        # ── FACTURAS ──
        print("\n💰 Creando documentos de facturación...")
        
        num_docs = 0
        for paciente in pacientes:
            if random.random() > 0.3:
                num_docs_paciente = random.randint(1, 3)
                for j in range(num_docs_paciente):
                    tipo = random.choice([TipoDocumento.PRESUPUESTO, TipoDocumento.FACTURA])
                    fecha_emision = datetime(2026, random.randint(1, 9), random.randint(1, 28))
                    
                    documento = DocumentoFacturacion(
                        numero=f"{'PRE' if tipo == TipoDocumento.PRESUPUESTO else 'FAC'}-{num_docs + 1:05d}",
                        tipo=tipo,
                        estado=random.choice([
                            EstadoDocumento.BORRADOR,
                            EstadoDocumento.ACEPTADO,
                            EstadoDocumento.COBRADO,
                            EstadoDocumento.COBRADO,
                        ]),
                        paciente_id=paciente.id,
                        profesional_id=random.choice(profesionales_obj).id,
                        fecha_emision=fecha_emision,
                        fecha_validez=fecha_emision + timedelta(days=30) if tipo == TipoDocumento.PRESUPUESTO else None,
                        iva_porcentaje=Decimal("21"),
                        metodo_pago=random.choice([MetodoPago.EFECTIVO, MetodoPago.TARJETA, MetodoPago.TRANSFERENCIA]),
                        pagado=random.random() > 0.3,
                        fecha_cobro=fecha_emision + timedelta(days=random.randint(0, 15)) if random.random() > 0.3 else None,
                    )
                    db.add(documento)
                    db.flush()
                    
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
                    
                    documento.base_imponible = base_imponible
                    documento.iva_importe = base_imponible * Decimal("0.21")
                    documento.total = base_imponible + documento.iva_importe
                    
                    num_docs += 1
        
        db.commit()
        print(f"   ✅ {num_docs} documentos de facturación creados")
        
        # ── CITAS ──
        print("\n📅 Creando citas...")
        
        hoy = date.today()
        manana = hoy + timedelta(days=1)
        
        # Citas hoy
        for i in range(3):
            cita = Cita(
                paciente_id=random.choice(pacientes).id,
                profesional_id=random.choice(profesionales_obj).id,
                fecha=hoy,
                hora_inicio=time(9 + i * 2, 0),
                hora_fin=time(9 + i * 2, 30),
                motivo=random.choice(MOTIVOS_CONSULTA),
                estado=random.choice([EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA]),
                is_active=True,
            )
            db.add(cita)
        
        # Citas mañana
        for i in range(2):
            cita = Cita(
                paciente_id=random.choice(pacientes).id,
                profesional_id=random.choice(profesionales_obj).id,
                fecha=manana,
                hora_inicio=time(10 + i * 2, 0),
                hora_fin=time(10 + i * 2, 30),
                motivo=random.choice(MOTIVOS_CONSULTA),
                estado=random.choice([EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA]),
                is_active=True,
            )
            db.add(cita)
        
        # Citas de meses anteriores
        for _ in range(20):
            cita = Cita(
                paciente_id=random.choice(pacientes).id,
                profesional_id=random.choice(profesionales_obj).id,
                fecha=date(2026, random.randint(1, 8), random.randint(1, 28)),
                hora_inicio=time(random.randint(9, 18), random.choice([0, 30])),
                hora_fin=time(random.randint(9, 18), random.choice([0, 30])),
                motivo=random.choice(MOTIVOS_CONSULTA),
                estado=random.choice([EstadoCita.COMPLETADA, EstadoCita.COMPLETADA, EstadoCita.CANCELADA]),
                is_active=True,
            )
            db.add(cita)
        
        db.commit()
        print(f"   ✅ Citas creadas")
        
        # ── MOVIMIENTOS INVENTARIO ──
        print("\n📊 Creando movimientos de inventario...")
        
        productos = db.query(Producto).all()
        num_movimientos = 0
        
        for producto in productos:
            movimiento = MovimientoInventario(
                producto_id=producto.id,
                tipo=TipoMovimiento.ENTRADA,
                cantidad=producto.stock_actual,
                motivo="Stock inicial",
                stock_anterior=Decimal("0"),
                stock_nuevo=producto.stock_actual,
                usuario_id=random.choice(profesionales_obj).id,
                created_at=datetime(2026, 1, 10, 10, 0),
            )
            db.add(movimiento)
            num_movimientos += 1
            
            for _ in range(random.randint(2, 5)):
                tipo = random.choice([TipoMovimiento.ENTRADA, TipoMovimiento.SALIDA, TipoMovimiento.SALIDA])
                cantidad = Decimal(str(random.randint(1, 10)))
                
                if tipo == TipoMovimiento.ENTRADA:
                    stock_anterior = producto.stock_actual
                    stock_nuevo = stock_anterior + cantidad
                    motivo = random.choice(["Compra a proveedor", "Reposición mensual", "Pedido urgente"])
                else:
                    stock_anterior = producto.stock_actual
                    stock_nuevo = max(Decimal("0"), stock_anterior - cantidad)
                    motivo = random.choice(["Uso en consulta", "Consumo diario", "Tratamiento paciente"])
                
                movimiento = MovimientoInventario(
                    producto_id=producto.id,
                    tipo=tipo,
                    cantidad=cantidad,
                    motivo=motivo,
                    stock_anterior=stock_anterior,
                    stock_nuevo=stock_nuevo,
                    usuario_id=random.choice(profesionales_obj).id,
                    created_at=datetime(2026, random.randint(1, 9), random.randint(1, 28), random.randint(9, 18)),
                )
                db.add(movimiento)
                num_movimientos += 1
        
        db.commit()
        print(f"   ✅ {num_movimientos} movimientos creados")
        
        # ── RESUMEN ──
        print("\n" + "=" * 60)
        print("✅ RESET + SEED COMPLETADO EXITOSAMENTE")
        print("=" * 60)
        print("\n📈 Resumen de datos:")
        print(f"   - Usuarios: {db.query(User).count()} (admin + 3 profesionales)")
        print(f"   - Pacientes: {db.query(Paciente).count()}")
        print(f"   - Historias clínicas: {db.query(HistoriaClinica).count()}")
        print(f"   - Documentos facturación: {db.query(DocumentoFacturacion).count()}")
        print(f"   - Productos: {db.query(Producto).count()}")
        print(f"   - Citas: {db.query(Cita).count()}")
        print(f"   - Movimientos inventario: {db.query(MovimientoInventario).count()}")
        print("\n🔐 Credenciales:")
        print("   - Admin: admin / admin123456")
        print("   - Profesionales: elena / miguel / lucia → profesional123")
        print("\n📝 Nomenclatura de códigos:")
        print("   - Pacientes: PAC-00001, PAC-00002, ...")
        print("   - Historias: HC-00001, HC-00002, ...")
        print("   - Facturas:  FAC-00001, FAC-00002, ...")
        print("   - Presupuestos: PRE-00001, PRE-00002, ...")
        print("   - Productos:  INV-00001, INV-00002, ...")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    reset_y_seed()
