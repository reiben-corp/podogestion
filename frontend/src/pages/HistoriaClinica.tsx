import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatearFecha } from '../utils/fecha';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useScrollLock } from '../hooks/useScrollLock';
import Podograma from '../components/Podograma';
import FormHistoriaClinica from '../components/FormHistoriaClinica';

interface Historia {
  id: number;
  numero_historia: string;
  paciente_id: number;
  paciente_nombre?: string;
  profesional_id: number;
  profesional_nombre?: string;
  fecha_consulta: string;
  motivo_consulta?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  exploracion_fisica?: string;
  diagnostico?: string;
  codigo_diagnostico?: string;
  plan_tratamiento?: string;
  evolucion?: string;
  observaciones?: string;
  exploraciones: any[];
  tratamientos: any[];
  podogramas: any[];
}

function HistoriaClinica() {
  const [searchParams] = useSearchParams();
  const pacienteParam = searchParams.get('paciente');

  const [historias, setHistorias] = useState<Historia[]>([]);
  const [historiasRecientes, setHistoriasRecientes] = useState<Historia[]>([]);
  const [historiaActual, setHistoriaActual] = useState<Historia | null>(null);
  const [mostrarDetalleModal, setMostrarDetalleModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mostrarModalFormulario, setMostrarModalFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [buscando, setBuscando] = useState(false);
  const { user: _user } = useAuth();

  useScrollLock(mostrarModalFormulario || mostrarDetalleModal);

  const cargarPacientes = async () => {
    try {
      const response = await apiClient.get('/pacientes?por_pagina=200');
      setPacientes(response.data.pacientes);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  const cargarHistoriasRecientes = async () => {
    try {
      const response = await apiClient.get('/historias?por_pagina=10');
      setHistoriasRecientes(response.data.historias);
    } catch (error) {
      console.error('Error cargando historias recientes:', error);
    }
  };

  useEffect(() => {
    cargarPacientes();
    cargarHistoriasRecientes();
  }, []);

  // Si viene paciente por URL, buscar automáticamente
  useEffect(() => {
    if (pacienteParam && pacientes.length > 0) {
      const paciente = pacientes.find(p => p.id === Number(pacienteParam));
      if (paciente) {
        const nombreCompleto = `${paciente.nombre} ${paciente.apellidos}`;
        setBusqueda(nombreCompleto);
        setBuscando(true);
        apiClient.get('/historias', {
          params: { busqueda: nombreCompleto, por_pagina: 200 }
        }).then(response => {
          setHistorias(response.data.historias);
        });
      }
    }
  }, [pacienteParam, pacientes]);

  const handleBusqueda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) {
      setHistorias([]);
      setBuscando(false);
      return;
    }
    try {
      setCargando(true);
      setBuscando(true);
      const response = await apiClient.get('/historias', {
        params: { busqueda: busqueda.trim(), por_pagina: 200 }
      });
      setHistorias(response.data.historias);
    } catch (error) {
      console.error('Error buscando historias:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (modoEdicion && historiaActual) {
      await apiClient.put(`/historias/${historiaActual.id}`, data);
      setMensaje('Consulta actualizada correctamente');
    } else {
      await apiClient.post('/historias', { ...data, profesional_id: 2 });
      // ^ profesional_id=2 → admin (seeder crea admin con ID=2)
      setMensaje('Consulta creada correctamente');
    }
    cargarHistoriasRecientes();
    if (buscando) {
      const response = await apiClient.get('/historias', {
        params: { busqueda: busqueda.trim(), por_pagina: 200 }
      });
      setHistorias(response.data.historias);
    }
    setMostrarModalFormulario(false);
    setModoEdicion(false);
    setHistoriaActual(null);
    setTimeout(() => setMensaje(''), 3000);
  };

  const handleEliminar = async (historia: Historia) => {
    if (!confirm('¿Está seguro de que desea eliminar esta consulta?')) return;
    try {
      await apiClient.delete(`/historias/${historia.id}`);
      if (buscando) {
        const response = await apiClient.get('/historias', {
          params: { busqueda: busqueda.trim(), por_pagina: 200 }
        });
        setHistorias(response.data.historias);
      }
      cargarHistoriasRecientes();
      if (historiaActual?.id === historia.id) {
        setHistoriaActual(null);
      }
      setMensaje('Consulta eliminada correctamente');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error eliminando historia:', error);
      alert('Error al eliminar la consulta');
    }
  };

  const historiaToFormData = (h: Historia) => ({
    paciente_id: h.paciente_id,
    motivo_consulta: h.motivo_consulta || '',
    antecedentes_personales: h.antecedentes_personales || '',
    antecedentes_familiares: h.antecedentes_familiares || '',
    exploracion_fisica: h.exploracion_fisica || '',
    diagnostico: h.diagnostico || '',
    codigo_diagnostico: h.codigo_diagnostico || '',
    plan_tratamiento: h.plan_tratamiento || '',
    evolucion: h.evolucion || '',
    observaciones: h.observaciones || '',
    exploraciones: h.exploraciones || [],
    tratamientos: h.tratamientos || [],
    podograma_izquierdo_datos: h.podogramas?.find(p => p.pie === 'izquierdo')?.datos || {},
    podograma_derecho_datos: h.podogramas?.find(p => p.pie === 'derecho')?.datos || {},
  });

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header titulo="Historia Clínica" icono="📋">
          <button onClick={() => setMostrarModalFormulario(true)} className="btn btn-primary">
            + Nueva Historia Clínica
          </button>
        </Header>

        {mensaje && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
            {mensaje}
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={handleBusqueda} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Buscar paciente por nombre o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <button type="submit" className="btn btn-primary">🔍 Buscar</button>
            {buscando && (
              <button type="button" className="btn btn-secondary"
                onClick={() => { setBusqueda(''); setHistorias([]); setBuscando(false); setHistoriaActual(null); }}>
                ✕ Limpiar
              </button>
            )}
          </form>
        </div>

        {buscando ? (
          <>
            {cargando ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#666' }}>Buscando...</p>
              </div>
            ) : historias.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#666' }}>No se encontraron resultados para "{busqueda}"</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nº Historia</th>
                      <th>Fecha</th>
                      <th>Paciente</th>
                      <th>Motivo</th>
                      <th>Información</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historias.map((historia) => (
                      <tr key={historia.id}
                        style={{ cursor: 'pointer', background: historiaActual?.id === historia.id ? '#e8f4f8' : undefined }}
                        onClick={() => setHistoriaActual(historia)}>
                        <td><strong style={{ fontFamily: 'monospace' }}>{historia.numero_historia}</strong></td>
                        <td>{formatearFecha(historia.fecha_consulta)}</td>
                        <td>{historia.paciente_nombre || 'N/A'}</td>
                        <td>{historia.motivo_consulta || '-'}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setHistoriaActual(historia); setMostrarDetalleModal(true); }}
                            className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                            Abrir
                          </button>
                          <button onClick={() => { setHistoriaActual(historia); setModoEdicion(true); setMostrarModalFormulario(true); }}
                            className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                            ✏️
                          </button>
                          <button onClick={() => handleEliminar(historia)}
                            className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      {/* Modal: Detalle de Historia Clínica */}
      {mostrarDetalleModal && historiaActual && (
        <div className="modal-overlay" onClick={() => setMostrarDetalleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="ficha-modal-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', width: '100%' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                    Consulta {historiaActual.numero_historia}
                  </h2>
                  <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    {formatearFecha(historiaActual.fecha_consulta)} — {historiaActual.paciente_nombre}
                  </p>
                </div>
                <button onClick={() => setMostrarDetalleModal(false)}
                  className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  ✕ Cerrar
                </button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
                <button onClick={() => { setMostrarDetalleModal(false); setModoEdicion(true); setMostrarModalFormulario(true); }}
                  className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                  ✏️ Editar
                </button>
                <button onClick={() => { setMostrarDetalleModal(false); handleEliminar(historiaActual); }}
                  className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                  🗑️
                </button>
              </div>

              <DetalleSeccion titulo="1. Motivo de Consulta" valor={historiaActual.motivo_consulta} />
              <DetalleSeccion titulo="2. Antecedentes Personales" valor={historiaActual.antecedentes_personales} />
              <DetalleSeccion titulo="Antecedentes Familiares" valor={historiaActual.antecedentes_familiares} />
              <DetalleSeccion titulo="3. Exploración Física" valor={historiaActual.exploracion_fisica} />

              {historiaActual.diagnostico && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#555', fontSize: '0.9rem' }}>4. Diagnóstico</h4>
                  <p>{historiaActual.diagnostico}</p>
                  {historiaActual.codigo_diagnostico && (
                    <span className="badge badge-info">CIAP-2: {historiaActual.codigo_diagnostico}</span>
                  )}
                </div>
              )}

              <DetalleSeccion titulo="5. Plan de Tratamiento" valor={historiaActual.plan_tratamiento} />
              <DetalleSeccion titulo="6. Evolución" valor={historiaActual.evolucion} />
              <DetalleSeccion titulo="7. Observaciones" valor={historiaActual.observaciones} />

              {historiaActual.exploraciones?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#555', fontSize: '0.9rem' }}>8. Exploraciones Biomecánicas</h4>
                  {historiaActual.exploraciones.map((exp: any) => (
                    <div key={exp.id} style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{exp.tipo}</span>
                      {exp.resultado && <p style={{ marginTop: '0.3rem' }}>{exp.resultado}</p>}
                      {exp.observaciones && <small style={{ color: '#888' }}>{exp.observaciones}</small>}
                    </div>
                  ))}
                </div>
              )}

              {historiaActual.tratamientos?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#555', fontSize: '0.9rem' }}>9. Tratamientos</h4>
                  {historiaActual.tratamientos.map((trat: any) => (
                    <div key={trat.id} style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}>
                      <span className="badge badge-success">{trat.tipo}</span>
                      <p style={{ marginTop: '0.3rem' }}>{trat.descripcion}</p>
                      {trat.zona && <small style={{ color: '#888' }}>Zona: {trat.zona}</small>}
                      {trat.pie && <small style={{ color: '#888', marginLeft: '0.5rem' }}>({trat.pie})</small>}
                    </div>
                  ))}
                </div>
              )}

              {historiaActual.podogramas?.length > 0 && (
                <div style={{ margin: '1rem 0' }}>
                  <h4 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>🦶 Podograma</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {historiaActual.podogramas.map((pod: any) => (
                      <Podograma key={pod.id} pie={pod.pie} datos={pod.datos} modo="ver" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
          </>
        ) : (
          <div>
            <h3 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>📋 Últimas Consultas</h3>
            {historiasRecientes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#666' }}>No hay historias clínicas registradas</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nº Historia</th>
                      <th>Paciente</th>
                      <th>Motivo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiasRecientes.map((historia) => (
                      <tr key={historia.id}>
                        <td>{formatearFecha(historia.fecha_consulta)}</td>
                        <td><strong style={{ fontFamily: 'monospace' }}>{historia.numero_historia}</strong></td>
                        <td>{historia.paciente_nombre || 'N/A'}</td>
                        <td>{historia.motivo_consulta || '-'}</td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }}
                            onClick={() => {
                              // Cargar historia completa y abrir modal
                              apiClient.get(`/historias/${historia.id}`)
                                .then(response => {
                                  setHistoriaActual(response.data);
                                  setMostrarDetalleModal(true);
                                });
                            }}>
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Formulario de Historia Clínica */}
      {mostrarModalFormulario && (
        <div className="modal-overlay" onClick={() => setMostrarModalFormulario(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: 0 }}>
            <div className="ficha-modal-header" style={{ borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>{modoEdicion ? '✏️ Editar Consulta' : '📋 Nueva Historia Clínica'}</h2>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <FormHistoriaClinica
                pacientes={pacientes}
                initialData={modoEdicion && historiaActual ? historiaToFormData(historiaActual) : undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setMostrarModalFormulario(false);
                  setModoEdicion(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleSeccion({ titulo, valor }: { titulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h4 style={{ color: '#555', fontSize: '0.9rem' }}>{titulo}</h4>
      <p>{valor}</p>
    </div>
  );
}

export default HistoriaClinica;
