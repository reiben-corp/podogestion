"""
Endpoints de gestión de usuarios del portal.
Incluye actualización de datos del usuario logado.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate
from app.core.security import get_password_hash

router = APIRouter(prefix="/api/users", tags=["Usuarios"], redirect_slashes=False)


@router.get("/me", response_model=UserResponse)
async def obtener_perfil(
    current_user: User = Depends(get_current_user)
):
    """Obtiene los datos del usuario actualmente autenticado."""
    return current_user


@router.put("/{user_id}", response_model=UserResponse)
async def actualizar_usuario(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza los datos de un usuario.
    Los usuarios pueden actualizar su propio perfil. Los admins pueden actualizar cualquiera.
    """
    # Verificar permisos (solo el propio usuario o admin)
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes editar tu propio perfil"
        )

    usuario = db.query(User).filter(User.id == user_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    update_data = user_data.model_dump(exclude_unset=True)

    # Si se actualiza el rol, convertir de Enum a valor string
    if "role" in update_data and update_data["role"]:
        update_data["role"] = update_data["role"].value if hasattr(update_data["role"], 'value') else update_data["role"]

    # Si se actualiza la contraseña, hashearla
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]

    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario
