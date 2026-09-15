/**
 * Componente de búsqueda de pacientes con autocompletado.
 * Permite seleccionar pacientes existentes o crear uno nuevo si no existe.
 */
import { useState, useRef, useEffect } from 'react';

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

interface BuscadorPacientesProps {
  pacientes: PacienteOption[];
  value: number | '';
  onChange: (id: number) => void;
  onCrearNuevo?: (nombre: string) => void;
  placeholder?: string;
}

export default function BuscadorPacientes({ pacientes, value, onChange, onCrearNuevo, placeholder = 'Buscar paciente...' }: BuscadorPacientesProps) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  // Filtrar pacientes según búsqueda
  const pacientesFiltrados = pacientes.filter(p => {
    const texto = busqueda.toLowerCase();
    const nombreCompleto = `${p.nombre} ${p.apellidos}`.toLowerCase();
    return nombreCompleto.includes(texto);
  });

  // Actualizar paciente seleccionado cuando cambia el valor
  useEffect(() => {
    if (value) {
      const paciente = pacientes.find(p => p.id === value);
      setPacienteSeleccionado(paciente || null);
    } else {
      setPacienteSeleccionado(null);
    }
  }, [value, pacientes]);

  // Cerrar lista al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listaRef.current && !listaRef.current.contains(e.target as Node)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (paciente: PacienteOption) => {
    setPacienteSeleccionado(paciente);
    setBusqueda('');
    setMostrarLista(false);
    onChange(paciente.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setMostrarLista(true);
    // Si estaba seleccionado uno, lo deseleccionamos
    if (pacienteSeleccionado) {
      setPacienteSeleccionado(null);
      onChange('' as any);
    }
  };

  const handleFocus = () => {
    setMostrarLista(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMostrarLista(false);
    }
  };

  const handleCrearNuevo = () => {
    if (onCrearNuevo) {
      onCrearNuevo(busqueda);
      setBusqueda('');
      setMostrarLista(false);
    }
  };

  const textoBusqueda = busqueda.trim();
  const hayResultados = pacientesFiltrados.length > 0;
  const busquedaValida = textoBusqueda.length >= 2;

  return (
    <div ref={listaRef} style={{ position: 'relative' }}>
      {pacienteSeleccionado ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            border: '2px solid var(--primary-400)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-50)',
            cursor: 'pointer',
          }}
          onClick={() => {
            setPacienteSeleccionado(null);
            setBusqueda('');
            onChange('' as any);
            inputRef.current?.focus();
          }}
        >
          <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
            {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidos}
          </span>
          <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>✕ Cambiar</span>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            value={busqueda}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: mostrarLista ? '2px solid var(--primary-400)' : '2px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.925rem',
              transition: 'border-color 0.15s',
            }}
          />
          {mostrarLista && busquedaValida && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '250px',
                overflowY: 'auto',
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                marginTop: '4px',
              }}
            >
              {hayResultados ? (
                pacientesFiltrados.map(paciente => (
                  <div
                    key={paciente.id}
                    onClick={() => handleSelect(paciente)}
                    style={{
                      padding: '0.625rem 0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-100)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{paciente.nombre} {paciente.apellidos}</span>
                  </div>
                ))
              ) : null}
              
              {/* Botón para crear nuevo paciente */}
              {onCrearNuevo && !hayResultados && (
                <div
                  onClick={handleCrearNuevo}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    background: 'var(--primary-50)',
                    borderTop: '1px solid var(--gray-200)',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: 'var(--primary-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-100)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-50)'}
                >
                  <span style={{ fontSize: '1.1rem' }}>➕</span>
                  <span>Crear paciente "{textoBusqueda}"</span>
                </div>
              )}
              
              {/* Mensaje cuando no hay resultados y no se puede crear */}
              {!hayResultados && !onCrearNuevo && (
                <div style={{ padding: '0.75rem', color: 'var(--gray-500)', textAlign: 'center' }}>
                  No se encontraron pacientes
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
