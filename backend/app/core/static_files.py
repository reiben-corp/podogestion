"""Servir archivos estáticos de documentos y favicon.

Permite que los archivos de consentimiento sean accesibles públicamente.
La ruta de almacenamiento es configurable desde el panel de administración.
"""
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Obtener la ruta base del backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Variable global para la ruta de documentos (se actualiza al inicio)
_documentos_dir = os.path.join(BASE_DIR, "documentos_consentimiento")


def set_documentos_dir(ruta: str):
    """Actualiza la ruta de documentos desde la configuración."""
    global _documentos_dir
    _documentos_dir = os.path.join(BASE_DIR, ruta)
    os.makedirs(_documentos_dir, exist_ok=True)


def get_documentos_dir() -> str:
    """Obtiene la ruta actual de documentos."""
    return _documentos_dir


def setup_static_files(app: FastAPI):
    """Configura los archivos estáticos para documentos."""
    os.makedirs(_documentos_dir, exist_ok=True)
    
    # Servir archivos de documentos de forma pública
    app.mount("/documentos", StaticFiles(directory=_documentos_dir), name="documentos")
