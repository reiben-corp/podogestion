import { useState } from 'react';

export interface FacturaFormData {
  tipo: 'factura' | 'presupuesto';
  paciente_id: number | '';
  lineas: Array<{
    concepto: string;
    cantidad: number;
    precio_unitario: number;
  }>;
}

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

interface FormFacturaProps {
  pacientes: PacienteOption[];
  onSubmit: (data: FacturaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function FormFactura({ pacientes, onSubmit, onCancel, loading }: FormFacturaProps) {
  const [formData, setFormData] = useState<FacturaFormData>({
    tipo: 'factura',
    paciente_id: '',
    lineas: [{ concepto: '', cantidad: 1, precio_unitario: 0 }],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLineaChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.map((l, i) => i === index ? { ...l, [field]: value } : l),
    }));
  };

  const agregarLinea = () => {
    setFormData(prev => ({
      ...prev,
      lineas: [...prev.lineas, { concepto: '', cantidad: 1, precio_unitario: 0 }],
    }));
  };

  const eliminarLinea = (index: number) => {
    if (formData.lineas.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index),
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

    const lineasValidas = formData.lineas.filter(l => l.concepto.trim() !== '');
    if (lineasValidas.length === 0) {
      setError('Debe añadir al menos una línea con concepto');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        paciente_id: Number(formData.paciente_id),
        lineas: lineasValidas.map(l => ({
          ...l,
          descuento: 0,
          iva_porcentaje: 21,
        })),
      });
      setSuccess('Documento creado correctamente');
      setTimeout(() => {
        onCancel();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el documento';
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Tipo *</label>
          <select
            value={formData.tipo}
            onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value as 'factura' | 'presupuesto' }))}
          >
            <option value="factura">Factura</option>
            <option value="presupuesto">Presupuesto</option>
          </select>
        </div>
        <div className="form-group">
          <label>Paciente *</label>
          <select
            value={formData.paciente_id}
            onChange={e => setFormData(prev => ({ ...prev, paciente_id: Number(e.target.value) }))}
            required
          >
            <option value="">Seleccionar paciente...</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ margin: '1rem 0' }}>
        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Líneas del documento</label>
        {formData.lineas.map((linea, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end', marginTop: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Concepto</label>
              <input
                type="text"
                placeholder="Concepto"
                value={linea.concepto}
                onChange={e => handleLineaChange(idx, 'concepto', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Cantidad</label>
              <input
                type="number"
                min={1}
                value={linea.cantidad}
                onChange={e => handleLineaChange(idx, 'cantidad', Number(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Precio</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={linea.precio_unitario}
                onChange={e => handleLineaChange(idx, 'precio_unitario', Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={() => eliminarLinea(idx)}
              className="btn btn-danger btn-sm"
              disabled={formData.lineas.length === 1}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={agregarLinea} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
          + Añadir línea
        </button>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : `Crear ${formData.tipo}`}
        </button>
      </div>
    </form>
  );
}

export default FormFactura;
