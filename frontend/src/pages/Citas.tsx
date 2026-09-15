import { useState, useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { getFechaHoy, toFechaLocal } from '../utils/fecha';
import FormCita, { CitaFormData } from '../components/FormCita';

interface Cita {
  id: number;
  paciente_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string;
  notas: string;
  estado: string;
  paciente_nombre: string;
}

interface Paciente {
  id: number;
  nombre: string;
  apellidos: string;
}

function Citas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasMes, setCitasMes] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Cita | null>(null);
  const [vista, setVista] = useState<'lista' | 'calendario'>('lista');

  useScrollLock(!!mostrarModal || !!citaEditando);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fecha') || getFechaHoy();
  });
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return { año: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
  });
  const [filtroEstado, setFiltroEstado] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [cargandoSubmit, setCargandoSubmit] = useState(false);
  const [citaHover, setCitaHover] = useState<Cita | null>(null);
  const [posicionTooltip, setPosicionTooltip] = useState({ x: 0, y: 0 });
  const { user: _user } = useAuth();

  const cargarCitasDia = async () => {
    try {
      setCargando(true);
      const response = await apiClient.get('/citas', {
        params: { 
          fecha_desde: fechaSeleccionada,
          fecha_hasta: fechaSeleccionada,
          por_pagina: 100 
        }
      });
      setCitas(response.data.citas);
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarCitasMes = async () => {
    try {
      const { año, mes } = mesCalendario;
      const primerDia = `${año}-${String(mes).padStart(2, '0')}-01`;
      const ultimoDia = `${año}-${String(mes).padStart(2, '0')}-${new Date(año, mes, 0).getDate()}`;
      const response = await apiClient.get('/citas', {
        params: { 
          fecha_desde: primerDia,
          fecha_hasta: ultimoDia,
          por_pagina: 500 
        }
      });
      setCitasMes(response.data.citas);
    } catch (error) {
      console.error('Error cargando citas del mes:', error);
    }
  };

  const cargarPacientes = async () => {
    try {
      const response = await apiClient.get('/pacientes?por_pagina=100');
      setPacientes(response.data.pacientes);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  useEffect(() => {
    cargarCitasDia();
  }, [fechaSeleccionada]);

  useEffect(() => {
    cargarCitasMes();
  }, [mesCalendario]);

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cambiarEstado = async (citaId: number, nuevoEstado: string) => {
    try {
      await apiClient.patch(`/citas/${citaId}/estado`, null, {
        params: { estado: nuevoEstado }
      });
      cargarCitasDia();
      setMensaje({ tipo: 'exito', texto: 'Estado actualizado correctamente' });
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al actualizar estado' });
    }
  };

  const handleCrearCita = async (data: { paciente_id: number | ''; fecha: string; hora_inicio: string; hora_fin: string; motivo: string; notas?: string }) => {
    setCargandoSubmit(true);
    try {
      await apiClient.post('/citas', {
        paciente_id: Number(data.paciente_id),
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        motivo: data.motivo,
        notas: data.notas,
      });
      await cargarCitasDia();
      await cargarCitasMes();
      setMostrarModal(false);
      setMensaje({ tipo: 'exito', texto: 'Cita creada correctamente' });
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al crear la cita' });
    } finally {
      setCargandoSubmit(false);
    }
  };

  const handleEditarCita = async (data: CitaFormData) => {
    if (!citaEditando) return;

    try {
      await apiClient.put(`/citas/${citaEditando.id}`, {
        paciente_id: Number(data.paciente_id),
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        motivo: data.motivo,
        notas: data.notas,
        estado: citaEditando.estado,
      });
      await cargarCitasDia();
      await cargarCitasMes();
      setCitaEditando(null);
      setMensaje({ tipo: 'exito', texto: 'Cita actualizada correctamente' });
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al actualizar la cita' });
    }
  };

  const getEstadoColor = (estado: string): string => {
    const colores: Record<string, string> = {
      confirmada: 'var(--primary-500)',
      completada: 'var(--success-500)',
      cancelada: 'var(--danger-500)',
      no_asiste: 'var(--gray-400)',
    };
    return colores[estado] || 'var(--gray-300)';
  };

  const getEstadoTexto = (estado: string): string => {
    const textos: Record<string, string> = {
      confirmada: 'Confirmada',
      completada: 'Completada',
      cancelada: 'Cancelada',
      no_asiste: 'No asiste'
    };
    return textos[estado] || estado;
  };

  const getBadgeClass = (estado: string): string => {
    const clases: Record<string, string> = {
      confirmada: 'badge-info',
      completada: 'badge-success',
      cancelada: 'badge-danger',
      no_asiste: 'badge-secondary'
    };
    return clases[estado] || 'badge-secondary';
  };

  const irADiaAnterior = () => {
    const fecha = new Date(fechaSeleccionada + 'T00:00:00');
    fecha.setDate(fecha.getDate() - 1);
    setFechaSeleccionada(toFechaLocal(fecha));
  };

  const irADiaSiguiente = () => {
    const fecha = new Date(fechaSeleccionada + 'T00:00:00');
    fecha.setDate(fecha.getDate() + 1);
    setFechaSeleccionada(toFechaLocal(fecha));
  };

  const irMesAnterior = () => {
    setMesCalendario(prev => {
      const { año, mes } = prev;
      if (mes === 1) return { año: año - 1, mes: 12 };
      return { año, mes: mes - 1 };
    });
  };

  const irMesSiguiente = () => {
    setMesCalendario(prev => {
      const { año, mes } = prev;
      if (mes === 12) return { año: año + 1, mes: 1 };
      return { año, mes: mes + 1 };
    });
  };

  // Funciones para el tooltip
  const mostrarTooltip = (cita: Cita, e: React.MouseEvent) => {
    setCitaHover(cita);
    const tooltipWidth = 280;
    const tooltipHeight = 180;
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    
    // Ajustar si se sale por la derecha
    if (x + tooltipWidth > window.innerWidth) {
      x = e.clientX - tooltipWidth - 15;
    }
    
    // Ajustar si se sale por abajo
    if (y + tooltipHeight > window.innerHeight) {
      y = e.clientY - tooltipHeight - 15;
    }
    
    setPosicionTooltip({ x, y });
  };

  const ocultarTooltip = () => {
    setCitaHover(null);
  };

  const generarDiasCalendario = () => {
    const { año, mes } = mesCalendario;
    const primerDia = new Date(año, mes - 1, 1);
    const ultimoDia = new Date(año, mes, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

    const dias: Array<{ dia: number; fecha: string; esMesActual: boolean }> = [];

    const mesAnterior = new Date(año, mes - 1, 0);
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const dia = mesAnterior.getDate() - i;
      const fecha = toFechaLocal(new Date(año, mes - 2, dia));
      dias.push({ dia, fecha, esMesActual: false });
    }

    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = `${año}-${String(mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      dias.push({ dia: i, fecha, esMesActual: true });
    }

    const celdasRestantes = 42 - dias.length;
    for (let i = 1; i <= celdasRestantes; i++) {
      const fecha = toFechaLocal(new Date(año, mes, i));
      dias.push({ dia: i, fecha, esMesActual: false });
    }

    return dias;
  };

  const citasFiltradas = filtroEstado
    ? citas.filter(c => c.estado === filtroEstado)
    : citas;

  const resumenEstados = {
    total: citas.length,
    confirmada: citas.filter(c => c.estado === 'confirmada').length,
    completada: citas.filter(c => c.estado === 'completada').length,
    cancelada: citas.filter(c => c.estado === 'cancelada').length,
    no_asiste: citas.filter(c => c.estado === 'no_asiste').length,
  };

  const { año: añoCal, mes: mesCal } = mesCalendario;
  const nombreMes = new Date(añoCal, mesCal - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Gestión de Citas" icono="📅">
          <button onClick={() => setMostrarModal(true)} className="btn btn-primary">
            + Nueva Cita
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

        {/* Selector de fecha y filtros */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {vista === 'lista' ? (
                <>
                  <button className="btn btn-secondary" onClick={irADiaAnterior}>◀</button>
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                  />
                  <button className="btn btn-secondary" onClick={irADiaSiguiente}>▶</button>
                  <button className="btn btn-secondary" onClick={() => setFechaSeleccionada(getFechaHoy())}>Hoy</button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={irMesAnterior}>◀</button>
                  <span style={{ minWidth: '150px', textAlign: 'center', fontWeight: 600, textTransform: 'capitalize' }}>
                    {nombreMes}
                  </span>
                  <button className="btn btn-secondary" onClick={irMesSiguiente}>▶</button>
                  <button className="btn btn-secondary" onClick={() => {
                    const hoy = new Date();
                    setMesCalendario({ año: hoy.getFullYear(), mes: hoy.getMonth() + 1 });
                  }}>Hoy</button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Todos los estados</option>
                <option value="confirmada">Confirmada</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
                <option value="no_asiste">No asiste</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${vista === 'lista' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setVista('lista')}
              >
                📋 Lista
              </button>
              <button 
                className={`btn ${vista === 'calendario' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setVista('calendario')}
              >
                📅 Calendario
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de estados */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Total</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>{resumenEstados.total}</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Confirmadas</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-600)' }}>{resumenEstados.confirmada}</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#666' }}>Completadas</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-600)' }}>{resumenEstados.completada}</p>
          </div>
        </div>

        {/* Vista de lista */}
        {!cargando && vista === 'lista' && (
          <div>
            {citasFiltradas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#666' }}>No hay citas programadas para esta fecha</p>
              </div>
            ) : (
              citasFiltradas.map((cita) => (
                <div 
                  key={cita.id} 
                  className="agenda-item"
                  style={{ borderLeft: `4px solid ${getEstadoColor(cita.estado)}` }}
                >
                  <div className="agenda-hora">
                    {cita.hora_inicio?.substring(0, 5)} - {cita.hora_fin?.substring(0, 5)}
                  </div>
                  <div className="agenda-info">
                    <h4>{cita.paciente_nombre || 'Paciente'}</h4>
                    <p>{cita.motivo || 'Sin motivo especificado'}</p>
                    {cita.notas && <p style={{ fontSize: '0.75rem', color: '#888' }}>📝 {cita.notas}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${getBadgeClass(cita.estado)}`}>
                      {getEstadoTexto(cita.estado)}
                    </span>
                    <select
                      value={cita.estado}
                      onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                      style={{ padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="no_asiste">No asiste</option>
                    </select>
                    <button
                      onClick={() => setCitaEditando(cita)}
                      className="btn btn-secondary btn-sm"
                      title="Editar cita"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vista de calendario mensual */}
        {vista === 'calendario' && (
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                <div key={dia} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#666', padding: '0.5rem' }}>
                  {dia}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {generarDiasCalendario().map((info, idx) => {
                const citasDelDia = citasMes.filter(c => c.fecha === info.fecha);
                const esHoy = info.fecha === getFechaHoy();

                return (
                  <div
                    key={idx}
                    style={{
                      minHeight: '80px',
                      padding: '0.25rem',
                      backgroundColor: esHoy ? 'var(--primary-50)' : info.esMesActual ? 'white' : '#f9fafb',
                      border: esHoy ? '2px solid var(--primary-400)' : '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setFechaSeleccionada(info.fecha);
                      setVista('lista');
                    }}
                  >
                    <div style={{
                      fontWeight: esHoy ? 700 : 400,
                      fontSize: '0.75rem',
                      color: info.esMesActual ? '#333' : '#999',
                      marginBottom: '0.25rem',
                    }}>
                      {info.dia}
                    </div>
                    {citasDelDia.slice(0, 3).map((cita) => (
                      <div
                        key={cita.id}
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 4px',
                          marginBottom: '2px',
                          borderRadius: '3px',
                          backgroundColor: getEstadoColor(cita.estado),
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => mostrarTooltip(cita, e)}
                        onMouseLeave={ocultarTooltip}
                      >
                        {cita.hora_inicio?.substring(0, 5)} {cita.paciente_nombre?.split(' ')[0]}
                      </div>
                    ))}
                    {citasDelDia.length > 3 && (
                      <div style={{ fontSize: '0.6rem', color: '#666' }}>
                        +{citasDelDia.length - 3} más
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cargando && vista === 'lista' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#666' }}>Cargando citas...</p>
          </div>
        )}
      </main>

      {/* Tooltip flotante */}
      {citaHover && (
        <div
          style={{
            position: 'fixed',
            left: posicionTooltip.x,
            top: posicionTooltip.y,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '250px',
            maxWidth: '300px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: getEstadoColor(citaHover.estado),
            }} />
            <strong>{getEstadoTexto(citaHover.estado)}</strong>
          </div>
          <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
            <strong>Paciente:</strong> {citaHover.paciente_nombre}
          </p>
          <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
            <strong>Hora:</strong> {citaHover.hora_inicio?.substring(0, 5)} - {citaHover.hora_fin?.substring(0, 5)}
          </p>
          {citaHover.motivo && (
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
              <strong>Motivo:</strong> {citaHover.motivo}
            </p>
          )}

          {citaHover.notas && (
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
              <strong>Notas:</strong> {citaHover.notas}
            </p>
          )}
        </div>
      )}

      {/* Modal para nueva cita */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Cita</h2>
            <FormCita
              pacientes={pacientes}
              onSubmit={handleCrearCita}
              onCancel={() => setMostrarModal(false)}
              loading={cargandoSubmit}
              onCrearNuevoPaciente={(nombre) => {
                setMostrarModal(false);
                alert(`Crear paciente: ${nombre}`);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal para editar cita */}
      {citaEditando && (
        <div className="modal-overlay" onClick={() => setCitaEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Editar Cita</h2>
            <FormCita
              initialData={{
                paciente_id: citaEditando.paciente_id,
                fecha: citaEditando.fecha,
                hora_inicio: citaEditando.hora_inicio,
                hora_fin: citaEditando.hora_fin,
                motivo: citaEditando.motivo || '',
                notas: citaEditando.notas || '',
              }}
              pacientes={pacientes}
              onSubmit={handleEditarCita}
              onCancel={() => setCitaEditando(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Citas;
