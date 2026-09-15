"""
Importa todos los modelos para que Alembic los detecte automáticamente.
"""
from app.core.database import Base
from app.models.user import User, UserRole
from app.models.paciente import Paciente, EstadoCivil, Sexo
from app.models.cita import Cita, EstadoCita
from app.models.historia_clinica import (
    HistoriaClinica, ExploracionBiomecanica, Tratamiento, Podograma,
    TipoExploracion, TipoTratamiento
)
from app.models.facturacion import (
    DocumentoFacturacion, LineaFacturacion, CajaDiaria, MovimientoCaja,
    TipoDocumento, EstadoDocumento, MetodoPago
)
from app.models.inventario import (
    Producto, MovimientoInventario,
    CategoriaProducto, UnidadMedida, TipoMovimiento
)

__all__ = [
    "Base", "User", "UserRole", "Paciente", "EstadoCivil", "Sexo", 
    "Cita", "EstadoCita", "HistoriaClinica", "ExploracionBiomecanica", 
    "Tratamiento", "Podograma", "TipoExploracion", "TipoTratamiento",
    "DocumentoFacturacion", "LineaFacturacion", "CajaDiaria", "MovimientoCaja",
    "TipoDocumento", "EstadoDocumento", "MetodoPago",
    "Producto", "MovimientoInventario",
    "CategoriaProducto", "UnidadMedida", "TipoMovimiento"
]

# Módulo de estadísticas (no tiene modelos propios)
