"""
Endpoints de administración del portal.
Solo accesibles para usuarios con rol 'admin'.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.auth_service import create_user
from app.core.security import get_password_hash
from app.core.dependencies import get_current_active_admin as require_admin

router = APIRouter(prefix="/api/admin", tags=["Administración"], redirect_slashes=False)





# ── Gestión de Usuarios ──

@router.get("/usuarios", response_model=dict)
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Lista todos los usuarios del sistema."""
    query = db.query(User)
    
    if busqueda:
        filtro = f"%{busqueda}%"
        query = query.filter(
            (User.username.ilike(filtro)) |
            (User.full_name.ilike(filtro)) |
            (User.email.ilike(filtro))
        )
    
    total = query.count()
    offset = (pagina - 1) * por_pagina
    usuarios = query.order_by(User.created_at.desc()).offset(offset).limit(por_pagina).all()
    
    return {
        "total": total,
        "pagina": pagina,
        "por_pagina": por_pagina,
        "usuarios": [UserResponse.model_validate(u) for u in usuarios]
    }


@router.post("/usuarios", response_model=UserResponse, status_code=201)
async def crear_usuario(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Crea un nuevo usuario (solo admin)."""
    return create_user(
        db=db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role.value
    )


@router.get("/usuarios/{usuario_id}", response_model=UserResponse)
async def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtiene los datos de un usuario específico."""
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/usuarios/{usuario_id}", response_model=UserResponse)
async def actualizar_usuario(
    usuario_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualiza los datos de un usuario."""
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
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


@router.delete("/usuarios/{usuario_id}", status_code=204)
async def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Elimina un usuario (soft delete - marca como inactivo)."""
    usuario = db.query(User).filter(User.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # No permitir eliminarse a sí mismo
    if usuario.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    
    usuario.is_active = False
    db.commit()
    return None


# ── Estadísticas del Portal ──

@router.get("/estadisticas")
async def estadisticas_portal(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Obtiene estadísticas generales del portal."""
    from app.models.paciente import Paciente
    from app.models.cita import Cita
    from app.models.historia_clinica import HistoriaClinica
    from app.models.facturacion import DocumentoFacturacion
    from app.models.inventario import Producto
    
    return {
        "total_usuarios": db.query(User).count(),
        "usuarios_activos": db.query(User).filter(User.is_active == True).count(),
        "total_pacientes": db.query(Paciente).filter(Paciente.is_active == True).count(),
        "total_citas": db.query(Cita).filter(Cita.is_active == True).count(),
        "total_historias": db.query(HistoriaClinica).filter(HistoriaClinica.is_active == True).count(),
        "total_documentos": db.query(DocumentoFacturacion).filter(DocumentoFacturacion.is_active == True).count(),
        "total_productos": db.query(Producto).filter(Producto.is_active == True).count(),
    }
