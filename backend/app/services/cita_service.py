"""
Lógica de negocio para gestión de citas.
"""
from datetime import date, time
from typing import Optional
from sqlalchemy.orm import Session

from app.models.cita import Cita, EstadoCita
from app.models.paciente import Paciente


def verificar_disponibilidad(
    db: Session, 
    fecha: date, 
    hora_inicio: time, 
    hora_fin: time,
    profesional_id: Optional[int] = None,
    cita_excluir_id: int = None
) -> bool:
    """
    Verifica si hay disponibilidad en el horario dado.
    Si profesional_id es None, verifica solapamiento general (sin profesional específico).
    Retorna True si está disponible, False si hay conflicto con otra cita.
    """
    query = db.query(Cita).filter(
        Cita.fecha == fecha,
        Cita.estado != EstadoCita.CANCELADA,
        Cita.is_active == True,
        # Verificar solapamiento
        Cita.hora_inicio < hora_fin,
        Cita.hora_fin > hora_inicio
    )
    
    if profesional_id is not None:
        query = query.filter(Cita.profesional_id == profesional_id)
    
    if cita_excluir_id:
        query = query.filter(Cita.id != cita_excluir_id)
    
    return query.count() == 0


def crear_cita(db: Session, paciente_id: int,
               fecha: date = None, hora_inicio: time = None, hora_fin: time = None,
               motivo: str = None, notas: str = None,
               profesional_id: Optional[int] = None) -> Cita:
    """
    Crea una nueva cita.
    Solo requiere: paciente, fecha, hora inicio, hora fin, motivo, notas.
    El estado por defecto es CONFIRMADA.
    profesional_id es opcional.
    """
    # Verificar que el paciente existe
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id, Paciente.is_active == True
    ).first()
    if not paciente:
        raise ValueError("Paciente no encontrado")
    
    # Verificar disponibilidad
    if not verificar_disponibilidad(db, fecha, hora_inicio, hora_fin, profesional_id):
        raise ValueError("Ya existe una cita en ese horario")
    
    cita = Cita(
        paciente_id=paciente_id,
        fecha=fecha,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        motivo=motivo,
        notas=notas,
        profesional_id=profesional_id,
        estado=EstadoCita.CONFIRMADA  # Estado por defecto: confirmada
    )
    
    db.add(cita)
    db.commit()
    db.refresh(cita)
    
    return cita


def obtener_citas_dia(db: Session, fecha: date, profesional_id: Optional[int] = None) -> list[Cita]:
    """
    Obtiene todas las citas de un día específico.
    """
    query = db.query(Cita).filter(
        Cita.fecha == fecha,
        Cita.is_active == True
    )
    
    if profesional_id:
        query = query.filter(Cita.profesional_id == profesional_id)
    
    return query.order_by(Cita.hora_inicio).all()


def cambiar_estado_cita(db: Session, cita_id: int, nuevo_estado: EstadoCita) -> Cita:
    """
    Cambia el estado de una cita.
    """
    cita = db.query(Cita).filter(Cita.id == cita_id, Cita.is_active == True).first()
    if not cita:
        raise ValueError("Cita no encontrada")
    
    cita.estado = nuevo_estado
    db.commit()
    db.refresh(cita)
    
    return cita
