/**
 * Formulario reutilizable para crear/editar citas.
 * Usado por: Dashboard (modal), Citas (modal), y otros lugares.
 * 
 * Campos: paciente, fecha, hora inicio, hora fin, motivo, notas
 */
import { useState } from 'react';
import BuscadorPacientes from './BuscadorPacientes';

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

export interface CitaFormData {
  paciente_id: number | '';
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string;
  notas: string;
}

export const defaultCitaForm: CitaFormData = {
  paciente_id: '',
  fecha: '',
  hora_inicio: '',
  hora_fin: '',
  motivo: '',
  notas: '',
};

interface FormCitaProps {
  initialData?: CitaFormData;
  pacientes: PacienteOption[];
  onSubmit: (data: CitaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  onCrearNuevoPaciente?: (nombre: string) => void;
}

function FormCita({ initialData, pacientes, onSubmit, onCancel, loading, onCrearNuevoPaciente }: FormCitaProps) {
  const [formData, setFormData] = useState<CitaFormData>(initialData || defaultCitaForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: keyof CitaFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.paciente_id) {
      setError('Debe seleccionar un paciente');
      return;
    }
    if (!formData.fecha) {
      setError('La fecha es obligatoria');
      return;
    }
    if (!formData.hora_inicio) {
      setError('La hora de inicio es obligatoria');
      return;
    }
    if (!formData.hora_fin) {
      setError('La hora fin es obligatoria');
      return;
    }

    try {
      await onSubmit(formData);
      setSuccess('Cita guardada correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la cita';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label>Paciente *</label>
          <BuscadorPacientes
            pacientes={pacientes}
            value={formData.paciente_id}
            onChange={(id) => handleChange('paciente_id', id)}
            onCrearNuevo={onCrearNuevoPaciente}
          />
        </div>
        <div className="form-group">
          <label>Fecha *</label>
          <input
            type="date"
            value={formData.fecha}
            onChange={e => handleChange('fecha', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="form-group">
          <label>Hora inicio *</label>
          <input
            type="time"
            value={formData.hora_inicio}
            onChange={e => handleChange('hora_inicio', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Hora fin *</label>
          <input
            type="time"
            value={formData.hora_fin}
            onChange={e => handleChange('hora_fin', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Motivo</label>
        <input
          type="text"
          value={formData.motivo}
          onChange={e => handleChange('motivo', e.target.value)}
          placeholder="Ej: Revisión podológica"
        />
      </div>

      <div className="form-group">
        <label>Notas</label>
        <textarea
          value={formData.notas}
          onChange={e => handleChange('notas', e.target.value)}
          rows={2}
          placeholder="Observaciones adicionales..."
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Crear cita'}
        </button>
      </div>
    </form>
  );
}

export default FormCita;
