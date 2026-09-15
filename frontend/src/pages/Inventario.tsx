/**
 * Página de gestión de Inventario.
 * Incluye CRUD de productos y movimientos de stock.
 */
import { useState, useEffect, useCallback } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { formatearFecha } from '../utils/fecha';
import apiClient from '../api/client';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

// ── Tipos ──

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  stock_actual: string;
  stock_minimo: string;
  stock_maximo: string | null;
  unidad_medida: string;
  precio_coste: string;
  precio_venta: string;
  proveedor: string | null;
  referencia_proveedor: string | null;
  ubicacion: string | null;
  stock_bajo: boolean;
  margen_ganancia: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Movimiento {
  id: number;
  producto_id: number;
  tipo: string;
  cantidad: string;
  motivo: string | null;
  stock_anterior: string;
  stock_nuevo: string;
  usuario_id: number | null;
  documento_referencia: string | null;
  created_at: string;
}

interface Estadisticas {
  total_productos: number;
  productos_stock_bajo: number;
  valoracion_total: string;
  entradas_mes: string;
  salidas_mes: string;
  productos_categoria: Record<string, number>;
}

const CATEGORIAS = [
  { value: 'material_cura', label: 'Material de cura' },
  { value: 'instrumental', label: 'Instrumental' },
  { value: 'ortesis', label: 'Órtesis' },
  { value: 'calzado_terapeutico', label: 'Calzado terapéutico' },
  { value: 'cosmetica_pies', label: 'Cosmética pies' },
  { value: 'desinfectante', label: 'Desinfectante' },
  { value: 'proteccion', label: 'Protección' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'otro', label: 'Otro' },
];

const UNIDADES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'ml', label: 'Mililitros' },
  { value: 'g', label: 'Gramos' },
  { value: 'par', label: 'Par' },
];

const TIPOS_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'devolucion', label: 'Devolución' },
];

const getCategoriaLabel = (value: string) => {
  return CATEGORIAS.find(c => c.value === value)?.label || value;
};

const getUnidadLabel = (value: string) => {
  return UNIDADES.find(u => u.value === value)?.label || value;
};

const getMovimientoColor = (tipo: string) => {
  const colores: Record<string, string> = {
    entrada: 'var(--success-500)',
    salida: 'var(--danger-500)',
    ajuste: 'var(--warning-500)',
    devolucion: 'var(--primary-500)',
  };
  return colores[tipo] || 'var(--gray-500)';
};

// ── Componente principal ──

function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStockBajo, setFiltroStockBajo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [tabActiva, setTabActiva] = useState<'productos' | 'movimientos'>('productos');

  // Modales
  const [modalProductoVisible, setModalProductoVisible] = useState(false);
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);

  useScrollLock(modalProductoVisible || modalMovimientoVisible || modalDetalleVisible);

  // Formulario producto
  const [formProducto, setFormProducto] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'otro',
    stock_minimo: '5',
    stock_maximo: '',
    unidad_medida: 'unidad',
    precio_coste: '0',
    precio_venta: '0',
    proveedor: '',
    referencia_proveedor: '',
    ubicacion: '',
  });

  // Formulario movimiento
  const [formMovimiento, setFormMovimiento] = useState({
    producto_id: 0,
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    documento_referencia: '',
  });

  // Cargar datos
  const cargarProductos = useCallback(async () => {
    try {
      setCargando(true);
      const params = new URLSearchParams({
        pagina: String(pagina),
        por_pagina: '20',
      });
      if (busqueda) params.set('busqueda', busqueda);
      if (filtroCategoria) params.set('categoria', filtroCategoria);
      if (filtroStockBajo !== '') params.set('stock_bajo', filtroStockBajo);

      const res = await apiClient.get(`/inventario/productos?${params}`);
      setProductos(res.data.productos);
      setTotalPaginas(Math.ceil(res.data.total / 20));
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda, filtroCategoria, filtroStockBajo]);

  const cargarMovimientos = useCallback(async () => {
    try {
      const res = await apiClient.get('/inventario/movimientos?por_pagina=50');
      setMovimientos(res.data.movimientos);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    try {
      const res = await apiClient.get('/inventario/estadisticas');
      setEstadisticas(res.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarEstadisticas();
  }, [cargarProductos, cargarEstadisticas]);

  useEffect(() => {
    if (tabActiva === 'movimientos') {
      cargarMovimientos();
    }
  }, [tabActiva, cargarMovimientos]);

  // Handlers
  const abrirModalNuevo = () => {
    setProductoEditando(null);
    setFormProducto({
      nombre: '',
      descripcion: '',
      categoria: 'otro',
      stock_minimo: '5',
      stock_maximo: '',
      unidad_medida: 'unidad',
      precio_coste: '0',
      precio_venta: '0',
      proveedor: '',
      referencia_proveedor: '',
      ubicacion: '',
    });
    setModalProductoVisible(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setFormProducto({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      categoria: producto.categoria,
      stock_minimo: producto.stock_minimo,
      stock_maximo: producto.stock_maximo || '',
      unidad_medida: producto.unidad_medida,
      precio_coste: producto.precio_coste,
      precio_venta: producto.precio_venta,
      proveedor: producto.proveedor || '',
      referencia_proveedor: producto.referencia_proveedor || '',
      ubicacion: producto.ubicacion || '',
    });
    setModalProductoVisible(true);
  };

  const abrirModalMovimiento = (producto: Producto) => {
    setProductoDetalle(producto);
    setFormMovimiento({
      producto_id: producto.id,
      tipo: 'entrada',
      cantidad: '',
      motivo: '',
      documento_referencia: '',
    });
    setModalMovimientoVisible(true);
  };

  const abrirDetalle = (producto: Producto) => {
    setProductoDetalle(producto);
    setModalDetalleVisible(true);
  };

  const guardarProducto = async () => {
    try {
      if (productoEditando) {
        await apiClient.put(`/inventario/productos/${productoEditando.id}`, formProducto);
      } else {
        await apiClient.post('/inventario/productos', formProducto);
      }
      setModalProductoVisible(false);
      cargarProductos();
      cargarEstadisticas();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error guardando producto');
    }
  };

  const eliminarProducto = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await apiClient.delete(`/inventario/productos/${id}`);
      cargarProductos();
      cargarEstadisticas();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error eliminando producto');
    }
  };

  const guardarMovimiento = async () => {
    try {
      await apiClient.post('/inventario/movimientos', {
        ...formMovimiento,
        cantidad: parseFloat(formMovimiento.cantidad),
      });
      setModalMovimientoVisible(false);
      cargarProductos();
      cargarMovimientos();
      cargarEstadisticas();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error registrando movimiento');
    }
  };

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Header titulo="Inventario" icono="📦">
          <button onClick={abrirModalNuevo} className="btn btn-primary">
            + Nuevo producto
          </button>
        </Header>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid">
            <div className="card">
              <h3>📦 Total productos</h3>
              <p style={{ fontSize: '2rem', color: 'var(--primary-700)' }}>{estadisticas.total_productos}</p>
              <p style={{ color: 'var(--gray-500)' }}>En catálogo</p>
            </div>
            <div className="card">
              <h3>⚠️ Stock bajo</h3>
              <p style={{ fontSize: '2rem', color: 'var(--danger-500)' }}>{estadisticas.productos_stock_bajo}</p>
              <p style={{ color: 'var(--gray-500)' }}>Requieren reposición</p>
            </div>
            <div className="card">
              <h3>💰 Valoración</h3>
              <p style={{ fontSize: '2rem', color: 'var(--primary-700)' }}>{parseFloat(estadisticas.valoracion_total).toFixed(2)} €</p>
              <p style={{ color: 'var(--gray-500)' }}>Coste total inventario</p>
            </div>
            <div className="card">
              <h3>📊 Movimientos mes</h3>
              <p style={{ fontSize: '1.4rem', color: 'var(--success-600)' }}>↑ {parseFloat(estadisticas.entradas_mes || '0').toFixed(0)}</p>
              <p style={{ fontSize: '1.4rem', color: 'var(--danger-500)' }}>↓ {parseFloat(estadisticas.salidas_mes || '0').toFixed(0)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="card">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className={`btn ${tabActiva === 'productos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('productos')}
            >
              Productos
            </button>
            <button
              className={`btn ${tabActiva === 'movimientos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTabActiva('movimientos')}
            >
              Movimientos
            </button>
          </div>

          {tabActiva === 'productos' && (
            <>
              {/* Filtros */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                  style={{ flex: 1, minWidth: '200px', padding: '0.6rem 1rem', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}
                />
                <select
                  value={filtroCategoria}
                  onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1); }}
                  style={{ padding: '0.6rem 1rem', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <select
                  value={filtroStockBajo}
                  onChange={(e) => { setFiltroStockBajo(e.target.value); setPagina(1); }}
                  style={{ padding: '0.6rem 1rem', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-lg)' }}
                >
                  <option value="">Todo el stock</option>
                  <option value="true">Solo stock bajo</option>
                  <option value="false">Stock normal</option>
                </select>
              </div>

              {/* Tabla productos */}
              {cargando ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-500)' }}>Cargando...</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio coste</th>
                        <th>Precio venta</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto.id} style={producto.stock_bajo ? { backgroundColor: 'var(--danger-50)' } : undefined}>
                          <td><code style={{ background: 'var(--gray-100)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>{producto.codigo}</code></td>
                          <td>
                            <strong>{producto.nombre}</strong>
                            {producto.stock_bajo && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--danger-500)' }}>⚠️ Bajo</span>}
                          </td>
                          <td>{getCategoriaLabel(producto.categoria)}</td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{parseFloat(producto.stock_actual).toFixed(0)}</span>
                            <span style={{ color: 'var(--gray-500)', marginLeft: '0.25rem' }}>{getUnidadLabel(producto.unidad_medida)}</span>
                            <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem', display: 'block' }}>Mín: {parseFloat(producto.stock_minimo).toFixed(0)}</span>
                          </td>
                          <td>{parseFloat(producto.precio_coste).toFixed(2)} €</td>
                          <td>{parseFloat(producto.precio_venta).toFixed(2)} €</td>
                          <td>{producto.proveedor || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => abrirDetalle(producto)} className="btn btn-sm btn-secondary" title="Ver detalle">👁️</button>
                              <button onClick={() => abrirModalEditar(producto)} className="btn btn-sm btn-secondary" title="Editar">✏️</button>
                              <button onClick={() => abrirModalMovimiento(producto)} className="btn btn-sm btn-primary" title="Movimiento">📦</button>
                              <button onClick={() => eliminarProducto(producto.id)} className="btn btn-sm btn-danger" title="Eliminar">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="pagination">
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                    <button key={p} className={p === pagina ? 'active' : ''} onClick={() => setPagina(p)}>{p}</button>
                  ))}
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
                </div>
              )}
            </>
          )}

          {tabActiva === 'movimientos' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Stock antes</th>
                    <th>Stock después</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{formatearFecha(mov.created_at)}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'white',
                          backgroundColor: getMovimientoColor(mov.tipo),
                        }}>
                          {TIPOS_MOVIMIENTO.find(t => t.value === mov.tipo)?.label || mov.tipo}
                        </span>
                      </td>
                      <td>{mov.producto_id}</td>
                      <td>{parseFloat(mov.cantidad).toFixed(0)}</td>
                      <td>{parseFloat(mov.stock_anterior).toFixed(0)}</td>
                      <td>{parseFloat(mov.stock_nuevo).toFixed(0)}</td>
                      <td>{mov.motivo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Producto */}
      {modalProductoVisible && (
        <div className="modal-overlay" onClick={() => setModalProductoVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{productoEditando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Nombre *</label>
                <input type="text" value={formProducto.nombre} onChange={(e) => setFormProducto({...formProducto, nombre: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <textarea value={formProducto.descripcion} onChange={(e) => setFormProducto({...formProducto, descripcion: e.target.value})} rows={2} />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={formProducto.categoria} onChange={(e) => setFormProducto({...formProducto, categoria: e.target.value})}>
                  {CATEGORIAS.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unidad de medida</label>
                <select value={formProducto.unidad_medida} onChange={(e) => setFormProducto({...formProducto, unidad_medida: e.target.value})}>
                  {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Stock mínimo</label>
                <input type="number" value={formProducto.stock_minimo} onChange={(e) => setFormProducto({...formProducto, stock_minimo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Stock máximo</label>
                <input type="number" value={formProducto.stock_maximo} onChange={(e) => setFormProducto({...formProducto, stock_maximo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Precio coste (€)</label>
                <input type="number" step="0.01" value={formProducto.precio_coste} onChange={(e) => setFormProducto({...formProducto, precio_coste: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Precio venta (€)</label>
                <input type="number" step="0.01" value={formProducto.precio_venta} onChange={(e) => setFormProducto({...formProducto, precio_venta: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Proveedor</label>
                <input type="text" value={formProducto.proveedor} onChange={(e) => setFormProducto({...formProducto, proveedor: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Referencia proveedor</label>
                <input type="text" value={formProducto.referencia_proveedor} onChange={(e) => setFormProducto({...formProducto, referencia_proveedor: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Ubicación</label>
                <input type="text" value={formProducto.ubicacion} onChange={(e) => setFormProducto({...formProducto, ubicacion: e.target.value})} />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setModalProductoVisible(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={guardarProducto} className="btn btn-primary">{productoEditando ? 'Guardar cambios' : 'Crear producto'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {modalMovimientoVisible && (
        <div className="modal-overlay" onClick={() => setModalMovimientoVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Movimiento de stock</h2>
            {productoDetalle && (
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
                <strong>{productoDetalle.nombre}</strong>
                <span style={{ marginLeft: '1rem', color: 'var(--gray-500)' }}>Stock actual: <strong>{parseFloat(productoDetalle.stock_actual).toFixed(0)}</strong> {getUnidadLabel(productoDetalle.unidad_medida)}</span>
              </div>
            )}
            <div className="form-group">
              <label>Tipo de movimiento *</label>
              <select value={formMovimiento.tipo} onChange={(e) => setFormMovimiento({...formMovimiento, tipo: e.target.value})}>
                {TIPOS_MOVIMIENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cantidad *</label>
              <input type="number" value={formMovimiento.cantidad} onChange={(e) => setFormMovimiento({...formMovimiento, cantidad: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Motivo</label>
              <input type="text" value={formMovimiento.motivo} onChange={(e) => setFormMovimiento({...formMovimiento, motivo: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Documento referencia</label>
              <input type="text" value={formMovimiento.documento_referencia} onChange={(e) => setFormMovimiento({...formMovimiento, documento_referencia: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setModalMovimientoVisible(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={guardarMovimiento} className="btn btn-primary">Registrar movimiento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {modalDetalleVisible && productoDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalleVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{productoDetalle.nombre}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><strong>Código:</strong> {productoDetalle.codigo}</div>
              <div><strong>Categoría:</strong> {getCategoriaLabel(productoDetalle.categoria)}</div>
              <div><strong>Stock actual:</strong> {parseFloat(productoDetalle.stock_actual).toFixed(0)} {getUnidadLabel(productoDetalle.unidad_medida)}</div>
              <div><strong>Stock mínimo:</strong> {parseFloat(productoDetalle.stock_minimo).toFixed(0)}</div>
              <div><strong>Precio coste:</strong> {parseFloat(productoDetalle.precio_coste).toFixed(2)} €</div>
              <div><strong>Precio venta:</strong> {parseFloat(productoDetalle.precio_venta).toFixed(2)} €</div>
              <div><strong>Proveedor:</strong> {productoDetalle.proveedor || '—'}</div>
              <div><strong>Ubicación:</strong> {productoDetalle.ubicacion || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Descripción:</strong> {productoDetalle.descripcion || '—'}</div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setModalDetalleVisible(false)} className="btn btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;
