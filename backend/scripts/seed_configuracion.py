"""
Script para inicializar las configuraciones por defecto del sistema.
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.configuracion import Configuracion


def seed_configuraciones():
    """Inserta las configuraciones por defecto si no existen."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    try:
        # Configuraciones por defecto
        defaults = [
            {
                "clave": "clinica_nombre",
                "valor": "Clínica Podológica",
                "descripcion": "Nombre de la clínica que aparece en el dashboard",
            },
            {
                "clave": "clinica_direccion",
                "valor": "Calle Principal 123, Madrid",
                "descripcion": "Dirección de la clínica que aparece en el dashboard",
            },
            {
                "clave": "clinica_telefono",
                "valor": "912 345 678",
                "descripcion": "Teléfono de contacto",
            },
            {
                "clave": "clinica_email",
                "valor": "info@clinica-podologica.es",
                "descripcion": "Email de contacto",
            },
        ]
        
        for item in defaults:
            existente = db.query(Configuracion).filter(
                Configuracion.clave == item["clave"]
            ).first()
            if not existente:
                config = Configuracion(**item)
                db.add(config)
                print(f"✅ Creada configuración: {item['clave']}")
            else:
                print(f"ℹ️ Ya existe: {item['clave']}")
        
        db.commit()
        print("\n🎉 Configuraciones inicializadas correctamente")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_configuraciones()
