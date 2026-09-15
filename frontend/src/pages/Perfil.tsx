/**
 * Página de perfil del usuario logado.
 * Usa el Sidebar centralizado y permite editar datos del usuario.
 */
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';

function Perfil() {
  const { user } = useAuth();
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    if (!formData.full_name.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre completo es obligatorio' });
      return;
    }
    if (!formData.email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El email es obligatorio' });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      await apiClient.put(`/users/${user!.id}`, {
        full_name: formData.full_name,
        email: formData.email,
      });
      setMensaje({ tipo: 'exito', texto: 'Cambios guardados correctamente' });
      setEditando(false);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al guardar cambios' });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    // Restaurar datos originales
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
    });
    setEditando(false);
    setMensaje(null);
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Mi perfil" icono="👤" />

        {/* Mensaje de estado */}
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

        <div className="card" style={{ maxWidth: '600px' }}>
          {/* Avatar y nombre */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'white',
              margin: '0 auto 1rem',
            }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3>{user?.full_name || 'Usuario'}</h3>
            <span className="badge badge-info">{user?.role || 'Sin rol'}</span>
          </div>

          {/* Formulario */}
          <div className="form-group">
            <label>Nombre completo *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              disabled={!editando}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!editando}
            />
          </div>

          <div className="form-group">
            <label>Nombre de usuario</label>
            <input type="text" value={user?.username || ''} disabled />
          </div>

          <div className="form-group">
            <label>Rol</label>
            <input type="text" value={user?.role || ''} disabled />
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            {editando ? (
              <>
                <button className="btn btn-secondary" onClick={handleCancelar} disabled={guardando}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setEditando(true)}>
                ✏️ Editar perfil
              </button>
            )}
          </div>
        </div>

        {/* Sección: Seguridad */}
        <div className="card" style={{ maxWidth: '600px', marginTop: '1.5rem' }}>
          <h3>🔒 Seguridad</h3>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Opciones de seguridad y acceso a tu cuenta.
          </p>
          <button className="btn btn-secondary" disabled>
            Restablecer contraseña (próximamente)
          </button>
        </div>
      </main>
    </div>
  );
}

export default Perfil;
