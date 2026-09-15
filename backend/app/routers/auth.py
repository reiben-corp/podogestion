"""
Endpoints de autenticación: login, registro, obtención de usuario actual.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.services.auth_service import authenticate_user, create_user, generate_token_for_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Autenticación"], redirect_slashes=False)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Inicia sesión con username y password.
    Retorna un token JWT para usar en peticiones posteriores.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = generate_token_for_user(user)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Solo usuarios logueados pueden registrar
):
    """
    Registra un nuevo usuario en el sistema.
    Requiere estar autenticado (solo admin debería poder registrar).
    """
    # Verificar si el username ya existe
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El username o email ya está registrado"
        )
    
    new_user = create_user(
        db=db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role.value
    )
    
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Obtiene los datos del usuario actualmente autenticado.
    Útil para verificar que el token es válido.
    """
    return current_user
