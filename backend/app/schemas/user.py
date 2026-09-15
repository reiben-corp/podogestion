"""
Esquemas Pydantic para validación de datos de usuario.
Separan lo que se recibe (request) de lo que se devuelve (response).
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.models.user import UserRole


# ── Esquemas base ──

class UserBase(BaseModel):
    """Campos comunes a todos los esquemas de usuario."""
    username: str = Field(..., min_length=3, max_length=50, examples=["juanperez"])
    email: str = Field(..., max_length=100)  # Sin validación estricta de email
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.ASISTENTE


# ── Requests (lo que envía el cliente) ──

class UserCreate(UserBase):
    """Datos necesarios para crear un usuario."""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Credenciales para iniciar sesión."""
    username: str
    password: str


class UserUpdate(BaseModel):
    """Datos que se pueden actualizar (todos opcionales)."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, max_length=100)


# ── Responses (lo que devuelve el servidor) ──

class UserResponse(UserBase):
    """Datos del usuario que se devuelven al cliente (sin contraseña)."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Permite convertir desde modelo SQLAlchemy


class Token(BaseModel):
    """Token JWT devuelto al iniciar sesión."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Datos contenidos en el token JWT."""
    username: Optional[str] = None
