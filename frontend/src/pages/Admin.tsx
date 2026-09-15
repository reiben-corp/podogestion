/**
 * Módulo de Administración del Portal.
 * Solo accesible para usuarios con rol 'admin'.
 */
import { useState, useEffect } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { formatearFecha } from '../utils/fecha';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';

// ── Tipos ──

interface Usuario {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface Estadisticas {
  total_usuarios: number;
  usuarios_activos: number;
  total_pacientes: number;
  total_citas: number;
  total_historias: number;
  total_documentos: number;
  total_productos: number;
}

interface AuditoriaEvento {
  tipo: string;
  descripcion: string;
  fecha: string;
  icono: string;
  enlace: string;
  entidad: string;
  id_entidad: number;
}

// ── Componente Modal Simple ──

interface ModalProps {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ titulo, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Componente Principal ──

type SeccionAdmin = 'inicio' | 'usuarios' | 'estadisticas' | 'seguridad';

function Admin() {
  const { user } = useAuth();
  const [seccion, setSeccion] = useState<SeccionAdmin>('inicio');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaEvento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'asistente' as 'admin' | 'medico' | 'asistente'
  });

  const esAdmin = user?.role === 'admin';

  useScrollLock(!!mostrarModal || !!usuarioEditando);

  const cargarUsuarios = async () => {
    try {
      const params = new URLSearchParams({ por_pagina: '50' });
      if (busqueda) params.set('busqueda', busqueda);
      const res = await apiClient.get(`/admin/usuarios?${params}`);
      setUsuarios(res.data.usuarios);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error cargando usuarios' });
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const res = await apiClient.get('/admin/estadisticas');
      setEstadisticas(res.data);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error cargando estadísticas' });
    }
  };

  const cargarAuditoria = async () => {
    try {
      const res = await apiClient.get('/estadisticas/auditoria?limite=20');
      setAuditoria(res.data.eventos || []);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error cargando auditoría' });
    }
  };

  useEffect(() => {
    if (seccion === 'usuarios') {
      setCargando(true);
      cargarUsuarios().finally(() => setCargando(false));
    } else if (seccion === 'estadisticas') {
      setCargando(true);
      cargarEstadisticas().finally(() => setCargando(false));
    } else if (seccion === 'seguridad') {
      setCargando(true);
      cargarAuditoria().finally(() => setCargando(false));
    }
  }, [seccion, busqueda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (usuarioEditando) {
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
        };
        if (formData.password) updateData.password = formData.password;
        
        await apiClient.put(`/admin/usuarios/${usuarioEditando.id}`, updateData);
        setMensaje({ tipo: 'exito', texto: 'Usuario actualizado correctamente' });
      } else {
        await apiClient.post('/admin/usuarios', formData);
        setMensaje({ tipo: 'exito', texto: 'Usuario creado correctamente' });
      }
      setMostrarModal(false);
      setUsuarioEditando(null);
      setFormData({ username: '', email: '', full_name: '', password: '', role: 'asistente' });
      cargarUsuarios();
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al guardar usuario' });
    }
  };

  const editarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      username: usuario.username,
      email: usuario.email,
      full_name: usuario.full_name,
      password: '',
      role: usuario.role as any
    });
    setMostrarModal(true);
  };

  const eliminarUsuario = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    try {
      await apiClient.delete(`/admin/usuarios/${id}`);
      setMensaje({ tipo: 'exito', texto: 'Usuario desactivado' });
      cargarUsuarios();
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al eliminar usuario' });
    }
  };

  const abrirModalNuevo = () => {
    setUsuarioEditando(null);
    setFormData({ username: '', email: '', full_name: '', password: '', role: 'asistente' });
    setMostrarModal(true);
  };

  const getRoleBadge = (role: string) => {
    const clases: Record<string, string> = {
      admin: 'badge-danger',
      medico: 'badge-info',
      asistente: 'badge-secondary'
    };
    return clases[role] || 'badge-secondary';
  };

  const getRoleTexto = (role: string) => {
    const textos: Record<string, string> = {
      admin: 'Administrador',
      medico: 'Médico',
      asistente: 'Asistente'
    };
    return textos[role] || role;
  };

  const getTipoTexto = (tipo: string): string => {
    const textos: Record<string, string> = {
      paciente_alta: 'Alta paciente',
      paciente_editado: 'Paciente editado',
      paciente_deshabilitado: 'Paciente deshabilitado',
      cita_creada: 'Cita creada',
      cita_editada: 'Cita editada',
      cita_eliminada: 'Cita eliminada',
      consulta_creada: 'Consulta creada',
    };
    return textos[tipo] || tipo;
  };

  if (!esAdmin) {
    return (
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>🚫 Acceso Denegado</h2>
            <p style={{ color: '#666', marginTop: '1rem' }}>
              No tienes permisos para acceder a este módulo.
              <br />
              Solo los usuarios con rol <strong>Administrador</strong> pueden acceder.
            </p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Volver al Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <div className="header">
          <h2>⚙️ Administración del Portal</h2>
          {seccion !== 'inicio' && (
            <button className="btn btn-secondary" onClick={() => setSeccion('inicio')}>
              ← Volver
            </button>
          )}
        </div>

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

        {/* ── PÁGINA PRINCIPAL: Opciones del Portal ── */}
        {seccion === 'inicio' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>👥</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Usuarios</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>Gestión de usuarios del portal</p>
              <button className="btn btn-primary btn-sm" onClick={() => setSeccion('usuarios')}>
                Acceder
              </button>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📊</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Estadísticas</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>KPIs y métricas generales</p>
              <button className="btn btn-primary btn-sm" onClick={() => setSeccion('estadisticas')}>
                Acceder
              </button>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>🔒</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Seguridad</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>Auditoría y registro de cambios</p>
              <button className="btn btn-primary btn-sm" onClick={() => setSeccion('seguridad')}>
                Acceder
              </button>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💾</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Backup BBDD</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>Copias de seguridad</p>
              <button className="btn btn-secondary btn-sm" disabled>
                Próximamente
              </button>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📧</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Notificaciones</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>Emails y alertas</p>
              <button className="btn btn-secondary btn-sm" disabled>
                Próximamente
              </button>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>⚙️</p>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Configuración</h3>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: '0.5rem 0' }}>Ajustes generales</p>
              <Link to="/configuracion" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Acceder
              </Link>
            </div>
          </div>
        )}

        {/* ── SECCIÓN: Gestión de Usuarios ── */}
        {seccion === 'usuarios' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>👥 Gestión de Usuarios</h3>
              <button onClick={abrirModalNuevo} className="btn btn-primary">+ Nuevo Usuario</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Buscar por nombre, username o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            {cargando ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando...</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Nombre completo</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id}>
                        <td><strong>{usuario.username}</strong></td>
                        <td>{usuario.full_name}</td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className={`badge ${getRoleBadge(usuario.role)}`}>
                            {getRoleTexto(usuario.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${usuario.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {usuario.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => editarUsuario(usuario)} 
                              className="btn btn-secondary btn-sm"
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => eliminarUsuario(usuario.id)} 
                              className="btn btn-danger btn-sm"
                              disabled={usuario.id === user?.id}
                              title={usuario.id === user?.id ? 'No puedes eliminarte a ti mismo' : 'Desactivar usuario'}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SECCIÓN: Estadísticas ── */}
        {seccion === 'estadisticas' && (
          cargando ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#666' }}>Cargando...</p>
            </div>
          ) : estadisticas ? (
            <div className="card">
              <h3>📊 Estadísticas del Portal</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Usuarios totales</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_usuarios}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Usuarios activos</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-600)' }}>{estadisticas.usuarios_activos}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Pacientes</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_pacientes}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Citas</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_citas}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Historias clínicas</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_historias}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Documentos</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_documentos}</p>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Productos inventario</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>{estadisticas.total_productos}</p>
                </div>
              </div>
            </div>
          ) : null
        )}

        {/* ── SECCIÓN: Seguridad / Auditoría ── */}
        {seccion === 'seguridad' && (
          <div className="card">
            <h3>🔒 Auditoría y Registro de Cambios</h3>
            <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Registro de acciones recientes sobre objetos de la base de datos.
            </p>

            {cargando ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando...</p>
            ) : auditoria.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Sin actividad registrada</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Entidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoria.map((ev, idx) => (
                      <tr key={idx}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatearFecha(ev.fecha)}
                        </td>
                        <td>
                          <span className="badge badge-secondary">
                            {ev.icono} {getTipoTexto(ev.tipo)}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{ev.descripcion}</td>
                        <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{ev.entidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {mostrarModal && (
        <Modal titulo={usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'} onClose={() => { setMostrarModal(false); setUsuarioEditando(null); }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username *</label>
              <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required disabled={!!usuarioEditando} minLength={3} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Nombre completo *</label>
              <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>{usuarioEditando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!usuarioEditando} minLength={8} />
            </div>
            <div className="form-group">
              <label>Rol *</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})} required>
                <option value="asistente">Asistente</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => { setMostrarModal(false); setUsuarioEditando(null); }} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary">{usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Admin;
