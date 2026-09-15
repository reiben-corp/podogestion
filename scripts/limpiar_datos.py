"""
Script para limpiar datos de prueba.
Elimina todos los datos de pacientes, historias, facturas, inventario.
NO elimina usuarios.

Ejecutar: docker exec -it clinica_backend python /app/scripts/limpiar_datos.py
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.historia_clinica import HistoriaClinica, ExploracionBiomecanica, Tratamiento, Podograma
from app.models.facturacion import DocumentoFacturacion, LineaFacturacion, MovimientoCaja, CajaDiaria
from app.models.inventario import Producto, MovimientoInventario
from app.models.paciente import Paciente


def limpiar_datos():
    db = SessionLocal()
    
    try:
        print("🧹 Limpiando datos de prueba...")
        
        # 1. Eliminar movimientos de caja
        count = db.query(MovimientoCaja).delete()
        print(f"   ✅ {count} movimientos de caja eliminados")
        
        # 2. Eliminar líneas de facturación
        count = db.query(LineaFacturacion).delete()
        print(f"   ✅ {count} líneas de facturación eliminadas")
        
        # 3. Eliminar documentos de facturación
        count = db.query(DocumentoFacturacion).delete()
        print(f"   ✅ {count} documentos de facturación eliminados")
        
        # 4. Eliminar cajas diarias
        count = db.query(CajaDiaria).delete()
        print(f"   ✅ {count} cajas diarias eliminadas")
        
        # 5. Eliminar exploraciones biomecánicas
        count = db.query(ExploracionBiomecanica).delete()
        print(f"   ✅ {count} exploraciones eliminadas")
        
        # 6. Eliminar tratamientos
        count = db.query(Tratamiento).delete()
        print(f"   ✅ {count} tratamientos eliminados")
        
        # 7. Eliminar podogramas
        count = db.query(Podograma).delete()
        print(f"   ✅ {count} podogramas eliminados")
        
        # 8. Eliminar historias clínicas
        count = db.query(HistoriaClinica).delete()
        print(f"   ✅ {count} historias clínicas eliminadas")
        
        # 9. Eliminar pacientes
        count = db.query(Paciente).delete()
        print(f"   ✅ {count} pacientes eliminados")
        
        # 10. Eliminar movimientos de inventario
        count = db.query(MovimientoInventario).delete()
        print(f"   ✅ {count} movimientos de inventario eliminados")
        
        # 11. Eliminar productos
        count = db.query(Producto).delete()
        print(f"   ✅ {count} productos eliminados")
        
        db.commit()
        print()
        print("✅ Limpieza completada")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    limpiar_datos()
