import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import HistoriaClinica from './pages/HistoriaClinica';
import Facturacion from './pages/Facturacion';
import Inventario from './pages/Inventario';
import Informes from './pages/Informes';
import Admin from './pages/Admin';
import Configuracion from './pages/Configuracion';
import Perfil from './pages/Perfil';

function App() {
  const { token, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Error verificando autenticación:', error);
      } finally {
        setIsChecking(false);
      }
    };
    verify();
  }, []);

  if (isChecking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--secondary-100) 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-700)', marginBottom: '1rem' }}>🏥 Clínica Podología</h1>
          <p style={{ color: 'var(--gray-600)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/pacientes" element={token ? <Pacientes /> : <Navigate to="/login" />} />
        <Route path="/citas" element={token ? <Citas /> : <Navigate to="/login" />} />
        <Route path="/historia-clinica" element={token ? <HistoriaClinica /> : <Navigate to="/login" />} />
        <Route path="/facturacion" element={token ? <Facturacion /> : <Navigate to="/login" />} />
        <Route path="/inventario" element={token ? <Inventario /> : <Navigate to="/login" />} />
        <Route path="/informes" element={token ? <Informes /> : <Navigate to="/login" />} />
        <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
        <Route path="/configuracion" element={token ? <Configuracion /> : <Navigate to="/login" />} />
        <Route path="/perfil" element={token ? <Perfil /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;