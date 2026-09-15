"""
Lógica de negocio para historia clínica.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.historia_clinica import (
    HistoriaClinica, ExploracionBiomecanica, Tratamiento, Podograma,
    TipoExploracion, TipoTratamiento
)
from app.models.paciente import Paciente
from app.models.user import User


def generar_numero_historia(db: Session, paciente_id: int, fecha_consulta=None) -> str:
    """
    Genera un número de historia clínico único basado en orden cronológico.
    Formato: HC-{paciente_id:05d}-{num_consulta:03d}
    
    El número se asigna contando cuántas historias tienen fecha <= la fecha
    de la nueva historia, garantizando que el orden sea cronológico.
    """
    from datetime import datetime
    if not fecha_consulta:
        fecha_consulta = datetime.now()
    
    # Contar historias anteriores o iguales en fecha para este paciente
    count = db.query(HistoriaClinica).filter(
        HistoriaClinica.paciente_id == paciente_id,
        HistoriaClinica.fecha_consulta <= fecha_consulta
    ).count()
    num_consulta = count + 1
    return f"HC-{paciente_id:05d}-{num_consulta:03d}"


def crear_historia_completa(
    db: Session,
    paciente_id: int,
    profesional_id: int,
    motivo_consulta: str = None,
    antecedentes_personales: str = None,
    antecedentes_familiares: str = None,
    exploracion_fisica: str = None,
    diagnostico: str = None,
    codigo_diagnostico: str = None,
    plan_tratamiento: str = None,
    evolucion: str = None,
    observaciones: str = None,
    exploraciones: list = None,
    tratamientos: list = None,
    podogramas: list = None,
    fecha_consulta=None
) -> HistoriaClinica:
    """
    Crea una historia clínica completa con sus relaciones.
    """
    # Verificar que el paciente existe
    paciente = db.query(Paciente).filter(
        Paciente.id == paciente_id, Paciente.is_active == True
    ).first()
    if not paciente:
        raise ValueError("Paciente no encontrado")
    
    # Verificar que el profesional existe
    profesional = db.query(User).filter(
        User.id == profesional_id, User.is_active == True
    ).first()
    if not profesional:
        raise ValueError("Profesional no encontrado")
    
    # Generar número de historia único basado en fecha
    numero_historia = generar_numero_historia(db, paciente_id, fecha_consulta)
    
    # Crear historia clínica
    historia = HistoriaClinica(
        numero_historia=numero_historia,
        paciente_id=paciente_id,
        profesional_id=profesional_id,
        motivo_consulta=motivo_consulta,
        antecedentes_personales=antecedentes_personales,
        antecedentes_familiares=antecedentes_familiares,
        exploracion_fisica=exploracion_fisica,
        diagnostico=diagnostico,
        codigo_diagnostico=codigo_diagnostico,
        plan_tratamiento=plan_tratamiento,
        evolucion=evolucion,
        observaciones=observaciones
    )
    db.add(historia)
    db.flush()  # Para obtener el ID
    
    # Añadir exploraciones
    if exploraciones:
        for exp in exploraciones:
            if isinstance(exp, dict):
                exp_data = exp
            else:
                exp_data = exp.model_dump()
            exploracion = ExploracionBiomecanica(
                historia_id=historia.id,
                tipo=exp_data.get('tipo', TipoExploracion.ESTATICA),
                datos=exp_data.get('datos'),
                resultado=exp_data.get('resultado'),
                observaciones=exp_data.get('observaciones')
            )
            db.add(exploracion)
    
    # Añadir tratamientos
    if tratamientos:
        for trat in tratamientos:
            if isinstance(trat, dict):
                trat_data = trat
            else:
                trat_data = trat.model_dump()
            tratamiento = Tratamiento(
                historia_id=historia.id,
                tipo=trat_data.get('tipo', TipoTratamiento.QUIROPODIA),
                descripcion=trat_data.get('descripcion', ''),
                zona=trat_data.get('zona'),
                pie=trat_data.get('pie'),
                resultado=trat_data.get('resultado'),
                observaciones=trat_data.get('observaciones')
            )
            db.add(tratamiento)
    
    # Añadir podogramas
    if podogramas:
        for pod in podogramas:
            if isinstance(pod, dict):
                pod_data = pod
            else:
                pod_data = pod.model_dump()
            podograma = Podograma(
                historia_id=historia.id,
                pie=pod_data.get('pie', 'izquierdo'),
                datos=pod_data.get('datos', {}),
                imagen=pod_data.get('imagen'),
                observaciones=pod_data.get('observaciones')
            )
            db.add(podograma)
    
    db.commit()
    db.refresh(historia)
    return historia


def obtener_historias_paciente(db: Session, paciente_id: int) -> list[HistoriaClinica]:
    """
    Obtiene todas las historias clínicas de un paciente.
    """
    return db.query(HistoriaClinica).filter(
        HistoriaClinica.paciente_id == paciente_id,
        HistoriaClinica.is_active == True
    ).order_by(HistoriaClinica.fecha_consulta.desc()).all()


def obtener_ultima_consulta(db: Session, paciente_id: int) -> HistoriaClinica | None:
    """
    Obtiene la última consulta de un paciente.
    """
    return db.query(HistoriaClinica).filter(
        HistoriaClinica.paciente_id == paciente_id,
        HistoriaClinica.is_active == True
    ).order_by(HistoriaClinica.fecha_consulta.desc()).first()


def enriquecer_historia(historia: HistoriaClinica) -> dict:
    """
    Añade nombres de paciente y profesional a la respuesta.
    """
    return {
        "id": historia.id,
        "numero_historia": historia.numero_historia,
        "paciente_id": historia.paciente_id,
        "profesional_id": historia.profesional_id,
        "fecha_consulta": historia.fecha_consulta,
        "motivo_consulta": historia.motivo_consulta,
        "antecedentes_personales": historia.antecedentes_personales,
        "antecedentes_familiares": historia.antecedentes_familiares,
        "exploracion_fisica": historia.exploracion_fisica,
        "diagnostico": historia.diagnostico,
        "codigo_diagnostico": historia.codigo_diagnostico,
        "plan_tratamiento": historia.plan_tratamiento,
        "evolucion": historia.evolucion,
        "observaciones": historia.observaciones,
        "is_active": historia.is_active,
        "created_at": historia.created_at,
        "updated_at": historia.updated_at,
        "paciente_nombre": historia.paciente.nombre_completo if historia.paciente else None,
        "profesional_nombre": historia.profesional.full_name if historia.profesional else None,
        "exploraciones": [
            {
                "id": exp.id,
                "historia_id": exp.historia_id,
                "tipo": exp.tipo,
                "fecha": exp.fecha,
                "datos": exp.datos,
                "resultado": exp.resultado,
                "observaciones": exp.observaciones,
                "is_active": exp.is_active
            }
            for exp in historia.exploraciones if exp.is_active
        ],
        "tratamientos": [
            {
                "id": trat.id,
                "historia_id": trat.historia_id,
                "tipo": trat.tipo,
                "fecha": trat.fecha,
                "descripcion": trat.descripcion,
                "zona": trat.zona,
                "pie": trat.pie,
                "resultado": trat.resultado,
                "observaciones": trat.observaciones,
                "is_active": trat.is_active
            }
            for trat in historia.tratamientos if trat.is_active
        ],
        "podogramas": [
            {
                "id": pod.id,
                "historia_id": pod.historia_id,
                "pie": pod.pie,
                "fecha": pod.fecha,
                "datos": pod.datos,
                "imagen": pod.imagen,
                "observaciones": pod.observaciones,
                "is_active": pod.is_active
            }
            for pod in historia.podogramas if pod.is_active
        ]
    }
