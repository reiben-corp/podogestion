/**
 * Componente que muestra el nombre de la clínica con icono.
 * Se usa en Login y puede reutilizarse en otros lugares.
 */
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { configEvents } from '../utils/configEvents';

interface ConfiguracionPublica {
  [clave: string]: string;
}

interface HeaderClinicaProps {
  mostrarIcono?: boolean;
  tamaño?: 'normal' | 'grande';
}

export default function HeaderClinica({ mostrarIcono = true, tamaño = 'normal' }: HeaderClinicaProps) {
  const [config, setConfig] = useState<ConfiguracionPublica>({});

  const cargarConfig = async () => {
    try {
      const res = await apiClient.get('/configuracion/public');
      setConfig(res.data);
    } catch {
      // Silencioso - usar valores por defecto
    }
  };

  useEffect(() => {
    cargarConfig();
    // Suscribirse a cambios de configuración
    const unsubscribe = configEvents.subscribe(cargarConfig);
    return unsubscribe;
  }, []);

  const nombre = config.clinica_nombre || 'Clínica Podológica';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
      {mostrarIcono && (
        <div style={{
          width: tamaño === 'grande' ? '56px' : '44px',
          height: tamaño === 'grande' ? '56px' : '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: tamaño === 'grande' ? '1.75rem' : '1.25rem',
        }}>
          🏥
        </div>
      )}
      <span style={{
        fontSize: tamaño === 'grande' ? '1.75rem' : '1.25rem',
        fontWeight: 700,
        color: 'var(--primary-700)',
      }}>
        {nombre}
      </span>
    </div>
  );
}
