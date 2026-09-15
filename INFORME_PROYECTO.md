# 📋 Informe de Situación del Proyecto
## Portal de Gestión para Clínica de Podología

---

## 1. Estado General

| Aspecto | Estado |
|---------|--------|
| **Proyecto** | En desarrollo activo |
| **Versión** | 0.1.0 |
| **Última actualización** | Septiembre 2026 |
| **Entorno local** | Funcional (Docker Compose) |

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Backend** | Python + FastAPI | Async/await nativo, validación Pydantic, OpenAPI automático, seguridad JWT |
| **Base de datos** | PostgreSQL 16 | JSONB para campos flexibles, índices GIN, Row-Level Security |
| **Frontend** | React 18 + Vite | SPA rápido, hot-reload, TypeScript |
| **Estado global** | Zustand | Ligero, sin boilerplate |
| **Cliente HTTP** | Axios | Interceptores JWT, manejo de errores 401 |
| **Contenedores** | Docker + Docker Compose | Entorno reproducible, 3 servicios (backend, frontend, db) |
| **Diseño** | Paleta Tailwind (#9df3e4) | Verde menta profesional, iconos SVG inline |

---

## 3. Módulos Completados

### 3.1 Autenticación ✅
- Login con JWT (token 8h)
- Registro de usuarios
- Roles: admin, médico, asistente
- Endpoint `/auth/me` para obtención de usuario actual

### 3.2 Pacientes ✅
- CRUD completo
- Ficha demográfica completa
- Número de historia automático: `POD-YYYY-XXXXX`
- Consentimientos GDPR/LOPD
- Editar paciente con modal completo
- Ficha con última consulta expandible

### 3.3 Citas ✅
- CRUD completo
- Agenda por día con filtros
- Estados: pendiente, confirmada, en curso, completada, cancelada, no asiste
- Verificación de disponibilidad del profesional

### 3.4 Historia Clínica ✅
- ID único asociado al paciente: `HC-00001-001`
- Estructura completa según referencia profesional:
  1. Motivo de consulta
  2. Antecedentes personales/familiares
  3. Exploración física
  4. Diagnóstico (con código CIAP-2)
  5. Plan de tratamiento
  6. Evolución / Notas de seguimiento
  7. Observaciones
- Podograma interactivo SVG (zonas clicables)
- Exploraciones biomecánicas (estática, dinámica, marcha, carrera, equilibrio)
- Tratamientos realizados

### 3.5 Facturación ✅
- Presupuestos: `PRE-YYYY-XXXXX` (correlativo por año)
- Facturas: `FAC-YYYY-XXXXX` (correlativo por año)
- Líneas de facturación con IVA, descuentos
- Caja diaria automática
- Cobros en efectivo/tarjeta con registro en caja
- Estadísticas de facturación

### 3.6 Diseño ✅
- Paleta verde menta basada en `#9df3e4`
- Iconos SVG inline (sin dependencias externas)
- Efectos visuales al seleccionar menú (brillo + sombra + escala)
- Responsive design
- Scrollbar estilizado

---

## 4. Módulos Pendientes

### 4.1 Inventario ⏳
**Descripción:** Gestión de material clínico

**Funcionalidades planificadas:**
- CRUD de productos/servicios
- Control de stock (mínimo, máximo)
- Alertas de stock bajo
- Trazabilidad (qué producto se usó en qué paciente)
- Gestión de proveedores
- Historial de movimientos

**Modelos previstos:**
```sql
productos (id, nombre, descripcion, precio, stock, stock_minimo, proveedor_id)
proveedores (id, nombre, contacto, telefono, email)
movimientos_stock (id, producto_id, tipo, cantidad, fecha, paciente_id)
```

### 4.2 Informes/Dashboard KPIs ⏳
**Descripción:** Cuadro de mando con estadísticas

**Funcionalidades planificadas:**
- KPIs en tiempo real (pacientes, citas, facturación)
- Gráficas de actividad mensual
- Exportación a PDF/Excel
- Informes por profesional

### 4.3 Mejoras de Seguridad y Producción ⏳
- HTTPS con nginx
- Backups automáticos de BD
- Auditoría de accesos (GDPR)
- Rate limiting
- Variables de entorno seguras

---

## 5. Estructura del Proyecto

```
clinica-podologia/
├── docker-compose.yml
├── .env
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile.dev
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic.ini
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │
│   └── app/
│       ├── main.py
│       │
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── security.py
│       │   └── dependencies.py
│       │
│       ├── models/
│       │   ├── user.py
│       │   ├── paciente.py
│       │   ├── cita.py
│       │   ├── historia_clinica.py
│       │   ├── facturacion.py
│       │   └── __init__.py
│       │
│       ├── schemas/
│       │   ├── user.py
│       │   ├── paciente.py
│       │   ├── cita.py
│       │   ├── historia_clinica.py
│       │   ├── facturacion.py
│       │   └── __init__.py
│       │
│       ├── routers/
│       │   ├── auth.py
│       │   ├── pacientes.py
│       │   ├── citas.py
│       │   ├── historias.py
│       │   ├── facturacion.py
│       │   └── __init__.py
│       │
│       └── services/
│           ├── auth_service.py
│           ├── cita_service.py
│           ├── historia_service.py
│           └── facturacion_service.py
│
├── frontend/
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       │
│       ├── api/
│       │   └── client.ts
│       │
│       ├── hooks/
│       │   └── useAuth.ts
│       │
│       ├── components/
│       │   └── Podograma.tsx
│       │
│       └── pages/
│           ├── Login.tsx
│           ├── Dashboard.tsx
│           ├── Pacientes.tsx
│           ├── Citas.tsx
│           ├── HistoriaClinica.tsx
│           └── Facturacion.tsx
│
├── nginx/
│   └── nginx.conf
│
└── scripts/
    ├── init-db.sh
    └── seed.py
```

---

## 6. Base de Datos

### Tablas actuales (11)

| Tabla | Descripción |
|-------|-------------|
| users | Usuarios del sistema |
| pacientes | Ficha de pacientes |
| citas | Citas médicas |
| historias_clinicas | Historias clínicas |
| exploraciones_biomecanicas | Exploraciones biomecánicas |
| tratamientos | Tratamientos realizados |
| podogramas | Podogramas (registro visual) |
| documentos_facturacion | Presupuestos y facturas |
| lineas_facturacion | Líneas de facturación |
| caja_diaria | Caja diaria |
| movimientos_caja | Movimientos de caja |

### Relaciones principales:
- `pacientes` 1:N `citas`, `historias_clinicas`, `documentos_facturacion`
- `historias_clinicas` 1:N `exploraciones_biomecanicas`, `tratamientos`, `podogramas`
- `documentos_facturacion` 1:N `lineas_facturacion`
- `caja_diaria` 1:N `movimientos_caja`

---

## 7. Endpoints API

### Autenticación
- `POST /api/auth/login` — Login con username/password
- `POST /api/auth/register` — Registro (requiere auth)
- `GET /api/auth/me` — Usuario actual

### Pacientes
- `POST /api/pacientes` — Crear
- `GET /api/pacientes` — Listar (paginado, búsqueda)
- `GET /api/pacientes/{id}` — Obtener
- `PUT /api/pacientes/{id}` — Actualizar
- `DELETE /api/pacientes/{id}` — Soft delete
- `GET /api/pacientes/{id}/ultima-consulta` — Última consulta

### Citas
- `POST /api/citas` — Crear (verifica disponibilidad)
- `GET /api/citas` — Listar (filtros: fecha, profesional, estado)
- `GET /api/citas/dia/{fecha}` — Agenda del día
- `GET /api/citas/{id}` — Obtener
- `PUT /api/citas/{id}` — Actualizar
- `PATCH /api/citas/{id}/estado` — Cambiar estado
- `DELETE /api/citas/{id}` — Soft delete

### Historia Clínica
- `POST /api/historias` — Crear (con exploraciones, tratamientos, podogramas)
- `GET /api/historias` — Listar (paginado, filtros)
- `GET /api/historias/{id}` — Obtener detalle completo
- `GET /api/historias/paciente/{id}` — Historias de un paciente
- `PUT /api/historias/{id}` — Actualizar
- `DELETE /api/historias/{id}` — Soft delete

### Facturación
- `POST /api/facturacion` — Crear presupuesto/factura
- `GET /api/facturacion` — Listar (filtros: tipo, estado, paciente)
- `GET /api/facturacion/{id}` — Obtener
- `PUT /api/facturacion/{id}` — Actualizar estado
- `POST /api/facturacion/{id}/cobrar` — Cobrar (+ registro caja)
- `DELETE /api/facturacion/{id}` — Soft delete
- `GET /api/facturacion/caja/hoy` — Caja del día
- `POST /api/facturacion/caja/movimiento` — Registrar movimiento
- `POST /api/facturacion/caja/cerrar` — Cerrar caja
- `GET /api/facturacion/estadisticas` — Estadísticas

---

## 8. Errores Corregidos Recientemente

| Error | Causa | Solución |
|-------|-------|----------|
| Iconos del menú duplicados | Emoji + SVG simultáneamente | Eliminados emoji, solo SVG inline |
| Faltaba Facturación en menú Citas | No se añadió al actualizar sidebar | Añadido enlace + icono |
| Sin botón editar paciente | No implementado | Añadido modal completo |
| Última consulta no expandible | Siempre mostraba todo | Añadido estado expandible/collapse |
| Import Link faltante | No importado en 3 páginas | Añadido `import { Link }` |
| Ruta `/estadisticas` capturada por `/{documento_id}` | Orden incorrecto de rutas | Reordenadas: estáticas primero |
| NameError LineaFacturacionCreate | No importado en servicio | Añadido import del schema |
| import.meta.env error | TypeScript no reconocía ImportMeta | Añadido `(import.meta as any)` |

---

## 9. Próximos Pasos Prioritarios

### Paso 1: Módulo Inventario
1. Crear modelos: `Producto`, `Proveedor`, `MovimientoStock`
2. Crear schemas Pydantic
3. Crear servicio de inventario
4. Crear router con endpoints CRUD
5. Crear página frontend con:
   - Tabla de productos
   - Alertas de stock bajo
   - Modal crear/editar producto
   - Historial de movimientos
6. Añadir al menú lateral

### Paso 2: Módulo Informes/Dashboard
1. Crear endpoint de estadísticas globales
2. Añadir gráficas al dashboard (Recharts o similar)
3. Exportación PDF/Excel

### Paso 3: Mejoras y Producción
1. Configurar HTTPS con nginx
2. Añadir backups automáticos
3. Implementar auditoría de accesos
4. Rate limiting
5. Tests unitarios y de integración

---

## 10. Comandos Útiles

```bash
# Levantar proyecto
cd /home/reiben/clinica-podologia
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicios
docker compose restart

# Crear usuario admin
docker exec clinica_backend python -c "
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash
Base.metadata.create_all(bind=engine)
db = SessionLocal()
admin = User(username='admin', email='admin@clinica.com',
             hashed_password=get_password_hash('admin123456'),
             full_name='Administrador', role='admin', is_active=True)
db.add(admin)
db.commit()
print('✅ Admin creado')
"

# Acceder al sistema
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
# Credenciales: admin / admin123456
```

---

## 11. Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Módulos completados** | 5 de 7 |
| **Módulos pendientes** | 2 (Inventario, Informes) |
| **Endpoints API** | 35+ |
| **Tablas BD** | 11 |
| **Páginas frontend** | 6 |
| **Líneas de código** | ~5000+ |
| **Estado general** | 🟢 Funcional y en desarrollo |

---

*Informe generado el 09/09/2026*
