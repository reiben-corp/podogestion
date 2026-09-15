"""
Script para crear el primer usuario administrador.
Ejecutar: docker exec -it clinica_backend python /app/scripts/seed.py
"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def create_admin():
    db = SessionLocal()
    
    # Verificar si ya existe un admin
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("⚠️  El usuario admin ya existe")
        return
    
    admin = User(
        username="admin",
        email="admin@clinica.local",
        hashed_password=get_password_hash("admin123456"),
        full_name="Administrador",
        role="admin",
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    print("✅ Usuario admin creado exitosamente")
    print("   Username: admin")
    print("   Password: admin123456")
    print("   ⚠️  Cambia esta contraseña en producción")


if __name__ == "__main__":
    create_admin()
