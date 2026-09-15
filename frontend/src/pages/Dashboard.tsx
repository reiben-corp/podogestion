import { useState, useEffect, useCallback } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import FormPaciente, { PacienteFormData } from '../components/FormPaciente';
import FormCita from '../components/FormCita';
import FormHistoriaClinica from '../components/FormHistoriaClinica';
import FormFactura, { FacturaFormData } from '../components/FormFactura';
import Sidebar from '../components/Sidebar';
import { configEvents } from '../utils/configEvents';

// ── Tipos ──

interface ConfiguracionPublica {
  [clave: string]: string;
}

// ── Componente Header Dashboard ──

interface DashboardHeaderProps {
  nombre: string;
  subtitulo: string;
  children?: React.ReactNode;
}

function DashboardHeader({ nombre, subtitulo, children }: DashboardHeaderProps) {
  return (
    <div className="header">
      <div className="header-info">
        <h2 className="header-nombre">{nombre}</h2>
        <p className="header-subtitulo">{subtitulo}</p>
      </div>
      {children}
    </div>
  );
}

// ── Tipos ──

interface Cita {
  id: number;
  paciente_nombre?: string;
  paciente_telefono?: string;
  hora_inicio: string;
  estado: string;
  paciente_id: number;
}

interface DashboardData {
  citas_hoy: Cita[];
  citas_manana: Cita[];
  total_pacientes: number;
  anios_disponibles: number[];
}

interface CitasMesData {
  citas_por_dia: { dia: number; citas: number }[];
  citas_por_estado: Record<string, number>;
}

interface PacienteOption {
  id: number;
  nombre: string;
  apellidos: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ── Componente Modal Simple ──

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ titulo, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
        <div className="ficha-modal-header" style={{ borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>{titulo}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Componente Principal ──

function Dashboard() {
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [citasMes, setCitasMes] = useState<CitasMesData | null>(null);
  const [mesesConfirmadas, setMesesConfirmadas] = useState<{ anios: number[]; meses_por_anio: Record<number, { mes: number; total: number }[]> } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [config, setConfig] = useState<ConfiguracionPublica>({});

  // Modales
  const [modalPaciente, setModalPaciente] = useState(false);
  const [modalCita, setModalCita] = useState(false);
  const [modalConsulta, setModalConsulta] = useState(false);
  const [modalFactura, setModalFactura] = useState(false);
  const [cargaInicial, setCargaInicial] = useState(true);

  useScrollLock(modalPaciente || modalCita || modalConsulta || modalFactura);
  const [formPacienteLoading, setFormPacienteLoading] = useState(false);
  const [citaEnviando, setCitaEnviando] = useState(false);
  const [consultaEnviando, setConsultaEnviando] = useState(false);
  const [facturaEnviando, setFacturaEnviando] = useState(false);

  // ── Carga de datos ──

  const cargarDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/estadisticas/dashboard');
      setDashboard(res.data);
      if (cargaInicial && res.data.anios_disponibles?.length > 0) {
        const anioActual = new Date().getFullYear();
        setAnioSeleccionado(res.data.anios_disponibles.includes(anioActual) ? anioActual : res.data.anios_disponibles[res.data.anios_disponibles.length - 1]);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  }, [cargaInicial]);

  const cargarMesesConfirmadas = useCallback(async () => {
    try {
      const res = await apiClient.get('/estadisticas/meses-con-confirmadas');
      setMesesConfirmadas(res.data);
    } catch (error) {
      console.error('Error cargando meses con confirmadas:', error);
    }
  }, []);

  const cargarCitasMes = useCallback(async () => {
    try {
      const res = await apiClient.get(`/estadisticas/citas-mes?year=${anioSeleccionado}&month=${mesSeleccionado}`);
      setCitasMes(res.data);
    } catch (error) {
      console.error('Error cargando citas mes:', error);
    }
  }, [anioSeleccionado, mesSeleccionado]);

  const cargarAuditoria = useCallback(async () => {
    try {
      await apiClient.get('/estadisticas/auditoria?limite=15');
    } catch (error) {
      console.error('Error cargando auditoría:', error);
    }
  }, []);

  const cargarPacientes = useCallback(async () => {
    try {
      const res = await apiClient.get('/pacientes?por_pagina=100');
      setPacientes(res.data.pacientes || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  }, []);

  const cargarConfiguracion = useCallback(async () => {
    try {
      const res = await apiClient.get('/configuracion/public');
      setConfig(res.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }, []);

  // Suscribirse a cambios de configuración
  useEffect(() => {
    const unsubscribe = configEvents.subscribe(cargarConfiguracion);
    return unsubscribe;
  }, [cargarConfiguracion]);

  // Carga inicial
  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      await Promise.all([cargarDashboard(), cargarMesesConfirmadas(), cargarAuditoria(), cargarConfiguracion()]);
      setCargaInicial(false);
      setCargando(false);
    };
    cargar();
  }, [cargarDashboard, cargarMesesConfirmadas, cargarAuditoria, cargarConfiguracion]);

  // Carga de citas del mes
  useEffect(() => {
    if (!cargaInicial) {
      cargarCitasMes();
    }
  }, [cargarCitasMes, cargaInicial]);

  // Cargar pacientes al abrir modales
  useEffect(() => {
    if (modalCita || modalConsulta || modalFactura) {
      cargarPacientes();
    }
  }, [modalCita, modalConsulta, modalFactura, cargarPacientes]);

  // Filtrar meses disponibles según el año seleccionado
  const mesesDisponibles = mesesConfirmadas?.meses_por_anio[anioSeleccionado] || [];
  const aniosDisponibles = mesesConfirmadas?.anios || [];

  // Si el mes seleccionado no está disponible, seleccionar el primero
  useEffect(() => {
    if (mesesDisponibles.length > 0 && !mesesDisponibles.some(m => m.mes === mesSeleccionado)) {
      setMesSeleccionado(mesesDisponibles[0].mes);
    }
  }, [mesesDisponibles, mesSeleccionado]);

  // ── Handlers para formularios reutilizables ──

  const handlePacienteSubmit = async (data: PacienteFormData) => {
    setFormPacienteLoading(true);
    try {
      await apiClient.post('/pacientes', {
        ...data,
        sexo: data.sexo || undefined,
        fecha_nacimiento: data.fecha_nacimiento || undefined,
      });
      await Promise.all([cargarDashboard(), cargarAuditoria()]);
      setModalPaciente(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al crear el paciente');
    } finally {
      setFormPacienteLoading(false);
    }
  };

  const handleCrearNuevoPaciente = (_nombre: string) => {
    setModalCita(false);
    setModalPaciente(true);
  };

  const handleCitaSubmit = async (data: { paciente_id: number | ''; fecha: string; hora_inicio: string; hora_fin: string; motivo: string }) => {
    setCitaEnviando(true);
    try {
      await apiClient.post('/citas', {
        paciente_id: Number(data.paciente_id),
        profesional_id: 1,
        fecha: data.fecha,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        motivo: data.motivo,
      });
      await Promise.all([cargarDashboard(), cargarAuditoria()]);
      setModalCita(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al crear la cita');
    } finally {
      setCitaEnviando(false);
    }
  };

  const handleConsultaSubmit = async (data: any) => {
    setConsultaEnviando(true);
    try {
      await apiClient.post('/historias', {
        paciente_id: Number(data.paciente_id),
        profesional_id: 1,
        motivo_consulta: data.motivo_consulta,
        antecedentes_personales: data.antecedentes_personales || null,
        antecedentes_familiares: data.antecedentes_familiares || null,
        exploracion_fisica: data.exploracion_fisica || null,
        diagnostico: data.diagnostico || null,
        codigo_diagnostico: data.codigo_diagnostico || null,
        plan_tratamiento: data.plan_tratamiento || null,
        evolucion: data.evolucion || null,
        observaciones: data.observaciones || null,
        exploraciones: data.exploraciones || [],
        tratamientos: data.tratamientos || [],
        podogramas: data.podogramas || [],
      });
      await Promise.all([cargarDashboard(), cargarAuditoria()]);
      setModalConsulta(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al crear la consulta');
    } finally {
      setConsultaEnviando(false);
    }
  };

  const handleFacturaSubmit = async (data: FacturaFormData) => {
    setFacturaEnviando(true);
    try {
      await apiClient.post('/facturacion', {
        tipo: data.tipo,
        paciente_id: Number(data.paciente_id),
        profesional_id: 1,
        lineas: data.lineas,
      });
      await Promise.all([cargarDashboard(), cargarAuditoria()]);
      setModalFactura(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al crear la factura');
    } finally {
      setFacturaEnviando(false);
    }
  };

  // ── Cálculos ──

  const maxCitas = citasMes?.citas_por_dia ? Math.max(...citasMes.citas_por_dia.map(d => d.citas), 1) : 1;
  const totalCitasMes = citasMes?.citas_por_dia ? citasMes.citas_por_dia.reduce((sum, d) => sum + d.citas, 0) : 0;
  const diasMes = new Date(anioSeleccionado, mesSeleccionado, 0).getDate();
  const hoy = new Date().getDate();
  const esMesActual = anioSeleccionado === new Date().getFullYear() && mesSeleccionado === new Date().getMonth() + 1;

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        {/* Header con accesos rápidos */}
        <DashboardHeader
          nombre={config.clinica_nombre || 'Clínica Podológica'}
          subtitulo={config.clinica_direccion || 'Dirección de la clínica'}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setModalPaciente(true)} className="btn btn-primary">+ Paciente</button>
            <button onClick={() => setModalCita(true)} className="btn btn-primary">+ Cita</button>
            <button onClick={() => setModalConsulta(true)} className="btn btn-primary">+ Consulta</button>
            <button onClick={() => setModalFactura(true)} className="btn btn-primary">+ Factura</button>
          </div>
        </DashboardHeader>

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--gray-500)' }}>Cargando...</p>
          </div>
        ) : (
          <>
            {/* ── Citas Hoy / Mañana ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <h3>📅 Citas de hoy</h3>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '130px' }}>
                  {dashboard?.citas_hoy.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', padding: '0.5rem 0', fontSize: '0.85rem' }}>Sin citas</p>
                  ) : (
                    dashboard?.citas_hoy.map(cita => (
                      <div key={cita.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '0.85rem', minWidth: '45px' }}>
                          {cita.hora_inicio?.substring(0, 5)}
                        </span>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cita.paciente_nombre}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>📞 {cita.paciente_telefono}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                <h3>📅 Citas de mañana</h3>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '130px' }}>
                  {dashboard?.citas_manana.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', padding: '0.5rem 0', fontSize: '0.85rem' }}>Sin citas</p>
                  ) : (
                    dashboard?.citas_manana.map(cita => (
                      <div key={cita.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '0.85rem', minWidth: '45px' }}>
                          {cita.hora_inicio?.substring(0, 5)}
                        </span>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cita.paciente_nombre}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>📞 {cita.paciente_telefono}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Gráfica Citas Confirmadas del Mes ── */}
            {aniosDisponibles.length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>📊 Citas del mes</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      value={mesSeleccionado} 
                      onChange={e => setMesSeleccionado(Number(e.target.value))}
                      style={{ padding: '0.3rem 0.6rem', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
                    >
                      {mesesDisponibles.map(m => <option key={m.mes} value={m.mes}>{MESES[m.mes - 1]}</option>)}
                    </select>
                    <select 
                      value={anioSeleccionado} 
                      onChange={e => setAnioSeleccionado(Number(e.target.value))}
                      style={{ padding: '0.3rem 0.6rem', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
                    >
                      {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                {/* Gráfico de barras */}
                <div style={{ display: 'flex', gap: '3px', padding: '0 0.5rem' }}>
                  {Array.from({ length: diasMes }, (_, i) => i + 1).map(dia => {
                    const citasDia = citasMes?.citas_por_dia.find(d => d.dia === dia)?.citas || 0;
                    const alturaPx = maxCitas > 0 ? Math.round((citasDia / maxCitas) * 100) : 0;
                    const alturaFinal = Math.max(alturaPx, 4);
                    const esHoy = esMesActual && dia === hoy;

                    return (
                      <div key={dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '4px' }}>
                        {/* Número de citas (arriba) */}
                        <div style={{ height: '16px', display: 'flex', alignItems: 'center' }}>
                          {citasDia > 0 && (
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: esHoy ? 'var(--accent-700)' : 'var(--gray-600)' }}>
                              {citasDia}
                            </span>
                          )}
                        </div>
                        {/* Barra (altura fija 120px, alineada al final) */}
                        <div style={{ height: '120px', width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div
                            onClick={() => {
                              const mesStr = mesSeleccionado.toString().padStart(2, '0');
                              const diaStr = dia.toString().padStart(2, '0');
                              navigate(`/citas?fecha=${anioSeleccionado}-${mesStr}-${diaStr}`);
                            }}
                            style={{
                              width: '100%',
                              height: `${alturaFinal}px`,
                              minHeight: '4px',
                              background: esHoy
                                ? 'linear-gradient(180deg, var(--accent-400) 0%, var(--accent-600) 100%)'
                                : citasDia > 0
                                  ? 'linear-gradient(180deg, var(--primary-400) 0%, var(--primary-600) 100%)'
                                  : 'var(--gray-200)',
                              borderRadius: '3px 3px 0 0',
                              boxShadow: esHoy ? '0 2px 6px rgba(249, 115, 22, 0.3)' : citasDia > 0 ? '0 1px 3px rgba(20, 168, 146, 0.2)' : 'none',
                              cursor: 'pointer',
                              transition: 'height 0.2s ease',
                            }}
                            title={`${dia}: ${citasDia} citas`}
                          />
                        </div>
                        {/* Número del día (debajo) */}
                        {(dia % 5 === 0 || dia === 1 || esHoy) && (
                          <span style={{ fontSize: '0.55rem', color: esHoy ? 'var(--accent-700)' : 'var(--gray-400)', fontWeight: esHoy ? 700 : 400, marginTop: '3px' }}>
                            {dia}
                          </span>
                        )}
                        {esHoy && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--accent-600)', marginTop: '2px' }}>
                            HOY
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Línea base del gráfico */}
                <div style={{ height: '2px', background: 'var(--gray-100)', margin: '0 0.5rem' }} />

                {/* Resumen */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  <span>Total: <strong style={{ color: 'var(--primary-700)' }}>{totalCitasMes}</strong> confirmadas</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '8px', height: '8px', background: 'linear-gradient(180deg, var(--primary-400) 0%, var(--primary-600) 100%)', borderRadius: '2px', display: 'inline-block' }} />
                      Día
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '8px', height: '8px', background: 'linear-gradient(180deg, var(--accent-400) 0%, var(--accent-600) 100%)', borderRadius: '2px', display: 'inline-block' }} />
                      Hoy
                    </span>
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </main>

      {/* ── Modales con formularios reutilizables ── */}
      {modalPaciente && (
        <Modal titulo="Nuevo paciente" onClose={() => setModalPaciente(false)}>
          <FormPaciente
            onSubmit={handlePacienteSubmit}
            onCancel={() => setModalPaciente(false)}
            loading={formPacienteLoading}
          />
        </Modal>
      )}

      {modalCita && (
        <Modal titulo="Nueva cita" onClose={() => setModalCita(false)}>
          <FormCita
            pacientes={pacientes}
            onSubmit={handleCitaSubmit}
            onCancel={() => setModalCita(false)}
            loading={citaEnviando}
            onCrearNuevoPaciente={handleCrearNuevoPaciente}
          />
        </Modal>
      )}

      {modalConsulta && (
        <Modal titulo="Nueva consulta" onClose={() => setModalConsulta(false)}>
          <FormHistoriaClinica
            pacientes={pacientes}
            onSubmit={handleConsultaSubmit}
            onCancel={() => setModalConsulta(false)}
            loading={consultaEnviando}
          />
        </Modal>
      )}

      {modalFactura && (
        <Modal titulo="Nueva factura" onClose={() => setModalFactura(false)}>
          <FormFactura
            pacientes={pacientes}
            onSubmit={handleFacturaSubmit}
            onCancel={() => setModalFactura(false)}
            loading={facturaEnviando}
          />
        </Modal>
      )}
    </div>
  );
}

// Importar useAuth
import { useAuth } from '../hooks/useAuth';

export default Dashboard;
