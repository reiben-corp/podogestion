# 📋 Informe de Situación del Proyecto
## Portal de Gestión para Clínica de Podología (HealthTech)

---

## 1. Estado General

| Aspecto | Estado |
|---------|--------|
| **Proyecto** | En desarrollo activo |
| **Versión** | 0.2.0 |
| **Última actualización** | 15 de septiembre de 2026 |
| **Entorno local** | Funcional (Docker Compose) |
| **Repositorio remoto** | https://github.com/reiben-corp/podogestion |

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Backend** | Python + FastAPI | Async/await nativo, validación Pydantic, OpenAPI automático, seguridad JWT |
| **Base de datos** | PostgreSQL 16 | JSONB para campos flexibles, índices GIN, migraciones Alembic |
| **Frontend** | React 18 + Vite + TypeScript | SPA rápido, hot-reload, tipado estático |
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
- Endpoint `/auth/login` (OAuth2 compatible)
- Endpoint `/auth/register` (requiere auth)

### 3.2 Pacientes ✅
- CRUD completo
- Ficha demográfica completa
- **Código de paciente automático: `PAC-{id:05d}`** (renombrado de `numero_historia` el 2026-09-15)
- Consentimientos GDPR/LOPD
- Editar paciente con modal `FormPaciente`
- Ficha con última consulta expandible
- Búsqueda por nombre/apellidos/DNI
- Última consulta del paciente

### 3.3 Citas ✅
- CRUD completo
- Agenda por día con filtros
- Estados: pendiente, confirmada, completada, cancelada, no asiste
- Verificación de disponibilidad del profesional
- Formulario `FormCita` con validación
- Filtros por fecha y profesional

### 3.4 Historia Clínica ✅
- ID único asociado al paciente: `HC-{paciente_id:05d}-{num_consulta:03d}`
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
- Formulario `FormConsulta` con validación completa

### 3.5 Facturación ✅
- Presupuestos: `PRE-{year}-{id:05d}` (correlativo por año)
- Facturas: `FAC-{year}-{id:05d}` (correlativo por año)
- Líneas de facturación con IVA, descuentos
- Caja diaria automática
- Cobros en efectivo/tarjeta con registro en caja
- Estadísticas de facturación
- Formulario `Facturacion` con gestión completa

### 3.6 Inventario ✅
- CRUD de productos/servicios
- Control de stock (mínimo, máximo)
- Movimientos de inventario
- Modelos: `Producto`, `MovimientoInventario`
- Schemas y servicios completos
- Página frontend `Inventario.tsx`

### 3.7 Informes/Estadísticas ✅
- KPIs en tiempo real (pacientes, citas, facturación)
- Estadísticas globales de la clínica
- Endpoint `/api/estadisticas/*` con múltiples métricas
- Página frontend `Informes.tsx`

### 3.8 Administración ✅
- Panel de administración con tarjetas compactas
- Gestión de usuarios
- Auditoría de cambios
- Configuración del sistema
- Seguridad y logs

### 3.9 Configuración ✅
- Parámetros editables desde el panel de administración
- Configuración de ruta de documentos de consentimiento
- Gestión de claves de configuración

### 3.10 Documentos ✅
- Subida de documentos de consentimiento
- Descarga de archivos
- Rutas configurables (excluidas del repositorio)
- Almacenamiento local (nunca en git)

### 3.11 Diseño y UX ✅
- Paleta verde menta basada en `#9df3e4`
- Iconos SVG inline (sin dependencias externas)
- Efectos visuales al seleccionar menú (brillo + sombra + escala)
- Responsive design
- Scrollbar estilizado
- Sidebar con navegación por módulos
- Headers de módulo con icono representativo
- Formularios reutilizables (FormPaciente, FormCita, FormConsulta, FormFactura)
- Botones de acceso rápido en dashboard
- Calendario mensual con navegación por mes

---

## 4. Estructura del Proyecto

```
clinica-podologia/
├── docker-compose.yml
├── .env
├── .gitignore
├── README.md
├── REGLAS_PROYECTO.md
├── INFORME_PROYECTO.md
├── SESION_2026-09-14.md
├── FLUJO_DE_DATOS.md
│
├── backend/
│   ├── Dockerfile.dev
│   ├── requirements.txt
│   ├── alembic.ini
│   │
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 1a2b3c4d5e6f_configuracion_y_documento.py
│   │       ├── 2c438ac0f24b_add_documento_consentimiento.py
│   │       ├── 4764abe21b8c_campos_detalle_antecedentes.py
│   │       ├── 7b0f1a2c3d4e_renombrar_numero_historia_a_codigo_paciente.py
│   │       ├── 96c698064c5c_add_inventario_tables.py
│   │       └── fb9ba37c99b3_campos_adicionales_paciente.py
│   │
│   └── app/
│       ├── main.py
│       │
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── dependencies.py
│       │   ├── security.py
│       │   └── static_files.py
│       │
│       ├── models/
│       │   ├── user.py
│       │   ├── paciente.py
│       │   ├── cita.py
│       │   ├── historia_clinica.py
│       │   ├── facturacion.py
│       │   ├── inventario.py
│       │   └── configuracion.py
│       │
│       ├── schemas/
│       │   ├── user.py
│       │   ├── paciente.py
│       │   ├── cita.py
│       │   ├── historia_clinica.py
│       │   ├── facturacion.py
│       │   ├── inventario.py
│       │   ├── configuracion.py
│       │   └── estadisticas.py
│       │
│       ├── routers/
│       │   ├── auth.py
│       │   ├── pacientes.py
│       │   ├── citas.py
│       │   ├── historias.py
│       │   ├── facturacion.py
│       │   ├── inventario.py
│       │   ├── estadisticas.py
│       │   ├── documentos.py
│       │   ├── configuracion.py
│       │   ├── admin.py
│       │   └── users.py
│       │
│       ├── services/
│       │   ├── auth_service.py
│       │   ├── cita_service.py
│       │   ├── historia_service.py
│       │   ├── facturacion_service.py
│       │   ├── inventario_service.py
│       │   └── estadisticas_service.py
│       │
│       └── middleware/
│           └── __init__.py
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
│       │   ├── useAuth.ts
│       │   └── useScrollLock.ts
│       │
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   ├── HeaderClinica.tsx
│       │   ├── Podograma.tsx
│       │   ├── FormPaciente.tsx
│       │   ├── FormCita.tsx
│       │   ├── FormConsulta.tsx
│       │   ├── FormFactura.tsx
│       │   └── BuscadorPacientes.tsx
│       │
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── Pacientes.tsx
│       │   ├── Citas.tsx
│       │   ├── HistoriaClinica.tsx
│       │   ├── Facturacion.tsx
│       │   ├── Inventario.tsx
│       │   ├── Informes.tsx
│       │   ├── Configuracion.tsx
│       │   ├── Admin.tsx
│       │   └── Perfil.tsx
│       │
│       └── utils/
│           ├── fecha.ts
│           └── configEvents.ts
│
├── scripts/
│   └── (scripts de utilidad)
│
└── nginx/
    └── nginx.conf
```

---

## 5. Base de Datos

### Tablas actuales (14)

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
| productos | Productos/servicios de inventario |
| movimientos_inventario | Movimientos de stock |
| configuracion | Parámetros configurables del sistema |

### Nomenclatura de IDs

| Entidad | Campo | Formato | Ejemplo |
|---------|-------|---------|---------|
| Paciente | `codigo_paciente` | `PAC-{id:05d}` | `PAC-00001` |
| Historia Clínica | `numero_historia` | `HC-{paciente_id:05d}-{num_consulta:03d}` | `HC-00001-001` |
| Factura | número | `FAC-{year}-{id:05d}` | `FAC-2026-00001` |
| Presupuesto | número | `PRE-{year}-{id:05d}` | `PRE-2026-00001` |
| Producto | código | `INV-{id:05d}` | `INV-00001` |

### Relaciones principales:
- `pacientes` 1:N `citas`, `historias_clinicas`, `documentos_facturacion`
- `historias_clinicas` 1:N `exploraciones_biomecanicas`, `tratamientos`, `podogramas`
- `documentos_facturacion` 1:N `lineas_facturacion`
- `caja_diaria` 1:N `movimientos_caja`
- `productos` 1:N `movimientos_inventario`

---

## 6. Endpoints API

### Autenticación (3)
- `POST /api/auth/login` — Login con username/password (OAuth2)
- `POST /api/auth/register` — Registro (requiere auth)
- `GET /api/auth/me` — Usuario actual

### Pacientes (6)
- `POST /api/pacientes` — Crear
- `GET /api/pacientes` — Listar (paginado, búsqueda)
- `GET /api/pacientes/{id}` — Obtener
- `PUT /api/pacientes/{id}` — Actualizar
- `DELETE /api/pacientes/{id}` — Soft delete
- `GET /api/pacientes/{id}/ultima-consulta` — Última consulta

### Citas (7)
- `POST /api/citas` — Crear (verifica disponibilidad)
- `GET /api/citas` — Listar (filtros: fecha, profesional, estado)
- `GET /api/citas/dia/{fecha}` — Agenda del día
- `GET /api/citas/{id}` — Obtener
- `PUT /api/citas/{id}` — Actualizar
- `PATCH /api/citas/{id}/estado` — Cambiar estado
- `DELETE /api/citas/{id}` — Soft delete

### Historia Clínica (6)
- `POST /api/historias` — Crear (con exploraciones, tratamientos, podogramas)
- `GET /api/historias` — Listar (paginado, filtros)
- `GET /api/historias/{id}` — Obtener detalle completo
- `GET /api/historias/paciente/{id}` — Historias de un paciente
- `PUT /api/historias/{id}` — Actualizar
- `DELETE /api/historias/{id}` — Soft delete

### Facturación (9)
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

### Inventario (5+)
- `POST /api/inventario` — Crear producto
- `GET /api/inventario` — Listar productos
- `GET /api/inventario/{id}` — Obtener producto
- `PUT /api/inventario/{id}` — Actualizar producto
- `POST /api/inventario/movimiento` — Registrar movimiento

### Estadísticas (5+)
- `GET /api/estadisticas/general` — KPIs generales
- `GET /api/estadisticas/citas` — Estadísticas de citas
- `GET /api/estadisticas/facturacion` — Estadísticas de facturación
- `GET /api/estadisticas/pacientes` — Estadísticas de pacientes

### Documentos (3)
- `POST /api/documentos/upload` — Subir documento
- `GET /api/documentos/{id}` — Descargar documento
- `GET /api/documentos/paciente/{id}` — Documentos de un paciente

### Configuración (3)
- `GET /api/configuracion` — Obtener configuración
- `PUT /api/configuracion/{clave}` — Actualizar configuración
- `POST /api/configuracion` — Crear parámetro

### Administración (5+)
- `GET /api/admin/usuarios` — Listar usuarios
- `GET /api/admin/auditoria` — Logs de auditoría
- `GET /api/admin/estadisticas` — Estadísticas del sistema
- `PUT /api/admin/usuarios/{id}` — Actualizar usuario

---

## 7. Componentes Frontend Reutilizables

| Componente | Descripción |
|------------|-------------|
| `Sidebar.tsx` | Menú lateral con navegación por módulos |
| `Header.tsx` | Encabezado de página con título e icono |
| `HeaderClinica.tsx` | Header específico de clínica |
| `FormPaciente.tsx` | Formulario completo de paciente (usado en Dashboard y Pacientes) |
| `FormCita.tsx` | Formulario de cita |
| `FormConsulta.tsx` | Formulario de consulta/historia clínica |
| `FormFactura.tsx` | Formulario de facturación |
| `Podograma.tsx` | Podograma interactivo SVG |
| `BuscadorPacientes.tsx` | Componente de búsqueda de pacientes |

---

## 8. Próximos Pasos Prioritarios

### Paso 1: Testing y QA
1. Tests unitarios de backend (pytest)
2. Tests de integración
3. Tests de componentes frontend
4. QA completo de flujos críticos

### Paso 2: Mejoras de Producción
1. Configurar HTTPS con nginx
2. Backups automáticos de BD
3. Rate limiting
4. Variables de entorno seguras mejoradas
5. Logging centralizado

### Paso 3: Funcionalidades Adicionales
1. Exportación a PDF/Excel de informes
2. Notificaciones por email/SMS
3. Portal de pacientes (acceso limitado)
4. Integración con pasarela de pago
5. App móvil (React Native / Flutter)

---

## 9. Git y Repositorio

| Aspecto | Estado |
|---------|--------|
| **Repositorio local** | ✅ Configurado (rama `main`) |
| **Remoto** | ✅ https://github.com/reiben-corp/podogestion |
| **Commits** | 4+ (inicial, docs, seed data, rename campo) |
| **Seguridad** | ✅ Backup automático al cerrar sesión |

### Comandos de git:
```bash
# Backup manual
cd /home/reiben/clinica-podologia
git add -A && git commit -m "backup: descripción" && git push origin main

# Ver historial
git log --oneline -10
```

---

## 10. Seguridad y Backup Automático

**Implementado:** Al cerrar cada sesión, se ejecuta automáticamente:
```bash
cd /home/reiben/clinica-podologia && git add -A && git commit -m "backup: sesión $(date +%Y-%m-%d_%H:%M)" && git push origin main
```

Esto garantiza que el código siempre esté respaldado en GitHub.

---

## 11. Errores Corregidos Recientemente

| Error | Causa | Solución |
|-------|-------|----------|
| Iconos del menú duplicados | Emoji + SVG simultáneamente | Eliminados emoji, solo SVG inline |
| Faltaba Facturación en menú Citas | No se añadió al actualizar sidebar | Añadido enlace + icono |
| Sin botón editar paciente | No implementado | Añadido modal completo con FormPaciente |
| Última consulta no expandible | Siempre mostraba todo | Añadido estado expandible/collapse |
| Import Link faltante | No importado en 3 páginas | Añadido `import { Link }` |
| Ruta `/estadisticas` capturada por `/{documento_id}` | Orden incorrecto de rutas | Reordenadas: estáticas primero |
| NameError LineaFacturacionCreate | No importado en servicio | Añadido import del schema |
| import.meta.env error | TypeScript no reconocía ImportMeta | Añadido `(import.meta as any)` |
| Campo `numero_historia` confuso en pacientes | Nombre inapropiado (almacena PAC-{id}) | Renombrado a `codigo_paciente` (2026-09-15) |

---

## 12. Comandos Útiles

```bash
# Levantar proyecto
cd /home/reiben/clinica-podologia
docker compose up -d

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar servicios
docker compose restart

# Migraciones
docker exec clinica_backend alembic upgrade head

# Crear migración automática
docker exec clinica_backend alembic revision --autogenerate -m "descripción"

# Acceder al sistema
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
# Credenciales: admin / admin123

# Backup manual a GitHub
cd /home/reiben/clinica-podologia
git add -A && git commit -m "backup: descripción" && git push origin main
```

---

## 13. Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Módulos completados** | 11 de 11 principales |
| **Endpoints API** | 50+ |
| **Tablas BD** | 14 |
| **Páginas frontend** | 11 |
| **Componentes reutilizables** | 9 |
| **Líneas de código** | ~15,000+ |
| **Estado general** | 🟢 Funcional y en desarrollo activo |
| **Repositorio remoto** | ✅ https://github.com/reiben-corp/podogestion |

---

*Informe actualizado el 15/09/2026*
