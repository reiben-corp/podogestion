/**
 * Formulario reutilizable para crear/editar pacientes.
 * Usado por: Dashboard (modal) y Pacientes (modal)
 */
import { useState } from 'react';

export interface PacienteFormData {
  nombre: string;
  apellidos: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: string;
  estado_civil: string;
  profesion: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  alergias: string;
  medicacion_actual: string;
  antecedentes: string;
  diabetes: boolean;
  diabetes_detalle: string;
  problemas_cardiovasculares: boolean;
  problemas_cardiovasculares_detalle: string;
  problemas_coagulacion: boolean;
  problemas_coagulacion_detalle: string;
  enfermedades_reumaticas: boolean;
  enfermedades_reumaticas_detalle: string;
  enfermedades_neurologicas: boolean;
  enfermedades_neurologicas_detalle: string;
  enfermedades_oseas: boolean;
  enfermedades_oseas_detalle: string;
  hepatitis_vih: boolean;
  hepatitis_vih_detalle: string;
  embarazada: boolean;
  embarazada_detalle: string;
  cirugias_previas: string;
  traumatismos_pies: boolean;
  traumatismos_pies_detalle: string;
  plantillas_previas: boolean;
  plantillas_previas_detalle: string;
  deporte: boolean;
  frecuencia_deporte: string;
  tipo_calzado: string;
  horas_pie_dia: number | null;
  fumador: boolean;
  consentimiento_datos: boolean;
  consentimiento_tratamiento: boolean;
  documento_consentimiento: string;
}

export const defaultPacienteForm: PacienteFormData = {
  nombre: '',
  apellidos: '',
  dni: '',
  fecha_nacimiento: '',
  sexo: '',
  estado_civil: '',
  profesion: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  codigo_postal: '',
  contacto_emergencia: '',
  telefono_emergencia: '',
  alergias: '',
  medicacion_actual: '',
  antecedentes: '',
  diabetes: false,
  diabetes_detalle: '',
  problemas_cardiovasculares: false,
  problemas_cardiovasculares_detalle: '',
  problemas_coagulacion: false,
  problemas_coagulacion_detalle: '',
  enfermedades_reumaticas: false,
  enfermedades_reumaticas_detalle: '',
  enfermedades_neurologicas: false,
  enfermedades_neurologicas_detalle: '',
  enfermedades_oseas: false,
  enfermedades_oseas_detalle: '',
  hepatitis_vih: false,
  hepatitis_vih_detalle: '',
  embarazada: false,
  embarazada_detalle: '',
  cirugias_previas: '',
  traumatismos_pies: false,
  traumatismos_pies_detalle: '',
  plantillas_previas: false,
  plantillas_previas_detalle: '',
  deporte: false,
  frecuencia_deporte: '',
  tipo_calzado: '',
  horas_pie_dia: null,
  fumador: false,
  consentimiento_datos: false,
  consentimiento_tratamiento: false,
  documento_consentimiento: '',
};

interface FormPacienteProps {
  initialData?: PacienteFormData;
  onSubmit: (data: PacienteFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  formRef?: React.Ref<HTMLFormElement>;
}

function FormPaciente({ initialData, onSubmit, onCancel, loading, formRef }: FormPacienteProps) {
  const [formData, setFormData] = useState<PacienteFormData>(initialData || defaultPacienteForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const esEdicion = !!initialData;

  const handleChange = (field: keyof PacienteFormData, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre.trim() || !formData.apellidos.trim()) {
      setError('Nombre y Apellidos son obligatorios');
      return;
    }

    try {
      // Limpiar datos: convertir strings vacíos a null antes de enviar
      const dataToSend: any = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value === '' || value === undefined) {
          dataToSend[key] = null;
        } else {
          dataToSend[key] = value;
        }
      }
      
      await onSubmit(dataToSend);
      setSuccess(esEdicion ? 'Paciente actualizado correctamente' : 'Paciente creado correctamente');
      // Solo auto-cerrar si es creación (no edición)
      if (!esEdicion) {
        setTimeout(() => {
          onCancel();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (esEdicion ? 'Error al actualizar el paciente' : 'Error al crear el paciente');
      setError(msg);
    }
  };

  return (
    <form ref={formRef} id="form-edit-paciente" onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
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

      {/* Sección 1: Datos Personales */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📋 Datos Personales</h4>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Nombre *</label>
            <input type="text" value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Apellidos *</label>
            <input type="text" value={formData.apellidos} onChange={e => handleChange('apellidos', e.target.value)} required />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="form-group">
            <label>DNI *</label>
            <input type="text" value={formData.dni} onChange={e => handleChange('dni', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Fecha de nacimiento</label>
            <input type="date" value={formData.fecha_nacimiento} onChange={e => handleChange('fecha_nacimiento', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Edad</label>
            <input type="text" value={calcularEdad(formData.fecha_nacimiento)} readOnly style={{ background: 'var(--gray-50)' }} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="form-group">
            <label>Sexo</label>
            <select value={formData.sexo} onChange={e => handleChange('sexo', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="masculino">Hombre</option>
              <option value="femenino">Mujer</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado civil</label>
            <select value={formData.estado_civil} onChange={e => handleChange('estado_civil', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
              <option value="pareja_hecho">Pareja de hecho</option>
            </select>
          </div>
          <div className="form-group">
            <label>Profesión</label>
            <input type="text" value={formData.profesion} onChange={e => handleChange('profesion', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="form-group">
            <label>Ciudad / Localidad</label>
            <input type="text" value={formData.ciudad} onChange={e => handleChange('ciudad', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Código Postal</label>
            <input type="text" value={formData.codigo_postal} onChange={e => handleChange('codigo_postal', e.target.value)} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} />
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Contacto Emergencia</label>
            <input type="text" value={formData.contacto_emergencia} onChange={e => handleChange('contacto_emergencia', e.target.value)} placeholder="Nombre y parentesco" />
          </div>
          <div className="form-group">
            <label>Teléfono Emergencia</label>
            <input type="tel" value={formData.telefono_emergencia} onChange={e => handleChange('telefono_emergencia', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sección 2: Antecedentes de Salud */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">🏥 Antecedentes de Salud</h4>
        
        <div className="antecedentes-grid">
          <AntecedenteItem
            label="Diabetes"
            checked={formData.diabetes}
            detalle={formData.diabetes_detalle}
            onCheck={(v) => handleChange('diabetes', v)}
            onDetalle={(v) => handleChange('diabetes_detalle', v)}
            placeholder="Tipo y tratamiento"
          />
          <AntecedenteItem
            label="Problemas Cardiovasculares"
            checked={formData.problemas_cardiovasculares}
            detalle={formData.problemas_cardiovasculares_detalle}
            onCheck={(v) => handleChange('problemas_cardiovasculares', v)}
            onDetalle={(v) => handleChange('problemas_cardiovasculares_detalle', v)}
            placeholder="Especificar condición"
          />
          <AntecedenteItem
            label="Problemas de Coagulación"
            checked={formData.problemas_coagulacion}
            detalle={formData.problemas_coagulacion_detalle}
            onCheck={(v) => handleChange('problemas_coagulacion', v)}
            onDetalle={(v) => handleChange('problemas_coagulacion_detalle', v)}
            placeholder="Especificar medicación"
          />
          <AntecedenteItem
            label="Enfermedades Reumáticas"
            checked={formData.enfermedades_reumaticas}
            detalle={formData.enfermedades_reumaticas_detalle}
            onCheck={(v) => handleChange('enfermedades_reumaticas', v)}
            onDetalle={(v) => handleChange('enfermedades_reumaticas_detalle', v)}
            placeholder="Tipo y localización"
          />
          <AntecedenteItem
            label="Enfermedades Neurológicas"
            checked={formData.enfermedades_neurologicas}
            detalle={formData.enfermedades_neurologicas_detalle}
            onCheck={(v) => handleChange('enfermedades_neurologicas', v)}
            onDetalle={(v) => handleChange('enfermedades_neurologicas_detalle', v)}
            placeholder="Especificar condición"
          />
          <AntecedenteItem
            label="Enfermedades Óseas/Articulares"
            checked={formData.enfermedades_oseas}
            detalle={formData.enfermedades_oseas_detalle}
            onCheck={(v) => handleChange('enfermedades_oseas', v)}
            onDetalle={(v) => handleChange('enfermedades_oseas_detalle', v)}
            placeholder="Especificar"
          />
          <AntecedenteItem
            label="Hepatitis / VIH"
            checked={formData.hepatitis_vih}
            detalle={formData.hepatitis_vih_detalle}
            onCheck={(v) => handleChange('hepatitis_vih', v)}
            onDetalle={(v) => handleChange('hepatitis_vih_detalle', v)}
            placeholder="Especificar tipo"
          />
          <AntecedenteItem
            label="Embarazada"
            checked={formData.embarazada}
            detalle={formData.embarazada_detalle}
            onCheck={(v) => handleChange('embarazada', v)}
            onDetalle={(v) => handleChange('embarazada_detalle', v)}
            placeholder="Semanas de gestación"
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Alergias (látex, metales, medicamentos...)</label>
            <textarea value={formData.alergias} onChange={e => handleChange('alergias', e.target.value)} rows={2} />
          </div>
          <div className="form-group">
            <label>Medicación Actual</label>
            <textarea value={formData.medicacion_actual} onChange={e => handleChange('medicacion_actual', e.target.value)} rows={2} />
          </div>
        </div>

        <div className="form-group">
          <label>Antecedentes Médicos</label>
          <textarea value={formData.antecedentes} onChange={e => handleChange('antecedentes', e.target.value)} rows={2} />
        </div>
      </div>

      {/* Sección 3: Antecedentes Podológicos */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">🦶 Antecedentes Podológicos</h4>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Cirugías Previas</label>
            <input type="text" value={formData.cirugias_previas} onChange={e => handleChange('cirugias_previas', e.target.value)} placeholder="Especificar cuándo y qué" />
          </div>
          <div className="form-group">
            <label>Tipo de Calzado Frecuente</label>
            <select value={formData.tipo_calzado} onChange={e => handleChange('tipo_calzado', e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="deportivo">Deportivo</option>
              <option value="vestir">Vestir</option>
              <option value="bota">Bota</option>
              <option value="tacon">Tacón</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="antecedentes-grid">
          <AntecedenteItem
            label="¿Ha llevado plantillas?"
            checked={formData.plantillas_previas}
            detalle={formData.plantillas_previas_detalle}
            onCheck={(v) => handleChange('plantillas_previas', v)}
            onDetalle={(v) => handleChange('plantillas_previas_detalle', v)}
            placeholder="¿Desde cuándo? Tipo"
          />
          <AntecedenteItem
            label="Traumatismos en pies/tobillos"
            checked={formData.traumatismos_pies}
            detalle={formData.traumatismos_pies_detalle}
            onCheck={(v) => handleChange('traumatismos_pies', v)}
            onDetalle={(v) => handleChange('traumatismos_pies_detalle', v)}
            placeholder="¿Cuáles? Fecha"
          />
        </div>
      </div>

      {/* Sección 4: Estilo de Vida */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">🏃 Estilo de Vida</h4>

        <div className="antecedentes-grid">
          <AntecedenteItem
            label="¿Practica deporte?"
            checked={formData.deporte}
            detalle={formData.frecuencia_deporte}
            onCheck={(v) => handleChange('deporte', v)}
            onDetalle={(v) => handleChange('frecuencia_deporte', v)}
            placeholder="¿Cuál y frecuencia?"
          />
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="form-group">
            <label>Horas de pie al día</label>
            <input type="number" value={formData.horas_pie_dia ?? ''} onChange={e => handleChange('horas_pie_dia', e.target.value ? Number(e.target.value) : null) } />
          </div>
          <div className="form-group">
            <label>¿Fumador/a?</label>
            <div className="checkbox-inline">
              <label className="checkbox-label">
                <input type="checkbox" checked={formData.fumador} onChange={e => handleChange('fumador', e.target.checked)} />
                <span>Sí</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 5: Consentimientos */}
      <div className="form-seccion">
        <h4 className="form-seccion-titulo">📜 Consentimiento y Protección de Datos (RGPD)</h4>

        <div className="rgpd-info">
          <p><strong>Responsable:</strong> La clínica, con NIF/CIF y dirección registrada.</p>
          <p><strong>Finalidad:</strong> Gestionar su historia clínica para la correcta prestación de servicios de diagnóstico y tratamiento podológico.</p>
          <p><strong>Derechos:</strong> Acceder, rectificar, suprimir, limitar el tratamiento y portabilidad.</p>
        </div>

        <div className="consentimientos">
          <label className="checkbox-label">
            <input type="checkbox" checked={formData.consentimiento_datos} onChange={e => handleChange('consentimiento_datos', e.target.checked)} />
            <span>Consentimiento tratamiento datos (RGPD)</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={formData.consentimiento_tratamiento} onChange={e => handleChange('consentimiento_tratamiento', e.target.checked)} />
            <span>Consentimiento tratamiento podológico</span>
          </label>
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Crear paciente')}
        </button>
      </div>
    </form>
  );
}

// Componente para antecedentes con checkbox + detalle
function AntecedenteItem({ label, checked, detalle, onCheck, onDetalle, placeholder }: {
  label: string;
  checked: boolean;
  detalle: string;
  onCheck: (v: boolean) => void;
  onDetalle: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="antecedente-item">
      <label className="checkbox-label">
        <input type="checkbox" checked={checked} onChange={e => onCheck(e.target.checked)} />
        <span>{label}</span>
      </label>
      {checked && (
        <input
          type="text"
          value={detalle}
          onChange={e => onDetalle(e.target.value)}
          placeholder={placeholder}
          className="antecedente-detalle"
        />
      )}
    </div>
  );
}

function calcularEdad(fecha: string): string {
  if (!fecha) return '';
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad.toString();
}

export default FormPaciente;
