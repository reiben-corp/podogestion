import { useState, useEffect } from 'react';
import { formatearFecha } from '../utils/fecha';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FormFactura from '../components/FormFactura';
import { useAuth } from '../hooks/useAuth';
import { useScrollLock } from '../hooks/useScrollLock';

interface Documento {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  paciente_id: number;
  paciente_nombre?: string;
  profesional_nombre?: string;
  fecha_emision: string;
  base_imponible: number;
  iva_importe: number;
  total: number;
  pagado: boolean;
  lineas: any[];
}

interface CajaHoy {
  id: number;
  fecha: string;
  saldo_inicial: number;
  total_ingresos: number;
  total_gastos: number;
  saldo_final: number;
  cerrada: boolean;
}

function Facturacion() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cajaHoy, setCajaHoy] = useState<CajaHoy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);

  const { user: _user } = useAuth();

  useScrollLock(mostrarModal);

  const cargarDocumentos = async () => {
    try {
      const response = await apiClient.get('/facturacion?por_pagina=50');
      setDocumentos(response.data.documentos || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const cargarPacientes = async () => {
    try {
      const response = await apiClient.get('/pacientes?por_pagina=100');
      setPacientes(response.data.pacientes || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  const cargarCaja = async () => {
    try {
      const response = await apiClient.get('/facturacion/caja/hoy');
      setCajaHoy(response.data);
    } catch (error) {
      console.error('Error cargando caja:', error);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      await Promise.all([cargarDocumentos(), cargarPacientes(), cargarCaja()]);
      setCargando(false);
    };
    cargar();
  }, []);

  const cobrarDocumento = async (documentoId: number, metodoPago: string) => {
    try {
      await apiClient.post(`/facturacion/${documentoId}/cobrar`, null, {
        params: { metodo_pago: metodoPago }
      });
      cargarDocumentos();
      cargarCaja();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al cobrar');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const clases: Record<string, string> = {
      borrador: 'badge-secondary',
      pendiente: 'badge-warning',
      aceptado: 'badge-info',
      rechazado: 'badge-danger',
      facturado: 'badge-info',
      cobrado: 'badge-success',
      anulado: 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Facturación" icono="💰">
          <button onClick={() => setMostrarModal(true)} className="btn btn-primary">
            + Nuevo Documento
          </button>
        </Header>

        {/* Caja del día */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary-50) 0%, white 100%)' }}>
          <h3>💰 Caja del Día</h3>
          {cajaHoy && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: '#666', fontSize: '0.8rem' }}>Saldo Inicial</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Number(cajaHoy.saldo_inicial).toFixed(2)} €</p>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: '#666', fontSize: '0.8rem' }}>Ingresos</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-500)' }}>{Number(cajaHoy.total_ingresos).toFixed(2)} €</p>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: '#666', fontSize: '0.8rem' }}>Gastos</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger-500)' }}>{Number(cajaHoy.total_gastos).toFixed(2)} €</p>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ color: '#666', fontSize: '0.8rem' }}>Saldo Final</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600)' }}>{Number(cajaHoy.saldo_final).toFixed(2)} €</p>
              </div>
            </div>
          )}
        </div>


        {/* Tabla de documentos */}
        {cargando ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#666' }}>Cargando documentos...</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#666' }}>No hay documentos de facturación</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nº Documento</th>
                  <th>Tipo</th>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Base</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.numero}</td>
                    <td>
                      <span className={`badge ${doc.tipo === 'factura' ? 'badge-info' : 'badge-warning'}`}>
                        {doc.tipo}
                      </span>
                    </td>
                    <td>{doc.paciente_nombre || 'N/A'}</td>
                    <td>{formatearFecha(doc.fecha_emision)}</td>
                    <td>{Number(doc.base_imponible).toFixed(2)} €</td>
                    <td>{Number(doc.iva_importe).toFixed(2)} €</td>
                    <td><strong>{Number(doc.total).toFixed(2)} €</strong></td>
                    <td>
                      <span className={`badge ${getEstadoBadge(doc.estado)}`}>
                        {doc.estado}
                      </span>
                    </td>
                    <td>
                      {doc.estado !== 'cobrado' && doc.estado !== 'anulado' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => cobrarDocumento(doc.id, 'efectivo')}
                            className="btn btn-success btn-sm"
                            title="Cobrar en efectivo"
                          >
                            💵
                          </button>
                          <button
                            onClick={() => cobrarDocumento(doc.id, 'tarjeta')}
                            className="btn btn-primary btn-sm"
                            title="Cobrar con tarjeta"
                          >
                            💳
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal para nuevo documento */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>Nuevo Documento</h2>
            <FormFactura
              pacientes={pacientes}
              onSubmit={async (data) => {
                await apiClient.post('/facturacion', { ...data, profesional_id: 1 });
                setMostrarModal(false);
                cargarDocumentos();
                cargarCaja();
              }}
              onCancel={() => setMostrarModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Facturacion;
