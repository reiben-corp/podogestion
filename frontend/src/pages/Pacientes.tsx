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
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', padding:'0.25rem 0.5rem', borderRadius:'4px', fontSize:'0.75rem', fontWeight:600, backgroundColor: p.consentimiento_datos ? 'var(--success-100)' : 'var(--warning-100)', color: p.consentimiento_datos ? 'var(--success-700)' : 'var(--warning-700)' }}>
                      {p.consentimiento_datos ? '✓ Firmado' : '⏳ Pendiente'}
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

      {/* Modal: Ficha del Paciente — Mismo tamaño que form nuevo paciente */}
      {pacienteSeleccionado && !mostrarModalEdit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarFicha()}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', padding: 0 }}>
            {/* Header fijo - mismo estilo que form */}
            <div style={{ padding: '1rem', borderBottom: '2px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:700 }}>
                {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidos}
                <span style={{ fontSize:'0.85rem', color:'var(--gray-600)', fontWeight:600, marginLeft:'0.75rem' }}>
                  — {pacienteSeleccionado.codigo_paciente}
                </span>
              </h3>
              <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                <Link to={`/historia-clinica?paciente=${pacienteSeleccionado.id}`} className="btn btn-primary btn-sm" style={{ textDecoration:'none' }}>+ Nueva Consulta</Link>
                <button onClick={iniciarEdicion} className="btn btn-secondary btn-sm">✏️ Editar</button>
                <button onClick={cerrarFicha} className="btn btn-secondary btn-sm">✕</button>
              </div>
            </div>
            {/* Contenido - scroll si es necesario */}
            <div style={{ padding:'0.5rem 1rem', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
              {cargandoDetalle ? (
                <p style={{ color:'#666' }}>Cargando ficha...</p>
              ) : (
                <>
                  {/* 1. Datos de Identificación */}
                  <div className="ficha-seccion">
                    <h4>📋 1. Datos de Identificación</h4>
                    <div className="ficha-grid">
                      <div className="ficha-fila">
                        <span className="ficha-label">DNI:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.dni || '-'}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Fecha nac.:</span>
                        <span className="ficha-valor">{formatearFecha(pacienteSeleccionado.fecha_nacimiento)}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Edad:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.edad || '-'}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Sexo:</span>
                        <span className="ficha-valor">{getSexoLabel(pacienteSeleccionado.sexo)}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Estado civil:</span>
                        <span className="ficha-valor">{getEstadoCivilLabel(pacienteSeleccionado.estado_civil)}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Profesión:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.profesion || '-'}</span>
                      </div>
                    </div>
                  </div>
                  {/* 2. Datos de Contacto */}
                  <div className="ficha-seccion">
                    <h4>📞 2. Datos de Contacto</h4>
                    <div className="ficha-grid">
                      <div className="ficha-fila">
                        <span className="ficha-label">Teléfono:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.telefono || '-'}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Email:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.email || '-'}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">Ciudad:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.ciudad || '-'}</span>
                      </div>
                      <div className="ficha-fila">
                        <span className="ficha-label">C.P.:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.codigo_postal || '-'}</span>
                      </div>
                      <div className="ficha-fila" style={{ gridColumn: 'span 4' }}>
                        <span className="ficha-label">Dirección:</span>
                        <span className="ficha-valor">{pacienteSeleccionado.direccion || '-'}</span>
                      </div>
                    </div>
                    {(pacienteSeleccionado.contacto_emergencia || pacienteSeleccionado.telefono_emergencia) && (
                      <div className="ficha-alerta ficha-alerta-danger" style={{ marginTop: '0.5rem' }}>
                        <div className="ficha-fila">
                          <span className="ficha-label">🚨 Contacto de Emergencia:</span>
                          <span className="ficha-valor">
                            {pacienteSeleccionado.contacto_emergencia && <span>{pacienteSeleccionado.contacto_emergencia}</span>}
                            {pacienteSeleccionado.telefono_emergencia && <span> — 📞 {pacienteSeleccionado.telefono_emergencia}</span>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 3. Antecedentes Generales */}
                  <div className="ficha-seccion">
                    <h4>🩺 3. Antecedentes Generales</h4>
                    {pacienteSeleccionado.alergias && (
                      <div className="ficha-medica ficha-medica-alergias">
                        <strong>⚠️ Alergias:</strong> {pacienteSeleccionado.alergias}
                      </div>
                    )}
                    {pacienteSeleccionado.medicacion_actual && (
                      <div className="ficha-medica ficha-medica-medicacion">
                        <strong>💊 Medicación:</strong> {pacienteSeleccionado.medicacion_actual}
                      </div>
                    )}
                    {pacienteSeleccionado.antecedentes && (
                      <div className="ficha-medica ficha-medica-antecedentes">
                        <strong>📝 Antecedentes:</strong> {pacienteSeleccionado.antecedentes}
                      </div>
                    )}
                    {!pacienteSeleccionado.alergias && !pacienteSeleccionado.medicacion_actual && !pacienteSeleccionado.antecedentes && (
                      <p style={{ color:'#999', fontSize:'0.82rem', margin:0 }}>Sin antecedentes registrados</p>
                    )}
                  </div>
                  {/* 4. Antecedentes Podológicos */}
                  <div className="ficha-seccion">
                    <h4>🦶 4. Antecedentes Podológicos</h4>
                    <div className="ficha-antecedentes">
                      {pacienteSeleccionado.diabetes && (<div className="antecedente-item"><span className="badge badge-danger">DIABETES</span><span className="detalle">{pacienteSeleccionado.diabetes_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.problemas_cardiovasculares && (<div className="antecedente-item"><span className="badge badge-danger">CARDIOVASCULAR</span><span className="detalle">{pacienteSeleccionado.problemas_cardiovasculares_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.problemas_coagulacion && (<div className="antecedente-item"><span className="badge badge-danger">COAGULACIÓN</span><span className="detalle">{pacienteSeleccionado.problemas_coagulacion_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.enfermedades_reumaticas && (<div className="antecedente-item"><span className="badge badge-warning">REUMÁTICA</span><span className="detalle">{pacienteSeleccionado.enfermedades_reumaticas_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.enfermedades_neurologicas && (<div className="antecedente-item"><span className="badge badge-warning">NEUROLÓGICA</span><span className="detalle">{pacienteSeleccionado.enfermedades_neurologicas_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.enfermedades_oseas && (<div className="antecedente-item"><span className="badge badge-warning">ÓSEA</span><span className="detalle">{pacienteSeleccionado.enfermedades_oseas_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.hepatitis_vih && (<div className="antecedente-item"><span className="badge badge-danger">HEPATITIS/VIH</span><span className="detalle">{pacienteSeleccionado.hepatitis_vih_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.embarazada && (<div className="antecedente-item"><span className="badge badge-info">EMBARAZO</span><span className="detalle">{pacienteSeleccionado.embarazada_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.traumatismos_pies && (<div className="antecedente-item"><span className="badge badge-warning">TRAUMATISMOS</span><span className="detalle">{pacienteSeleccionado.traumatismos_pies_detalle || 'Sin detalles'}</span></div>)}
                      {pacienteSeleccionado.plantillas_previas && (<div className="antecedente-item"><span className="badge badge-info">PLANTILLAS</span><span className="detalle">{pacienteSeleccionado.plantillas_previas_detalle || 'Sin detalles'}</span></div>)}
                    </div>
                    {(pacienteSeleccionado.cirugias_previas || pacienteSeleccionado.deporte || pacienteSeleccionado.fumador || pacienteSeleccionado.tipo_calzado) && (
                      <div style={{ marginTop:'0.5rem', display:'flex', flexWrap:'wrap', gap:'0.75rem', fontSize:'0.82rem' }}>
                        {pacienteSeleccionado.cirugias_previas && <span><strong>Cirugías:</strong> {pacienteSeleccionado.cirugias_previas}</span>}
                        {pacienteSeleccionado.deporte && <span><strong>Deporte:</strong> {pacienteSeleccionado.frecuencia_deporte || 'Sí'}</span>}
                        {pacienteSeleccionado.tipo_calzado && <span><strong>Calzado:</strong> {pacienteSeleccionado.tipo_calzado}</span>}
                        {pacienteSeleccionado.horas_pie_dia && <span><strong>Horas pie/día:</strong> {pacienteSeleccionado.horas_pie_dia}</span>}
                        {pacienteSeleccionado.fumador && <span><strong>Fumador:</strong> Sí</span>}
                      </div>
                    )}
                  </div>
                  {/* 5. Consentimientos RGPD */}
                  <div className="ficha-seccion">
                    <h4>📜 5. Consentimiento y Protección de Datos (RGPD)</h4>
                    <div className="ficha-grid">
                      <div><strong>Consent. datos:</strong>{' '}
                        {pacienteSeleccionado.consentimiento_datos ? <span className="badge badge-success">✓ Firmado</span> : <span className="badge badge-danger">✗ No firmado</span>}
                      </div>
                      <div><strong>Consent. tratamiento:</strong>{' '}
                        {pacienteSeleccionado.consentimiento_tratamiento ? <span className="badge badge-success">✓ Firmado</span> : <span className="badge badge-danger">✗ No firmado</span>}
                      </div>
                      {pacienteSeleccionado.consentimiento_fecha && (
                        <div><strong>Fecha:</strong> {formatearFecha(pacienteSeleccionado.consentimiento_fecha)}</div>
                      )}
                    </div>
                  </div>
                  {/* 6. Documento de Consentimiento */}
                  <div className="ficha-seccion">
                    <h4>📄 6. Documento de Consentimiento</h4>
                    {pacienteSeleccionado.documento_consentimiento ? (
                      <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                        <span className="badge badge-success" style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}>✓ Documento disponible</span>
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
                      </div>
                    ) : (
                      <>
                        <span className="badge badge-warning" style={{ fontSize:'0.85rem', padding:'0.4rem 0.75rem' }}>📤 Pendiente de subir</span>
                        <div style={{ marginTop:'1rem' }}>
                          <input type="file" id="documento-consentimiento" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }}
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
                        </div>
                      </>
                    )}
                  </div>
                  {/* 7. Última Consulta (expandible) */}
                  <div className="ficha-seccion">
                    <h4 style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem' }} onClick={() => setMostrarDetalleConsulta(!mostrarDetalleConsulta)}>
                      📋 7. Última Consulta
                      <span style={{ fontSize:'0.8rem', color:'#666' }}>{mostrarDetalleConsulta ? '▲ Ocultar' : '▼ Expandir'}</span>
                    </h4>
                    {detalleConsulta ? (
                      <div style={{ padding:'1rem', backgroundColor:'#f8f9fa', borderRadius:'8px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                          <div><strong>Fecha:</strong> {formatearFecha(detalleConsulta.fecha_consulta)}</div>
                          <div><strong>Código:</strong> {detalleConsulta.codigo_paciente}</div>
                        </div>
                        <div><strong>Motivo:</strong> {detalleConsulta.motivo_consulta || '-'}</div>
                        <div><strong>Diagnóstico:</strong> {detalleConsulta.diagnostico || '-'}</div>
                        {mostrarDetalleConsulta && (
                          <div style={{ marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid #dee2e6' }}>
                            {detalleConsulta.antecedentes_personales && <div><strong>Antecedentes:</strong><p>{detalleConsulta.antecedentes_personales}</p></div>}
                            {detalleConsulta.exploracion_fisica && <div><strong>Exploración:</strong><p>{detalleConsulta.exploracion_fisica}</p></div>}
                            {detalleConsulta.plan_tratamiento && <div><strong>Plan:</strong><p>{detalleConsulta.plan_tratamiento}</p></div>}
                            {detalleConsulta.evolucion && <div><strong>Evolución:</strong><p>{detalleConsulta.evolucion}</p></div>}
                            {detalleConsulta.tratamientos && detalleConsulta.tratamientos.length > 0 && (
                              <div>
                                <strong>Tratamientos:</strong>
                                {detalleConsulta.tratamientos.map((t: any) => (
                                  <div key={t.id} style={{ padding:'0.5rem', backgroundColor:'#fff', borderRadius:'4px', marginTop:'0.25rem', borderLeft:'3px solid #28a745' }}>
                                    <span className="badge badge-success">{t.tipo}</span>
                                    <span style={{ marginLeft:'0.5rem' }}>{t.descripcion}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {detalleConsulta.observaciones && <div><strong>Observaciones:</strong><p>{detalleConsulta.observaciones}</p></div>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color:'#666' }}>No hay consultas registradas</p>
                    )}
                  </div>
                  {/* Botón: Ver todas las historias clínicas */}
                  <div style={{ textAlign:'center', marginTop:'1rem', marginBottom:'0.5rem' }}>
                    <Link to={`/historia-clinica?paciente=${pacienteSeleccionado.id}&ver=todas`} className="btn btn-secondary">
                      📋 Ver Todas las Historias Clínicas
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
