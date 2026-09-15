"""
Funciones de seguridad: hashing de contraseñas y tokens JWT.
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional

from jose import JWTError, jwt
import bcrypt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra su hash."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT con los datos del usuario.
    Incluye fecha de expiración automática.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(ZoneInfo('Europe/Madrid')) + expires_delta
    else:
        expire = datetime.now(ZoneInfo('Europe/Madrid')) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y verifica un token JWT.
    Retorna None si el token es inválido o expiró.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
