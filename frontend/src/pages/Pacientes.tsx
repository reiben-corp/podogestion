import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient, { documentosApi } from '../api/client';
import Sidebar from '../components/Sidebar';
import FormPaciente from '../components/FormPaciente';
import Header from '../components/Header';

import { formatearFecha } from '../utils/fecha';

interface Paciente {
  id: number;
  codigo_paciente: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  edad: number;
  dni: string;
  fecha_nacimiento?: string;
  sexo?: string;
  estado_civil?: string;
  profesion?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  contacto_emergencia?: string;
  telefono_emergencia?: string;
  alergias?: string;
  medicacion_actual?: string;
  antecedentes?: string;
  diabetes?: boolean;
  diabetes_detalle?: string;
  problemas_cardiovasculares?: boolean;
  problemas_cardiovasculares_detalle?: string;
  problemas_coagulacion?: boolean;
  problemas_coagulacion_detalle?: string;
  enfermedades_reumaticas?: boolean;
  enfermedades_reumaticas_detalle?: string;
  enfermedades_neurologicas?: boolean;
  enfermedades_neurologicas_detalle?: string;
  enfermedades_oseas?: boolean;
  enfermedades_oseas_detalle?: string;
  hepatitis_vih?: boolean;
  hepatitis_vih_detalle?: string;
  embarazada?: boolean;
  embarazada_detalle?: string;
  cirugias_previas?: string;
  traumatismos_pies?: boolean;
  traumatismos_pies_detalle?: string;
  plantillas_previas?: boolean;
  plantillas_previas_detalle?: string;
  deporte?: boolean;
  frecuencia_deporte?: string;
  tipo_calzado?: string;
  horas_pie_dia?: number | null;
  fumador?: boolean;
  consentimiento_datos?: boolean;
  consentimiento_tratamiento?: boolean;
  consentimiento_fecha?: string;
  documento_consentimiento?: string;
  consentimiento_fecha_tratamiento?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  ultima_consulta?: any;
}

function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [detalleConsulta, setDetalleConsulta] = useState<any>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [formDataEdit, setFormDataEdit] = useState<any>({});
  const [mostrarModalEdit, setMostrarModalEdit] = useState(false);
  const [mostrarDetalleConsulta, setMostrarDetalleConsulta] = useState(false);

  const cargarPacientes = async (query = '') => {
    try {
      setCargando(true);
      const response = await apiClient.get('/pacientes', {
        params: { busqueda: query, por_pagina: 50 }
      });
      const pacientesConConsulta = await Promise.all(
        response.data.pacientes.map(async (p: Paciente) => {
          try {
            const resp = await apiClient.get(`/pacientes/${p.id}/ultima-consulta`);
            return { ...p, ultima_consulta: resp.data };
          } catch {
            return { ...p, ultima_consulta: null };
          }
        })
      );
      setPacientes(pacientesConConsulta);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, []);

  // Bloquear scroll del fondo cuando hay un modal abierto
  useEffect(() => {
    const hayModal = mostrarModal || mostrarModalEdit || pacienteSeleccionado;
    if (hayModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mostrarModal, mostrarModalEdit, pacienteSeleccionado]);

  const handleBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    cargarPacientes(busqueda);
  };

  const verFicha = async (paciente: Paciente) => {
    setCargandoDetalle(true);
    setMostrarDetalleConsulta(false);
    try {
      const resp = await apiClient.get(`/pacientes/${paciente.id}`);
      setPacienteSeleccionado(resp.data);
      try {
        const respConsulta = await apiClient.get(`/pacientes/${paciente.id}/ultima-consulta`);
        setDetalleConsulta(respConsulta.data);
      } catch { setDetalleConsulta(null); }
    } catch (error) {
      setPacienteSeleccionado(paciente);
      setDetalleConsulta(null);
    } finally { setCargandoDetalle(false); }
  };

  const cerrarFicha = () => {
    setPacienteSeleccionado(null);
    setDetalleConsulta(null);
    setMostrarModalEdit(false);
  };

  const iniciarEdicion = () => {
    if (!pacienteSeleccionado) return;
    setFormDataEdit({ ...pacienteSeleccionado });
    setMostrarModalEdit(true);
  };

  const getEstadoCivilLabel = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { soltero:'Soltero/a', casado:'Casado/a', divorciado:'Divorciado/a', viudo:'Viudo/a', pareja_hecho:'Pareja de hecho' };
    return m[v] || v;
  };
  const getSexoLabel = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { masculino:'Masculino', femenino:'Femenino', otro:'Otro' };
    return m[v] || v;
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header titulo="Gestión de Pacientes" icono="👤">
          <button onClick={() => setMostrarModal(true)} className="btn btn-primary">+ Nuevo Paciente</button>
        </Header>
        <div className="card">
          <form onSubmit={handleBusqueda} style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" placeholder="Buscar por nombre, apellidos o DNI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
            <button type="submit" className="btn btn-primary">🔍 Buscar</button>
          </form>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Registro ID</th><th>Paciente</th><th>Teléfono</th><th>Edad</th><th>Última Visita</th><th>GDPR</th><th>Acciones</th></tr></thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
              ) : pacientes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron pacientes</td></tr>
              ) : pacientes.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo_paciente}</td>
                  <td>{p.nombre} {p.apellidos}</td>
                  <td>{p.telefono || '—'}</td>
                  <td>{p.edad || '—'}</td>
                  <td>{p.ultima_consulta ? (<><strong>{formatearFecha(p.ultima_consulta.fecha_consulta)}</strong><br/><small style={{color:'#666'}}>{p.ultima_consulta.diagnostico || p.ultima_consulta.motivo_consulta || 'Sin diagnóstico'}</small></>) : <span style={{color:'#999'}}>Sin consultas</span>}</td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', padding:'0.25rem 0.5rem', borderRadius:'4px', fontSize:'0.75rem', fontWeight:600, backgroundColor: (p.consentimiento_datos && p.consentimiento_tratamiento) ? 'var(--success-100)' : 'var(--warning-100)', color: (p.consentimiento_datos && p.consentimiento_tratamiento) ? 'var(--success-700)' : 'var(--warning-700)' }}>
                      {(p.consentimiento_datos && p.consentimiento_tratamiento) ? '✓ Firmado' : '⏳ Pendiente'}
                      {p.documento_consentimiento && <span style={{fontSize:'0.85rem'}}>📄</span>}
                    </span>
                  </td>
                  <td><button className="btn btn-primary" style={{ padding:'0.4rem 0.8rem' }} onClick={() => verFicha(p)}>Ver ficha</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* ====== MODALES ====== */}

      {/* Modal: Nuevo Paciente */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo Paciente</h2>
            <FormPaciente
              onSubmit={async (data) => {
                await apiClient.post('/pacientes', data);
                cargarPacientes();
                setMostrarModal(false);
              }}
              onCancel={() => setMostrarModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal: Ficha del Paciente — Rediseño según guía */}
      {pacienteSeleccionado && !mostrarModalEdit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarFicha()}>
          <div className="modal ficha-modal" onClick={(e) => e.stopPropagation()}>
            {/* ═══ HEADER ═══ */}
            <div className="ficha-header">
              <div className="ficha-header-titulo">
                <h3>{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidos}</h3>
                <span className="ficha-codigo">{pacienteSeleccionado.codigo_paciente}</span>
              </div>
              <div className="ficha-header-botones">
                <Link to={`/historia-clinica?paciente=${pacienteSeleccionado.id}`} className="btn btn-primary btn-sm" style={{ textDecoration:'none' }}>+ Nueva Consulta</Link>
                <button onClick={iniciarEdicion} className="btn btn-secondary btn-sm">✏️ Editar</button>
                <button onClick={cerrarFicha} className="btn btn-secondary btn-sm">✕</button>
              </div>
            </div>

            {/* ═══ CONTENIDO ═══ */}
            <div className="ficha-contenido">
              {cargandoDetalle ? (
                <p className="ficha-sin-datos">Cargando ficha...</p>
              ) : (
                <>
                  {/* ── 1. Datos de Identificación ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">📋 1. Datos de Identificación</div>
                    <div className="ficha-contacto-aligned">
                      <div className="ficha-contacto-aligned-campo">
                        <div className="ficha-campo-label">DNI</div>
                        <div className="ficha-campo-valor">{pacienteSeleccionado.dni || '—'}</div>
                      </div>
                      <div className="ficha-contacto-aligned-campo ficha-contacto-aligned-campo-wide">
                        <div className="ficha-campo-label">Sexo</div>
                        <div className="ficha-campo-valor">{getSexoLabel(pacienteSeleccionado.sexo)}</div>
                      </div>
                    </div>
                    <div className="ficha-contacto-aligned">
                      <div className="ficha-contacto-aligned-campo">
                        <div className="ficha-campo-label">Fecha Nac.</div>
                        <div className="ficha-campo-valor">{formatearFecha(pacienteSeleccionado.fecha_nacimiento)}</div>
                      </div>
                      <div className="ficha-contacto-aligned-campo ficha-contacto-aligned-campo-wide">
                        <div className="ficha-campo-label">Estado Civil</div>
                        <div className="ficha-campo-valor">{getEstadoCivilLabel(pacienteSeleccionado.estado_civil)}</div>
                      </div>
                    </div>
                    <div className="ficha-contacto-aligned">
                      <div className="ficha-contacto-aligned-campo">
                        <div className="ficha-campo-label">Edad</div>
                        <div className="ficha-campo-valor">{pacienteSeleccionado.edad || '—'}</div>
                      </div>
                      <div className="ficha-contacto-aligned-campo ficha-contacto-aligned-campo-wide">
                        <div className="ficha-campo-label">Profesión</div>
                        <div className="ficha-campo-valor">{pacienteSeleccionado.profesion || '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* ── 2. Datos de Contacto ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">📞 2. Datos de Contacto</div>
                    <div className="ficha-contacto-aligned">
                      <div className="ficha-contacto-aligned-campo">
                        <div className="ficha-campo-label">Teléfono</div>
                        <div className="ficha-campo-valor">{pacienteSeleccionado.telefono || '—'}</div>
                      </div>
                      <div className="ficha-contacto-aligned-campo ficha-contacto-aligned-campo-wide">
                        <div className="ficha-campo-label">Email</div>
                        <div className="ficha-campo-valor" style={{ wordBreak: 'break-all' }}>{pacienteSeleccionado.email || '—'}</div>
                      </div>
                    </div>
                    <div className="ficha-contacto-aligned">
                      <div className="ficha-contacto-aligned-campo">
                        <div className="ficha-campo-label">Dirección</div>
                        <div className="ficha-campo-valor">{pacienteSeleccionado.direccion || '—'}</div>
                      </div>
                      <div className="ficha-contacto-aligned-campo ficha-contacto-aligned-campo-wide">
                        <div className="ficha-contacto-subcampos">
                          <div className="ficha-contacto-subcampo">
                            <div className="ficha-campo-label">Ciudad</div>
                            <div className="ficha-campo-valor">{pacienteSeleccionado.ciudad || '—'}</div>
                          </div>
                          <div className="ficha-contacto-subcampo">
                            <div className="ficha-campo-label">C.P.</div>
                            <div className="ficha-campo-valor">{pacienteSeleccionado.codigo_postal || '—'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {(pacienteSeleccionado.contacto_emergencia || pacienteSeleccionado.telefono_emergencia) && (
                      <div className="ficha-emergencia">
                        🚨 Contacto de Emergencia: {pacienteSeleccionado.contacto_emergencia}
                        {pacienteSeleccionado.telefono_emergencia && <> — 📞 {pacienteSeleccionado.telefono_emergencia}</>}
                      </div>
                    )}
                  </div>

                  {/* ── 3. Antecedentes de Salud ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">🩺 3. Antecedentes de Salud</div>
                    <div className="ficha-seccion-body">
                      {(pacienteSeleccionado.diabetes || pacienteSeleccionado.problemas_cardiovasculares || pacienteSeleccionado.problemas_coagulacion || pacienteSeleccionado.enfermedades_reumaticas || pacienteSeleccionado.enfermedades_neurologicas || pacienteSeleccionado.enfermedades_oseas || pacienteSeleccionado.hepatitis_vih || pacienteSeleccionado.embarazada) ? (
                        <>
                          {pacienteSeleccionado.diabetes && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">⚕️ Diabetes</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.diabetes_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.problemas_cardiovasculares && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">❤️ Cardiovascular</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.problemas_cardiovasculares_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.problemas_coagulacion && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🩸 Coagulación</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.problemas_coagulacion_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.enfermedades_reumaticas && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🔗 Reumática</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.enfermedades_reumaticas_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.enfermedades_neurologicas && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🧠 Neurológica</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.enfermedades_neurologicas_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.enfermedades_oseas && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🦴 Ósea</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.enfermedades_oseas_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.hepatitis_vih && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🦠 Hepatitis/VIH</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.hepatitis_vih_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                          {pacienteSeleccionado.embarazada && (
                            <div className="ficha-antecedente-item">
                              <span className="ficha-antecedente-badge badge-rojo">🤰 Embarazo</span>
                              <span className="ficha-antecedente-detalle">{pacienteSeleccionado.embarazada_detalle || 'Sin detalles'}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="ficha-sin-datos">Sin antecedentes médicos registrados</p>
                      )}

                      {pacienteSeleccionado.alergias && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div className="ficha-antecedente-badge badge-rojo" style={{ marginBottom: '0.25rem' }}>⚠️ Alergias</div>
                          <div className="ficha-antecedente-detalle">{pacienteSeleccionado.alergias}</div>
                        </div>
                      )}

                      {pacienteSeleccionado.medicacion_actual && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div className="ficha-antecedente-badge badge-rojo" style={{ marginBottom: '0.25rem' }}>💊 Medicación Actual</div>
                          <div className="ficha-antecedente-detalle">{pacienteSeleccionado.medicacion_actual}</div>
                        </div>
                      )}

                      {pacienteSeleccionado.antecedentes && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <div className="ficha-antecedente-badge badge-rojo" style={{ marginBottom: '0.25rem' }}>📝 Antecedentes médicos</div>
                          <div className="ficha-antecedente-detalle">{pacienteSeleccionado.antecedentes}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 4. Antecedentes Podológicos ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">🦶 4. Antecedentes Podológicos</div>
                    <div className="ficha-seccion-body">
                      <div className="ficha-podo-grid">
                        {pacienteSeleccionado.traumatismos_pies && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Traumatismos</span>
                            <div className="ficha-antecedente-detalle" style={{ marginTop: '0.25rem' }}>{pacienteSeleccionado.traumatismos_pies_detalle || 'Sin detalles'}</div>
                          </div>
                        )}
                        {pacienteSeleccionado.plantillas_previas && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Plantillas</span>
                            <div className="ficha-antecedente-detalle" style={{ marginTop: '0.25rem' }}>{pacienteSeleccionado.plantillas_previas_detalle || 'Sin detalles'}</div>
                          </div>
                        )}
                      </div>

                      {pacienteSeleccionado.cirugias_previas && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <div className="ficha-campo-label" style={{ marginBottom: '0.25rem' }}><span className="ficha-antecedente-badge badge-amarillo">Cirugías Previas</span></div>
                          <div className="ficha-antecedente-detalle">{pacienteSeleccionado.cirugias_previas}</div>
                        </div>
                      )}

                      <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {pacienteSeleccionado.deporte && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Deporte</span>
                            <div className="ficha-antecedente-detalle" style={{ marginTop: '0.25rem' }}>{pacienteSeleccionado.frecuencia_deporte || 'Sí'}</div>
                          </div>
                        )}
                        {pacienteSeleccionado.tipo_calzado && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Calzado</span>
                            <div className="ficha-antecedente-detalle" style={{ marginTop: '0.25rem' }}>{pacienteSeleccionado.tipo_calzado}</div>
                          </div>
                        )}
                        {pacienteSeleccionado.horas_pie_dia && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Horas pie/día</span>
                            <div className="ficha-antecedente-detalle" style={{ marginTop: '0.25rem' }}>{pacienteSeleccionado.horas_pie_dia}</div>
                          </div>
                        )}
                        {pacienteSeleccionado.fumador && (
                          <div className="ficha-podo-item">
                            <span className="ficha-antecedente-badge badge-amarillo">Fumador</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── 5. Consentimiento y Protección de Datos (RGPD) ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">📜 5. Consentimiento y Protección de Datos (RGPD)</div>
                    <div className="ficha-seccion-body">
                      <div className="ficha-rgpd-item">
                        <span className={`ficha-rgpd-check ${pacienteSeleccionado.consentimiento_tratamiento ? 'rgpd-ok' : 'rgpd-ko'}`}>
                          {pacienteSeleccionado.consentimiento_tratamiento ? '✓ Firmado' : '✗ No firmado'}
                        </span>
                        <span className="ficha-rgpd-label">Consent. Tratamiento Podológico</span>
                      </div>
                      <div className="ficha-rgpd-item">
                        <span className={`ficha-rgpd-check ${pacienteSeleccionado.consentimiento_datos ? 'rgpd-ok' : 'rgpd-ko'}`}>
                          {pacienteSeleccionado.consentimiento_datos ? '✓ Firmado' : '✗ No firmado'}
                        </span>
                        <span className="ficha-rgpd-label">Consent. Tratamiento Datos Personales</span>
                      </div>
                      {pacienteSeleccionado.consentimiento_fecha && (
                        <div className="ficha-rgpd-fecha-linea">
                          <strong>Fecha:</strong> {formatearFecha(pacienteSeleccionado.consentimiento_fecha)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 6. Documento de Consentimiento ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo">📄 6. Documento de Consentimiento</div>
                    <div className="ficha-seccion-body">
                      <div className="ficha-doc-botones">
                        {pacienteSeleccionado.documento_consentimiento ? (
                          <>
                            <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>✓ Documento disponible</span>
                            <button className="btn btn-secondary btn-sm" onClick={async () => {
                              try {
                                const tokenResp = await apiClient.post(`/documentos/token/${pacienteSeleccionado.id}`);
                                window.open(`/documentos/ver/${pacienteSeleccionado.id}?token=${tokenResp.data.token}`, '_blank');
                              } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
                            }}>Ver documento</button>
                            <button className="btn btn-danger btn-sm" onClick={async () => {
                              if (!confirm('¿Eliminar el documento?')) return;
                              try {
                                await apiClient.delete(`/documentos/consentimiento/${pacienteSeleccionado.id}`);
                                alert('Documento eliminado');
                                verFicha(pacienteSeleccionado);
                              } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
                            }}>🗑️ Eliminar</button>
                          </>
                        ) : (
                          <>
                            <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>📤 Pendiente de subir</span>
                            <input type="file" id="documento-consentimiento" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const fd = new FormData();
                                fd.append('file', file);
                                try {
                                  await documentosApi.post(`/documentos/consentimiento/${pacienteSeleccionado.id}`, fd);
                                  alert('Documento subido');
                                  verFicha(pacienteSeleccionado);
                                } catch (err: any) { alert(err.response?.data?.detail || 'Error'); }
                              }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={() => document.getElementById('documento-consentimiento')?.click()}>
                              Seleccionar archivo (PDF, JPG, PNG)
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── 7. Última Consulta (expandible) ── */}
                  <div className="ficha-seccion">
                    <div className="ficha-seccion-titulo ficha-ultima-expensible" onClick={() => setMostrarDetalleConsulta(!mostrarDetalleConsulta)}>
                      📋 7. Última Consulta
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: 'auto' }}>{mostrarDetalleConsulta ? '▲ Ocultar' : '▼ Expandir'}</span>
                    </div>
                    {detalleConsulta ? (
                      <div className="ficha-seccion-body">
                        <div className="ficha-ultima-fecha">
                          <strong>Fecha:</strong> {formatearFecha(detalleConsulta.fecha_consulta)}
                          <span style={{ marginLeft: '1rem' }}><strong>Última Historia Clínica:</strong> {detalleConsulta.numero_historia}</span>
                        </div>
                        <div className="ficha-ultima-campo"><strong>Motivo:</strong> {detalleConsulta.motivo_consulta || '—'}</div>
                        <div className="ficha-ultima-campo"><strong>Diagnóstico:</strong> {detalleConsulta.diagnostico || '—'}</div>
                        {mostrarDetalleConsulta && (
                          <div className="ficha-ultima-body">
                            {detalleConsulta.antecedentes_personales && <div className="ficha-ultima-campo"><strong>Antecedentes:</strong><p style={{ margin: '0.25rem 0 0' }}>{detalleConsulta.antecedentes_personales}</p></div>}
                            {detalleConsulta.exploracion_fisica && <div className="ficha-ultima-campo"><strong>Exploración:</strong><p style={{ margin: '0.25rem 0 0' }}>{detalleConsulta.exploracion_fisica}</p></div>}
                            {detalleConsulta.plan_tratamiento && <div className="ficha-ultima-campo"><strong>Plan:</strong><p style={{ margin: '0.25rem 0 0' }}>{detalleConsulta.plan_tratamiento}</p></div>}
                            {detalleConsulta.evolucion && <div className="ficha-ultima-campo"><strong>Evolución:</strong><p style={{ margin: '0.25rem 0 0' }}>{detalleConsulta.evolucion}</p></div>}
                            {detalleConsulta.tratamientos && detalleConsulta.tratamientos.length > 0 && (
                              <div className="ficha-ultima-campo">
                                <strong>Tratamientos:</strong>
                                {detalleConsulta.tratamientos.map((t: any) => (
                                  <div key={t.id} style={{ padding: '0.4rem', background: 'var(--gray-50)', borderRadius: '4px', marginTop: '0.25rem', borderLeft: '3px solid var(--success-500)' }}>
                                    <span className="badge badge-success">{t.tipo}</span>
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>{t.descripcion}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {detalleConsulta.observaciones && <div className="ficha-ultima-campo"><strong>Observaciones:</strong><p style={{ margin: '0.25rem 0 0' }}>{detalleConsulta.observaciones}</p></div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ficha-seccion-body">
                        <p className="ficha-sin-datos">No hay consultas registradas</p>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                    <Link to={`/historia-clinica?paciente=${pacienteSeleccionado.id}&ver=todas`} className="btn btn-secondary">
                      📋 VER HISTORIAS CLÍNICAS DEL PACIENTE
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Paciente — usa el MISMO componente que el alta */}
      {mostrarModalEdit && pacienteSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalEdit(false)}>
          <div className="modal edit-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '950px', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
            <div className="ficha-modal-header">
              <h2>✏️ Editar Paciente — {pacienteSeleccionado.codigo_paciente}</h2>
              <button onClick={() => setMostrarModalEdit(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <FormPaciente
              initialData={formDataEdit}
              onSubmit={async (data) => {
                try {
                  const pid = pacienteSeleccionado?.id;
                  if (!pid) return;
                  await apiClient.put(`/pacientes/${pid}`, data);
                  setMostrarModalEdit(false);
                  cargarPacientes();
                  const resp = await apiClient.get(`/pacientes/${pid}`);
                  setPacienteSeleccionado(resp.data);
                } catch (error: any) {
                  alert(error.response?.data?.detail || 'Error al actualizar paciente');
                }
              }}
              onCancel={() => setMostrarModalEdit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Pacientes;
