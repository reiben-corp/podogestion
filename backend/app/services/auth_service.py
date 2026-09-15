"""
Lógica de negocio para autenticación.
Separa la lógica de los endpoints para mantener el código limpio.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    """
    Verifica las credenciales de un usuario.
    Retorna el usuario si es válido, None si no.
    """
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user


def create_user(db: Session, username: str, email: str, password: str, 
                full_name: str, role: str = "asistente") -> User:
    """
    Crea un nuevo usuario con contraseña hasheada.
    """
    hashed_password = get_password_hash(password)
    
    db_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        role=role,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def generate_token_for_user(user: User) -> str:
    """Genera un token JWT para un usuario autenticado."""
    token_data = {"sub": user.username, "role": user.role.value}
    return create_access_token(data=token_data)
