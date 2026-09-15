"""Servir archivos estáticos de documentos y favicon.

Permite que los archivos de consentimiento sean accesibles públicamente.
"""
import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Obtener la ruta base del backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def setup_static_files(app: FastAPI):
    """Configura los archivos estáticos para documentos."""
    documentos_dir = os.path.join(BASE_DIR, "documentos_consentimiento")
    os.makedirs(documentos_dir, exist_ok=True)
    
    # Servir archivos de documentos de forma pública
    app.mount("/documentos", StaticFiles(directory=documentos_dir), name="documentos")
