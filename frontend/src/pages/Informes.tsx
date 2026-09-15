/**
 * Módulo de Informes.
 * Incluye informes de: Pacientes, Facturación, Inventario, Citas.
 * Cada informe tiene KPIs, tablas y gráficas simples.
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

type TabType = 'pacientes' | 'facturacion' | 'inventario' | 'citas';

interface InformePacientes {
  total: number;
  nuevos_periodo: number;
  por_sexo: Record<string, number>;
  por_ciudad: Record<string, number>;
}

interface InformeFacturacion {
  total_facturado: number;
  total_cobrado: number;
  total_pendiente: number;
  num_facturas: number;
  num_presupuestos: number;
  porcentaje_cobrado: number;
}

interface InformeInventario {
  total_productos: number;
  productos_stock_bajo: number;
  valoracion_total: number;
  entradas_mes: number;
  salidas_mes: number;
  productos_categoria: Record<string, number>;
}

interface InformeCitas {
  total_citas: number;
  por_estado: Record<string, number>;
  porcentaje_asistencia: number;
  citas_mes: number;
}

function Informes() {
  const [tabActiva, setTabActiva] = useState<TabType>('pacientes');
  const [informePacientes, setInformePacientes] = useState<InformePacientes | null>(null);
  const [informeFacturacion, setInformeFacturacion] = useState<InformeFacturacion | null>(null);
  const [informeInventario, setInformeInventario] = useState<InformeInventario | null>(null);
  const [informeCitas, setInformeCitas] = useState<InformeCitas | null>(null);
  const [cargando, setCargando] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarInformePacientes = useCallback(async () => {
    try {
      setCargando(true);
      const res = await apiClient.get('/estadisticas/informe/pacientes');
      setInformePacientes(res.data);
    } catch (error) {
      console.error('Error cargando informe pacientes:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarInformeFacturacion = useCallback(async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fecha_inicio', fechaInicio);
      if (fechaFin) params.set('fecha_fin', fechaFin);
      const res = await apiClient.get(`/estadisticas/informe/facturacion?${params}`);
      setInformeFacturacion(res.data);
    } catch (error) {
      console.error('Error cargando informe facturación:', error);
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  const cargarInformeInventario = useCallback(async () => {
    try {
      setCargando(true);
      const res = await apiClient.get('/estadisticas/informe/inventario');
      setInformeInventario(res.data);
    } catch (error) {
      console.error('Error cargando informe inventario:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarInformeCitas = useCallback(async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams();
      if (fechaInicio) params.set('fecha_inicio', fechaInicio);
      if (fechaFin) params.set('fecha_fin', fechaFin);
      const res = await apiClient.get(`/estadisticas/informe/citas?${params}`);
      setInformeCitas(res.data);
    } catch (error) {
      console.error('Error cargando informe citas:', error);
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (tabActiva === 'pacientes') cargarInformePacientes();
    if (tabActiva === 'facturacion') cargarInformeFacturacion();
    if (tabActiva === 'inventario') cargarInformeInventario();
    if (tabActiva === 'citas') cargarInformeCitas();
  }, [tabActiva, cargarInformePacientes, cargarInformeFacturacion, cargarInformeInventario, cargarInformeCitas]);

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Informes" icono="📊" />

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className={`btn ${tabActiva === 'pacientes' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('pacientes')}
            >
              👤 Pacientes
            </button>
            <button
              className={`btn ${tabActiva === 'facturacion' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('facturacion')}
            >
              💰 Facturación
            </button>
            <button
              className={`btn ${tabActiva === 'inventario' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('inventario')}
            >
              📦 Inventario
            </button>
            <button
              className={`btn ${tabActiva === 'citas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('citas')}
            >
              📅 Citas
            </button>
          </div>

          {/* Filtros de fecha */}
          {(tabActiva === 'facturacion' || tabActiva === 'citas') && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={{ display: 'block', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={{ display: 'block', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '6px' }}
                />
              </div>
            </div>
          )}

          {/* Contenido informes */}
          {cargando && <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</p>}

          {!cargando && tabActiva === 'pacientes' && informePacientes && (
            <div>
              <div className="grid">
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Total pacientes</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{informePacientes.total}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Nuevos este período</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-600)' }}>{informePacientes.nuevos_periodo}</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <h4>Por sexo</h4>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {Object.entries(informePacientes.por_sexo).map(([sexo, count]) => (
                    <span key={sexo} className="badge badge-info">{sexo}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!cargando && tabActiva === 'facturacion' && informeFacturacion && (
            <div>
              <div className="grid">
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Total facturado</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{informeFacturacion.total_facturado} €</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Total cobrado</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-600)' }}>{informeFacturacion.total_cobrado} €</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Pendiente</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-500)' }}>{informeFacturacion.total_pendiente} €</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>% Cobrado</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{informeFacturacion.porcentaje_cobrado}%</p>
                </div>
              </div>
            </div>
          )}

          {!cargando && tabActiva === 'inventario' && informeInventario && (
            <div>
              <div className="grid">
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Total productos</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{informeInventario.total_productos}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Stock bajo</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-500)' }}>{informeInventario.productos_stock_bajo}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Valoración</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{informeInventario.valoracion_total} €</p>
                </div>
              </div>
            </div>
          )}

          {!cargando && tabActiva === 'citas' && informeCitas && (
            <div>
              <div className="grid">
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Total citas</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{informeCitas.total_citas}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>Este mes</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-600)' }}>{informeCitas.citas_mes}</p>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666' }}>% Asistencia</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700 }}>{informeCitas.porcentaje_asistencia}%</p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <h4>Por estado</h4>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(informeCitas.por_estado).map(([estado, count]) => (
                    <span key={estado} className="badge badge-info">{estado}: {count}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Informes;
