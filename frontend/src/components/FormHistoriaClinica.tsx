/**
 * Formulario completo de Historia Clínica.
 * Usa todos los campos del modelo HistoriaClinica del backend.
 */
import { useState } from 'react';
import Podograma from './Podograma';

export interface HistoriaClinicaFormData {
  paciente_id: number | '';
  motivo_consulta: string;
  antecedentes_personales: string;
  antecedentes_familiares: string;
  exploracion_fisica: string;
  diagnostico: string;
  codigo_diagnostico: string;
  plan_tratamiento: string;
  evolucion: string;
  observaciones: string;
  // Podogramas
  podograma_izquierdo_datos: Record<string, any>;
  podograma_derecho_datos: Record<string, any>;
  // Exploraciones biomecánicas
  exploraciones: Array<{
    tipo: string;
    datos: Record<string, any> | null;
    resultado: string;
    observaciones: string;
  }>;
  // Tratamientos
  tratamientos: Array<{
    tipo: string;
    descripcion: string;
    zona: string;
    pie: string;
    resultado: string;
    observaciones: string;
  }>;
}

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

interface FormHistoriaClinicaProps {
  pacientes: PacienteOption[];
  initialData?: Partial<HistoriaClinicaFormData>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  formRef?: React.Ref<HTMLFormElement>;
}

export const defaultHistoriaForm: HistoriaClinicaFormData = {
  paciente_id: '',
  motivo_consulta: '',
  antecedentes_personales: '',
  antecedentes_familiares: '',
  exploracion_fisica: '',
  diagnostico: '',
  codigo_diagnostico: '',
  plan_tratamiento: '',
  evolucion: '',
  observaciones: '',
  podograma_izquierdo_datos: {},
  podograma_derecho_datos: {},
  exploraciones: [],
  tratamientos: [],
};

const TIPOS_EXPLORACION = [
  { value: 'estatica', label: 'Estática' },
  { value: 'dinamica', label: 'Dinámica' },
  { value: 'marcha', label: 'Marcha' },
  { value: 'carrera', label: 'Carrera' },
  { value: 'equilibrio', label: 'Equilibrio' },
];

const TIPOS_TRATAMIENTO = [
  { value: 'quiropodologia', label: 'Quiropodología' },
  { value: 'ortesis', label: 'Ortesis' },
  { value: 'plantillas', label: 'Plantillas' },
  { value: 'rehabilitacion', label: 'Rehabilitación' },
  { value: 'cirurgia', label: 'Cirugía' },
  { value: 'otro', label: 'Otro' },
];

function FormHistoriaClinica({
  pacientes,
  initialData,
  onSubmit,
  onCancel,
  loading,
  formRef,
}: FormHistoriaClinicaProps) {
  const [formData, setFormData] = useState<HistoriaClinicaFormData>({
    ...defaultHistoriaForm,
    ...initialData,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mostrarPodograma, setMostrarPodograma] = useState(false);
  const [mostrarExploraciones, setMostrarExploraciones] = useState(false);
  const [mostrarTratamientos, setMostrarTratamientos] = useState(false);
  const esEdicion = !!initialData && initialData.paciente_id;

  const handleChange = (field: keyof HistoriaClinicaFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ── Exploraciones Biomecánicas ──
  const agregarExploracion = () => {
    setFormData(prev => ({
      ...prev,
      exploraciones: [...prev.exploraciones, { tipo: 'estatica', datos: null, resultado: '', observaciones: '' }],
    }));
  };

  const actualizarExploracion = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const nuevas = [...prev.exploraciones];
      nuevas[index] = { ...nuevas[index], [field]: value };
      return { ...prev, exploraciones: nuevas };
    });
  };

  const eliminarExploracion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exploraciones: prev.exploraciones.filter((_, i) => i !== index),
    }));
  };

  // ── Tratamientos ──
  const agregarTratamiento = () => {
    setFormData(prev => ({
      ...prev,
      tratamientos: [...prev.tratamientos, { tipo: 'quiropodologia', descripcion: '', zona: '', pie: 'izquierdo', resultado: '', observaciones: '' }],
    }));
  };

  const actualizarTratamiento = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const nuevos = [...prev.tratamientos];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return { ...prev, tratamientos: nuevos };
    });
  };

  const eliminarTratamiento = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tratamientos: prev.tratamientos.filter((_, i) => i !== index),
    }));
  };

  // ── Podograma ──
  const handlePodogramaChange = (pie: 'izquierdo' | 'derecho', zonaId: string, presion: number) => {
    const key = pie === 'izquierdo' ? 'podograma_izquierdo_datos' : 'podograma_derecho_datos';
    setFormData(prev => ({
      ...prev,
      [key]: { ...prev[key], [zonaId]: { presion } },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.paciente_id) {
      setError('Debe seleccionar un paciente');
      return;
    }
    if (!formData.motivo_consulta.trim()) {
      setError('El motivo de consulta es obligatorio');
      return;
    }

    try {
      // Construir datos para enviar
      const dataToSend: any = {
        paciente_id: Number(formData.paciente_id),
        motivo_consulta: formData.motivo_consulta || null,
        antecedentes_personales: formData.antecedentes_personales || null,
        antecedentes_familiares: formData.antecedentes_familiares || null,
        exploracion_fisica: formData.exploracion_fisica || null,
        diagnostico: formData.diagnostico || null,
        codigo_diagnostico: formData.codigo_diagnostico || null,
        plan_tratamiento: formData.plan_tratamiento || null,
        evolucion: formData.evolucion || null,
        observaciones: formData.observaciones || null,
        exploraciones: formData.exploraciones.filter(e => e.tipo),
        tratamientos: formData.tratamientos.filter(t => t.descripcion.trim()),
        podogramas: [],
      };

      // Añadir podogramas si tienen datos
      if (Object.keys(formData.podograma_izquierdo_datos).length > 0) {
        dataToSend.podogramas.push({
          pie: 'izquierdo',
          datos: formData.podograma_izquierdo_datos,
        });
      }
      if (Object.keys(formData.podograma_derecho_datos).length > 0) {
        dataToSend.podogramas.push({
          pie: 'derecho',
          datos: formData.podograma_derecho_datos,
        });
      }

      await onSubmit(dataToSend);
      setSuccess('Consulta guardada correctamente');
      if (!esEdicion) {
        setTimeout(() => {
          onCancel();
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la consulta';
      setError(msg);
    }
  };

  return (
    <form ref={formRef} id="form-historia-clinica" onSubmit={handleSubmit}>
      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#d4edda', color: '#155724', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          {success}
        </div>
      )}

      {/* Selector de paciente */}
      <div className="form-group">
        <label>Paciente *</label>
        <select
          value={formData.paciente_id}
          onChange={e => handleChange('paciente_id', e.target.value ? Number(e.target.value) : '')}
          required
        >
          <option value="">Seleccionar paciente...</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
          ))}
        </select>
      </div>

      {/* 1. Motivo de Consulta */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📝 1. Motivo de Consulta</h4>
        <div className="form-group">
          <textarea
            rows={3}
            placeholder="Motivo de la consulta (obligatorio)"
            value={formData.motivo_consulta}
            onChange={e => handleChange('motivo_consulta', e.target.value)}
            required
          />
        </div>
      </div>

      {/* 2. Antecedentes */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📋 2. Antecedentes</h4>
        <div className="form-group">
          <label>Antecedentes Personales</label>
          <textarea
            rows={2}
            placeholder="Enfermedades previas, cirugías, alergias..."
            value={formData.antecedentes_personales}
            onChange={e => handleChange('antecedentes_personales', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Antecedentes Familiares</label>
          <textarea
            rows={2}
            placeholder="Antecedentes familiares relevantes..."
            value={formData.antecedentes_familiares}
            onChange={e => handleChange('antecedentes_familiares', e.target.value)}
          />
        </div>
      </div>

      {/* 3. Exploración Física */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">🔍 3. Exploración Física</h4>
        <div className="form-group">
          <label>Hallazgos de la exploración</label>
          <textarea
            rows={3}
            placeholder="Resultados de la exploración física..."
            value={formData.exploracion_fisica}
            onChange={e => handleChange('exploracion_fisica', e.target.value)}
          />
        </div>
      </div>

      {/* 4. Diagnóstico */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">🎯 4. Diagnóstico</h4>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="form-group">
            <label>Diagnóstico</label>
            <textarea
              rows={2}
              placeholder="Diagnóstico principal..."
              value={formData.diagnostico}
              onChange={e => handleChange('diagnostico', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Código CIAP-2</label>
            <input
              type="text"
              placeholder="Ej: S78"
              value={formData.codigo_diagnostico}
              onChange={e => handleChange('codigo_diagnostico', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 5. Plan de Tratamiento */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">💊 5. Plan de Tratamiento</h4>
        <div className="form-group">
          <textarea
            rows={3}
            placeholder="Plan de tratamiento propuesto..."
            value={formData.plan_tratamiento}
            onChange={e => handleChange('plan_tratamiento', e.target.value)}
          />
        </div>
      </div>

      {/* 6. Evolución */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📈 6. Evolución</h4>
        <div className="form-group">
          <textarea
            rows={2}
            placeholder="Notas de evolución..."
            value={formData.evolucion}
            onChange={e => handleChange('evolucion', e.target.value)}
          />
        </div>
      </div>

      {/* 7. Observaciones */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📌 7. Observaciones</h4>
        <div className="form-group">
          <textarea
            rows={2}
            placeholder="Observaciones adicionales..."
            value={formData.observaciones}
            onChange={e => handleChange('observaciones', e.target.value)}
          />
        </div>
      </div>

      {/* 8. Exploraciones Biomecánicas (Colapsable) */}
      <div className="form-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 className="form-seccion-titulo" style={{ margin: 0 }}>⚡ 8. Exploraciones Biomecánicas</h4>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setMostrarExploraciones(!mostrarExploraciones)}
          >
            {mostrarExploraciones ? 'Ocultar' : `Ver (${formData.exploraciones.length})`}
          </button>
        </div>
        {mostrarExploraciones && (
          <>
            {formData.exploraciones.map((exp, idx) => (
              <div key={idx} style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#1e3a5f' }}>Exploración #{idx + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                    onClick={() => eliminarExploracion(idx)}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={exp.tipo} onChange={e => actualizarExploracion(idx, 'tipo', e.target.value)}>
                      {TIPOS_EXPLORACION.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resultado</label>
                    <input type="text" placeholder="Resultado" value={exp.resultado} onChange={e => actualizarExploracion(idx, 'resultado', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea rows={2} placeholder="Observaciones..." value={exp.observaciones} onChange={e => actualizarExploracion(idx, 'observaciones', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem' }} onClick={agregarExploracion}>
              + Añadir Exploración
            </button>
          </>
        )}
      </div>

      {/* 9. Tratamientos (Colapsable) */}
      <div className="form-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 className="form-seccion-titulo" style={{ margin: 0 }}>🩹 9. Tratamientos</h4>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setMostrarTratamientos(!mostrarTratamientos)}
          >
            {mostrarTratamientos ? 'Ocultar' : `Ver (${formData.tratamientos.length})`}
          </button>
        </div>
        {mostrarTratamientos && (
          <>
            {formData.tratamientos.map((trat, idx) => (
              <div key={idx} style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#1e3a5f' }}>Tratamiento #{idx + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                    onClick={() => eliminarTratamiento(idx)}
                  >
                    ✕
                  </button>
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={trat.tipo} onChange={e => actualizarTratamiento(idx, 'tipo', e.target.value)}>
                      {TIPOS_TRATAMIENTO.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Zona</label>
                    <input type="text" placeholder="Ej: Hallux" value={trat.zona} onChange={e => actualizarTratamiento(idx, 'zona', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción *</label>
                  <textarea rows={2} placeholder="Descripción del tratamiento..." value={trat.descripcion} onChange={e => actualizarTratamiento(idx, 'descripcion', e.target.value)} />
                </div>
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Pie</label>
                    <select value={trat.pie} onChange={e => actualizarTratamiento(idx, 'pie', e.target.value)}>
                      <option value="izquierdo">Izquierdo</option>
                      <option value="derecho">Derecho</option>
                      <option value="ambos">Ambos</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Resultado</label>
                    <input type="text" placeholder="Resultado" value={trat.resultado} onChange={e => actualizarTratamiento(idx, 'resultado', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" style={{ width: '100%', padding: '0.4rem' }} onClick={agregarTratamiento}>
              + Añadir Tratamiento
            </button>
          </>
        )}
      </div>

      {/* 10. Podograma (Colapsable) */}
      <div className="form-seccion">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 className="form-seccion-titulo" style={{ margin: 0 }}>🦶 10. Podograma</h4>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
            onClick={() => setMostrarPodograma(!mostrarPodograma)}
          >
            {mostrarPodograma ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {mostrarPodograma && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Podograma
              pie="izquierdo"
              datos={formData.podograma_izquierdo_datos}
              modo="editar"
              onZonaClick={(zona) => {
                const presion = prompt(`Presión para ${zona.nombre} (0-100):`, '50');
                if (presion !== null) {
                  handlePodogramaChange('izquierdo', zona.id, Number(presion));
                }
              }}
            />
            <Podograma
              pie="derecho"
              datos={formData.podograma_derecho_datos}
              modo="editar"
              onZonaClick={(zona) => {
                const presion = prompt(`Presión para ${zona.nombre} (0-100):`, '50');
                if (presion !== null) {
                  handlePodogramaChange('derecho', zona.id, Number(presion));
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Crear Consulta')}
        </button>
      </div>
    </form>
  );
}

export default FormHistoriaClinica;
