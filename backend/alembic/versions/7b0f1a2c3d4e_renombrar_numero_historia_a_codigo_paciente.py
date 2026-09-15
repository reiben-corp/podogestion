"""Renombrar numero_historia a codigo_paciente en tabla pacientes

Revision ID: 7b0f1a2c3d4e
Revises: 1a2b3c4d5e6f
Create Date: 2026-09-15 10:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '7b0f1a2c3d4e'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('pacientes', 'numero_historia', new_column_name='codigo_paciente')


def downgrade() -> None:
    op.alter_column('pacientes', 'codigo_paciente', new_column_name='numero_historia')
