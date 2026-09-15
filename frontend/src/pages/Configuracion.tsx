/**
 * Página de Configuración del Sistema
 * Módulo de Administración
 */
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { configEvents } from '../utils/configEvents';

interface ConfigItem {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
}

export default function Configuracion() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEdit, setValorEdit] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      const { data } = await apiClient.get('/configuracion/');
      setConfigs(data);
    } catch (err: any) {
      console.error('Error cargando configuraciones:', err);
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.detail || 'Error al cargar las configuraciones'
      });
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (clave: string, valor: string) => {
    setEditando(clave);
    setValorEdit(valor || '');
    setMensaje(null);
  };

  const guardarCambios = async (clave: string) => {
    if (!valorEdit.trim()) {
      setMensaje({ tipo: 'error', texto: 'El valor no puede estar vacío' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      await apiClient.put(`/configuracion/${clave}`, { valor: valorEdit });
      // Actualizar el estado local
      setConfigs(prev =>
        prev.map(c => (c.clave === clave ? { ...c, valor: valorEdit } : c))
      );
      setEditando(null);
      setMensaje({ tipo: 'exito', texto: 'Configuración guardada correctamente' });
      // Notificar a los listeners (Dashboard, HeaderClinica)
      configEvents.notify();
    } catch (err: any) {
      console.error('Error guardando configuración:', err);
      const errorTexto = err.response?.data?.detail || 'Error al guardar la configuración';
      setMensaje({ tipo: 'error', texto: errorTexto });
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setValorEdit('');
  };

  const getConfig = (clave: string) => configs.find(c => c.clave === clave)?.valor || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main-content">
        <Header titulo="Configuración General" icono="⚙️">
          <button onClick={() => window.history.back()} className="btn btn-secondary btn-sm">
            ← Volver
          </button>
        </Header>

        {mensaje && (
          <div className="card" style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: mensaje.tipo === 'exito' ? '#d4edda' : '#f8d7da',
            borderLeft: `4px solid ${mensaje.tipo === 'exito' ? '#28a745' : '#dc3545'}`
          }}>
            {mensaje.texto}
            <button onClick={() => setMensaje(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {cargando ? (
          <p style={{ color: 'var(--gray-500)' }}>Cargando configuraciones...</p>
        ) : (
          <div className="card" style={{ maxWidth: '700px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎨 Personalización del Portal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Estos datos se muestran en el dashboard y la pantalla de inicio de sesión.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {/* Nombre */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Nombre de la clínica</label>
                  {editando === 'clinica_nombre' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        disabled={guardando}
                        autoFocus
                      />
                      <button
                        onClick={() => guardarCambios('clinica_nombre')}
                        className="btn btn-primary btn-sm"
                        disabled={guardando}
                      >
                        {guardando ? '...' : '✓'}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="btn btn-secondary btn-sm"
                        disabled={guardando}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {getConfig('clinica_nombre') || <span style={{ color: 'var(--gray-400)' }}>Sin definir</span>}
                    </p>
                  )}
                </div>
                {editando !== 'clinica_nombre' && (
                  <button
                    onClick={() => iniciarEdicion('clinica_nombre', getConfig('clinica_nombre'))}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {/* Dirección */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Dirección</label>
                  {editando === 'clinica_direccion' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        disabled={guardando}
                      />
                      <button
                        onClick={() => guardarCambios('clinica_direccion')}
                        className="btn btn-primary btn-sm"
                        disabled={guardando}
                      >
                        {guardando ? '...' : '✓'}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="btn btn-secondary btn-sm"
                        disabled={guardando}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {getConfig('clinica_direccion') || <span style={{ color: 'var(--gray-400)' }}>Sin definir</span>}
                    </p>
                  )}
                </div>
                {editando !== 'clinica_direccion' && (
                  <button
                    onClick={() => iniciarEdicion('clinica_direccion', getConfig('clinica_direccion'))}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {/* Teléfono */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Teléfono</label>
                  {editando === 'clinica_telefono' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        disabled={guardando}
                      />
                      <button
                        onClick={() => guardarCambios('clinica_telefono')}
                        className="btn btn-primary btn-sm"
                        disabled={guardando}
                      >
                        {guardando ? '...' : '✓'}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="btn btn-secondary btn-sm"
                        disabled={guardando}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {getConfig('clinica_telefono') || <span style={{ color: 'var(--gray-400)' }}>Sin definir</span>}
                    </p>
                  )}
                </div>
                {editando !== 'clinica_telefono' && (
                  <button
                    onClick={() => iniciarEdicion('clinica_telefono', getConfig('clinica_telefono'))}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {/* Email */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Email</label>
                  {editando === 'clinica_email' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input
                        type="text"
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        className="input"
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        disabled={guardando}
                      />
                      <button
                        onClick={() => guardarCambios('clinica_email')}
                        className="btn btn-primary btn-sm"
                        disabled={guardando}
                      >
                        {guardando ? '...' : '✓'}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="btn btn-secondary btn-sm"
                        disabled={guardando}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {getConfig('clinica_email') || <span style={{ color: 'var(--gray-400)' }}>Sin definir</span>}
                    </p>
                  )}
                </div>
                {editando !== 'clinica_email' && (
                  <button
                    onClick={() => iniciarEdicion('clinica_email', getConfig('clinica_email'))}
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {/* Ruta de documentos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-700)' }}>Ruta de documentos</label>
                  {editando === 'documentos_ruta' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <input 
                        type="text" 
                        value={valorEdit} 
                        onChange={(e) => setValorEdit(e.target.value)} 
                        className="input" 
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        placeholder="documentos_consentimiento"
                      />
                      <button onClick={() => guardarCambios('documentos_ruta')} className="btn btn-primary btn-sm">✓</button>
                      <button onClick={cancelarEdicion} className="btn btn-secondary btn-sm">✕</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontFamily: 'monospace', background: 'var(--gray-50)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      {getConfig('documentos_ruta') || <span style={{ color: 'var(--gray-400)' }}>Sin definir</span>}
                    </p>
                  )}
                  <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                    Los documentos de consentimiento se guardarán en: <strong>/backend/{getConfig('documentos_ruta') || '...'}</strong>
                  </p>
                </div>
                {editando !== 'documentos_ruta' && (
                  <button 
                    onClick={() => iniciarEdicion('documentos_ruta', getConfig('documentos_ruta'))} 
                    className="btn btn-secondary btn-sm"
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
