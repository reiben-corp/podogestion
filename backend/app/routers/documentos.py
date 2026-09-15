"""
Router para la gestión de documentos de consentimiento de pacientes.
"""
import os
import uuid
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.paciente import Paciente

# Tokens temporales para visualización (token_hash -> (paciente_id, expiración))
_tokens_temporales: Dict[str, tuple] = []

SECRET_KEY = "clinica_podologia_secret_2026"  # En producción usar variable de entorno
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DEFAULT_DOCUMENTOS_DIR = os.path.join(BASE_DIR, "documentos_consentimiento")
os.makedirs(DEFAULT_DOCUMENTOS_DIR, exist_ok=True)


def _limpiar_tokens_expirados():
    """Elimina tokens expirados de la lista."""
    ahora = datetime.utcnow()
    global _tokens_temporales
    _tokens_temporales[:] = [t for t in _tokens_temporales if t[2] > ahora]


def _crear_token(paciente_id: int) -> str:
    """Crea un token temporal de 5 minutos para visualizar un documento."""
    _limpiar_tokens_expirados()
    
    # Generar token aleatorio
    random_str = secrets.token_hex(16)
    expiracion = datetime.utcnow() + timedelta(minutes=5)
    timestamp = str(int(expiracion.timestamp()))
    
    # Crear token firmado: random.paciente_id.timestamp.firma
    datos = f"{random_str}.{paciente_id}.{timestamp}"
    firma = hmac.new(SECRET_KEY.encode(), datos.encode(), hashlib.sha256).hexdigest()[:16]
    token = f"{datos}.{firma}"
    
    # Guardar token
    _tokens_temporales.append((token, paciente_id, expiracion))
    
    return token


def _verificar_token(token: str, paciente_id: int) -> bool:
    """Verifica que el token sea válido y no haya expirado."""
    _limpiar_tokens_expirados()
    
    for t, pid, exp in _tokens_temporales:
        if t == token and pid == paciente_id and exp > datetime.utcnow():
            return True
    return False


def get_documentos_dir(db: Session) -> str:
    """Obtiene la ruta de almacenamiento desde la configuración."""
    from app.models.configuracion import Configuracion
    from app.core.static_files import get_documentos_dir as get_dir
    config = db.query(Configuracion).filter(Configuracion.clave == "documentos_ruta").first()
    if config and config.valor:
        ruta = os.path.join(BASE_DIR, config.valor)
        os.makedirs(ruta, exist_ok=True)
        return ruta
    return get_dir()


router = APIRouter(prefix="/api/documentos", tags=["documentos"], redirect_slashes=False)


@router.post("/consentimiento/{paciente_id}")
async def subir_documento_consentimiento(
    paciente_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Sube el documento de consentimiento firmado por el paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    allowed_extensions = {".pdf", ".jpg", ".jpeg", ".png"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Use: {', '.join(allowed_extensions)}"
        )
    
    documentos_dir = get_documentos_dir(db)
    filename = f"consentimiento_{paciente.numero_historia}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(documentos_dir, filename)
    
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    ruta_relativa = os.path.relpath(filepath, BASE_DIR)
    paciente.documento_consentimiento = ruta_relativa
    paciente.consentimiento_datos = True
    paciente.consentimiento_fecha = datetime.now()
    db.commit()
    db.refresh(paciente)
    
    return {
        "message": "Documento subido correctamente",
        "filename": filename,
        "paciente": f"{paciente.nombre} {paciente.apellidos}"
    }


@router.get("/consentimiento/{paciente_id}")
async def descargar_documento_consentimiento(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Descarga el documento de consentimiento (requiere autenticación por header).
    Para visualización en nueva pestaña usar /api/documentos/ver/{paciente_id}?token=xxx
    """
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    if not paciente.documento_consentimiento:
        raise HTTPException(status_code=404, detail="No hay documento de consentimiento")
    
    filepath = os.path.join(BASE_DIR, paciente.documento_consentimiento)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")
    
    return _servir_archivo(filepath, paciente)


@router.get("/ver/{paciente_id}")
async def ver_documento_publico(
    paciente_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Visualiza el documento con un token temporal (no requiere header de auth).
    El token se obtiene vía POST /api/documentos/token/{paciente_id}
    """
    if not _verificar_token(token, paciente_id):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    if not paciente.documento_consentimiento:
        raise HTTPException(status_code=404, detail="No hay documento de consentimiento")
    
    filepath = os.path.join(BASE_DIR, paciente.documento_consentimiento)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")
    
    return _servir_archivo(filepath, paciente)


@router.post("/token/{paciente_id}")
async def obtener_token_visualizacion(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Obtiene un token temporal para visualizar el documento en una nueva pestaña."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    if not paciente.documento_consentimiento:
        raise HTTPException(status_code=404, detail="No hay documento de consentimiento")
    
    token = _crear_token(paciente_id)
    return {"token": token, "expiracion": 300}  # 5 minutos


@router.delete("/consentimiento/{paciente_id}")
async def eliminar_documento_consentimiento(
    paciente_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Elimina el documento de consentimiento de un paciente."""
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.is_active == True
    ).first()
    
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    if not paciente.documento_consentimiento:
        raise HTTPException(status_code=404, detail="No hay documento de consentimiento")
    
    filepath = os.path.join(BASE_DIR, paciente.documento_consentimiento)
    
    if os.path.exists(filepath):
        os.remove(filepath)
    
    paciente.documento_consentimiento = None
    paciente.consentimiento_datos = False
    paciente.consentimiento_fecha = None
    db.commit()
    
    return {"message": "Documento eliminado correctamente"}


def _servir_archivo(filepath: str, paciente: Paciente):
    """Sirve un archivo con los headers correctos para visualización inline."""
    ext = os.path.splitext(filepath)[1].lower()
    media_types = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
    }
    media_type = media_types.get(ext, 'application/octet-stream')

    return FileResponse(
        path=filepath,
        filename=f"consentimiento_{paciente.numero_historia}{ext}",
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename=consentimiento_{paciente.numero_historia}{ext}"
        }
    )
