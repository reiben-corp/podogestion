import { useState, useEffect } from 'react';
import { formatearFecha } from '../utils/fecha';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import Podograma from '../components/Podograma';
import FormConsulta from '../components/FormConsulta';

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
  const [historias, setHistorias] = useState<Historia[]>([]);
  const [historiasRecientes, setHistoriasRecientes] = useState<Historia[]>([]);
  const [historiaActual, setHistoriaActual] = useState<Historia | null>(null);
  const [pacienteId, setPacienteId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [, setDatosPodograma] = useState<any>({});

  const { user: _user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pacienteParam = params.get('paciente');
    if (pacienteParam) {
      setPacienteId(pacienteParam);
    }
  }, []);

  const cargarPacientes = async () => {
    try {
      const response = await apiClient.get('/pacientes?por_pagina=100');
      setPacientes(response.data.pacientes);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  const cargarHistorias = async (pid: string) => {
    if (!pid) return;
    try {
      setCargando(true);
      const response = await apiClient.get(`/historias/paciente/${pid}`);
      setHistorias(response.data);
    } catch (error) {
      console.error('Error cargando historias:', error);
    } finally {
      setCargando(false);
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

  useEffect(() => {
    if (pacienteId) {
      cargarHistorias(pacienteId);
    }
  }, [pacienteId]);

  const handlePacienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setPacienteId(pid);
    setHistoriaActual(null);
    setMostrarFormulario(false);
  };

  const verHistoria = (historia: Historia) => {
    setHistoriaActual(historia);
    setMostrarFormulario(false);
  };

  const editarHistoria = (historia: Historia) => {
    setHistoriaActual(historia);
    setModoEdicion(true);
    setMostrarFormulario(true);
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Historia Clínica" icono="📋" />

        {/* Selector de paciente */}
        <div className="card">
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e3a5f' }}>
            Seleccionar Paciente:
          </label>
          <select
            value={pacienteId}
            onChange={handlePacienteChange}
            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
          >
            <option value="">-- Ver todas las historias recientes --</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellidos} ({p.numero_historia})
              </option>
            ))}
          </select>
        </div>

        {pacienteId ? (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <button 
                onClick={() => {
                  setMostrarFormulario(true);
                  setModoEdicion(false);
                  setHistoriaActual(null);
                  setDatosPodograma({});
                }}
                className="btn btn-primary"
              >
                + Nueva Consulta
              </button>
            </div>

            {cargando ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#666' }}>Cargando historias clínicas...</p>
              </div>
            ) : historias.length === 0 && !mostrarFormulario ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#666' }}>No hay historias clínicas para este paciente</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>Consultas Anteriores</h3>
                  {historias.map((historia) => (
                    <div 
                      key={historia.id} 
                      className="card"
                      style={{ 
                        cursor: 'pointer',
                        border: historiaActual?.id === historia.id ? '2px solid #1e3a5f' : '1px solid #e0e0e0'
                      }}
                      onClick={() => verHistoria(historia)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: '#1e3a5f' }}>
                            {formatearFecha(historia.fecha_consulta)}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#888' }}>{historia.numero_historia}</p>
                          <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            {historia.motivo_consulta || 'Sin motivo especificado'}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); editarHistoria(historia); }}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  {mostrarFormulario ? (
                    <div className="card">
                      <h3 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>
                        {modoEdicion ? 'Editar Consulta' : 'Nueva Consulta'}
                      </h3>
                      <FormConsulta
                        pacientes={pacientes}
                        onSubmit={async (data) => {
                          await apiClient.post('/historias', { ...data, profesional_id: 1 });
                          cargarHistorias(pacienteId);
                          cargarHistoriasRecientes();
                          setMostrarFormulario(false);
                          setModoEdicion(false);
                          setHistoriaActual(null);
                        }}
                        onCancel={() => setMostrarFormulario(false)}
                      />
                    </div>
                  ) : historiaActual ? (
                    <div className="card">
                      <h3 style={{ color: '#1e3a5f', marginBottom: '0.5rem' }}>
                        Consulta del {formatearFecha(historiaActual.fecha_consulta)}
                      </h3>
                      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>{historiaActual.numero_historia}</p>

                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ color: '#555', fontSize: '0.9rem' }}>1. Motivo de Consulta</h4>
                        <p>{historiaActual.motivo_consulta || '-'}</p>
                      </div>

                      {historiaActual.antecedentes_personales && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>2. Antecedentes Personales</h4>
                          <p>{historiaActual.antecedentes_personales}</p>
                        </div>
                      )}

                      {historiaActual.exploracion_fisica && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>3. Exploración Física</h4>
                          <p>{historiaActual.exploracion_fisica}</p>
                        </div>
                      )}

                      {historiaActual.diagnostico && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>4. Diagnóstico</h4>
                          <p>{historiaActual.diagnostico}</p>
                          {historiaActual.codigo_diagnostico && <span className="badge badge-info">CIAP-2: {historiaActual.codigo_diagnostico}</span>}
                        </div>
                      )}

                      {historiaActual.podogramas && historiaActual.podogramas.length > 0 && (
                        <div style={{ margin: '1rem 0' }}>
                          <h4 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>🦶 Podograma</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {historiaActual.podogramas.map((pod: any) => (
                              <Podograma key={pod.id} pie={pod.pie} datos={pod.datos} modo="ver" />
                            ))}
                          </div>
                        </div>
                      )}

                      {historiaActual.plan_tratamiento && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>5. Plan de Tratamiento</h4>
                          <p>{historiaActual.plan_tratamiento}</p>
                        </div>
                      )}

                      {historiaActual.evolucion && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>6. Evolución</h4>
                          <p>{historiaActual.evolucion}</p>
                        </div>
                      )}

                      {historiaActual.tratamientos && historiaActual.tratamientos.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h4 style={{ color: '#555', fontSize: '0.9rem' }}>Tratamientos</h4>
                          {historiaActual.tratamientos.map((trat: any) => (
                            <div key={trat.id} style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}>
                              <span className="badge badge-success">{trat.tipo}</span>
                              <p style={{ marginTop: '0.5rem' }}>{trat.descripcion}</p>
                              {trat.zona && <small style={{ color: '#888' }}>Zona: {trat.zona}</small>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: '#666' }}>Selecciona una consulta para ver el detalle</p>
                    </div>
                  )}
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
                      <th>Diagnóstico</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiasRecientes.map((historia) => (
                      <tr key={historia.id}>
                        <td>{formatearFecha(historia.fecha_consulta)}</td>
                        <td>{historia.numero_historia}</td>
                        <td>{historia.paciente_nombre || 'N/A'}</td>
                        <td>{historia.motivo_consulta || '-'}</td>
                        <td>{historia.diagnostico || '-'}</td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => { setPacienteId(historia.paciente_id.toString()); verHistoria(historia); }}>Ver</button>
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
    </div>
  );
}

export default HistoriaClinica;
