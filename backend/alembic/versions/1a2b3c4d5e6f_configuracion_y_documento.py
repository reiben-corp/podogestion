"""Crear tabla configuracion

Revision ID: 1a2b3c4d5e6f
Revises: 2c438ac0f24b
Create Date: 2026-09-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, None] = '2c438ac0f24b'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    # Crear tabla configuracion (documento_consentimiento ya existe)
    op.create_table(
        'configuracion',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('clave', sa.String(100), unique=True, index=True, nullable=False),
        sa.Column('valor', sa.Text(), nullable=True),
        sa.Column('descripcion', sa.String(255), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    
    # Insertar configuraciones por defecto
    op.execute("""
        INSERT INTO configuracion (clave, valor, descripcion) VALUES
        ('clinica_nombre', 'Clínica Podológica', 'Nombre de la clínica que aparece en el dashboard'),
        ('clinica_direccion', 'Calle Principal 123, Madrid', 'Dirección de la clínica que aparece en el dashboard'),
        ('clinica_telefono', '912 345 678', 'Teléfono de contacto'),
        ('clinica_email', 'info@clinica-podologica.es', 'Email de contacto');
    """)


def downgrade() -> None:
    op.drop_table('configuracion')
