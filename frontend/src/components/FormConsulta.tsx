import { useState } from 'react';

export interface ConsultaFormData {
  paciente_id: number | '';
  motivo_consulta: string;
  diagnostico: string;
}

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

interface FormConsultaProps {
  pacientes: PacienteOption[];
  onSubmit: (data: ConsultaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function FormConsulta({ pacientes, onSubmit, onCancel, loading }: FormConsultaProps) {
  const [formData, setFormData] = useState<ConsultaFormData>({
    paciente_id: '',
    motivo_consulta: '',
    diagnostico: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: keyof ConsultaFormData, value: string | number) => {
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
    if (!formData.motivo_consulta.trim()) {
      setError('El motivo de consulta es obligatorio');
      return;
    }

    try {
      await onSubmit({
        paciente_id: Number(formData.paciente_id),
        motivo_consulta: formData.motivo_consulta,
        diagnostico: formData.diagnostico,
      });
      setSuccess('Consulta creada correctamente');
      setTimeout(() => {
        onCancel();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la consulta';
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

      <div className="form-group">
        <label>Paciente *</label>
        <select
          value={formData.paciente_id}
          onChange={e => handleChange('paciente_id', e.target.value)}
          required
        >
          <option value="">Seleccionar paciente...</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Motivo de consulta *</label>
        <textarea
          rows={3}
          placeholder="Motivo de la consulta"
          value={formData.motivo_consulta}
          onChange={e => handleChange('motivo_consulta', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Diagnóstico</label>
        <textarea
          rows={3}
          placeholder="Diagnóstico"
          value={formData.diagnostico}
          onChange={e => handleChange('diagnostico', e.target.value)}
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear consulta'}
        </button>
      </div>
    </form>
  );
}

export default FormConsulta;
