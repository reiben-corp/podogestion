# 📋 Reglas del Proyecto — Clínica Podología

**ESTE ARCHIVO ES LA FUENTE DE VERDAD.**
Antes de hacer CUALQUIER cambio, consulta este archivo para no romper decisiones previas.
Si se modifica una regla, debe documentarse aquí con fecha.

---

## 🔒 Reglas de Diseño Inquebrantables

### 1. Ordenamiento de Listas

| Módulo | Campo de orden | Dirección | Dónde |
|--------|---------------|-----------|-------|
| Pacientes | `id` | `DESC` (últim creado primero) | Backend + Frontend |
| Citas | `fecha` + `hora_inicio` | `DESC` / `ASC` | Backend + Frontend |
| Historias Clínicas | `fecha_consulta` | `DESC` | Backend + Frontend |
| Facturación | `fecha_emision` | `DESC` | Backend + Frontend |
| Inventario | `nombre` | `ASC` | Backend + Frontend |
| Auditoría | `created_at` | `DESC` | Backend + Frontend |

**⚠️ VERIFICADO 2026-09-13:** El frontend de Pacientes PIERDE el orden cuando hace `Promise.all` con peticiones de `ultima-consulta`. 
Solución aplicada: guardar `_originalIndex` en el map y re-ordenar después del Promise.all.

---

### 2. Nomenclatura de IDs

| Entidad | Formato | Ejemplo |
|---------|---------|---------|
| Paciente | `PAC-{id:05d}` | `PAC-00001` |
| Historia Clínica | `HC-{paciente_id:05d}-{num_consulta:03d}` | `HC-00001-001` |
| Factura | `FAC-{year}-{id:05d}` | `FAC-2026-00001` |
| Presupuesto | `PRE-{year}-{id:05d}` | `PRE-2026-00001` |
| Producto | `INV-{id:05d}` | `INV-00001` |

**Todos los IDs se generan DESPUÉS de `db.flush()`** para tener la PK disponible.
**Prohibido** usar `count() + 1` para generar IDs correlativos.

---

### 3. Integridad de Datos

- **No puede existir** una historia clínica sin un paciente existente y activo.
- **No puede existir** una cita sin un paciente Y un profesional existentes y activos.
- **No puede existir** un documento de facturación sin un paciente existente.
- **No puede existir** un movimiento de inventario sin un producto existente.
- **Todas las validaciones** de existencia se hacen a nivel de servicio ANTES de crear el registro.

---

### 4. Relaciones entre Tablas

```
PACIENTES (entidad central)
    ├── 1:N → CITAS
    ├── 1:N → HISTORIAS_CLINICAS
    │           ├── 1:N → EXPLORACIONES_BIOMECANICAS
    │           ├── 1:N → TRATAMIENTOS
    │           └── 1:N → PODOGRAMAS
    └── 1:N → DOCUMENTOS_FACTURACION
                ├── 1:N → LINEAS_FACTURACION
                └── 1:N → MOVIMIENTOS_CAJA

USERS
    ├── 1:N → CITAS (como profesional_id)
    └── 1:N → HISTORIAS_CLINICAS (como profesional_id)

CAJA_DIARIA
    └── 1:N → MOVIMIENTOS_CAJA

PRODUCTOS
    └── 1:N → MOVIMIENTOS_INVENTARIO

DOCUMENTOS_FACTURACION
    └── 1:N → MOVIMIENTOS_CAJA (como documento_id, opcional)
```

---

### 5. Formato de Fecha y Zona Horaria

**Regla inquebrantable:** Todas las fechas se muestran en formato **`dd/mm/aa`** (día/mes/año de 2 dígitos).

| Dónde | Implementación |
|-------|----------------|
| **Base de datos** | Almacenar en UTC (TIMESTAMP WITH TIME ZONE) |
| **Backend Python** | `datetime.now(ZoneInfo("Europe/Madrid"))` — nunca `utcnow()` |
| **PostgreSQL** | `TZ: Europe/Madrid` en docker-compose (ya configurado) |
| **Frontend** | Usar `formatearFecha()` de `utils/fecha.ts` — **nunca** `toLocaleDateString()` |
| **Zona horaria** | `Europe/Madrid` (UTC+2 verano / UTC+1 invierno) |

**⚠️ VERIFICADO 2026-09-13:** El frontend usa `toLocaleDateString('es-ES')` que devuelve formato largo. Debe usarse SIEMPRE `formatearFecha()` que devuelve `dd/mm/aa`.

#### Ejemplo correcto:
```typescript
// ✅ CORRECTO
import { formatearFecha, formatearFechaHora } from '../utils/fecha';
<span>{formatearFecha(paciente.created_at)}</span>  // → "13/09/26"

// ❌ INCORRECTO
<span>{new Date(paciente.created_at).toLocaleDateString('es-ES')}</span>  // → "13 de septiembre de 2026"
```

#### Citas
```
PENDIENTE → CONFIRMADA → COMPLETADA
     ↓           ↓
CANCELADA    NO_ASISTE
```

#### Documentos de Facturación
```
BORRADOR → PENDIENTE → ACEPTADO → COBRADO
                          ↓
                       ANULADO
```

---

## ⚠️ Verificación de Cambios

Antes de CADA cambio en el backend, verificar que:

1. ✅ El endpoint `GET` de listado tiene `order_by(campo_correcto.dirección_correcta)`
2. ✅ Los campos de orden están indexados en la BD si la tabla es grande
3. ✅ El frontend NO hace transformaciones que pierdan el orden
4. ✅ Los IDs se generan con el formato correcto (PAC-, HC-, FAC-, PRE-, INV-)
5. ✅ Los servicios validan existencia de relaciones antes de crear
6. ✅ No se usan `count() + 1` para correlativos (usa `id` post-flush)

---

## 📅 Historial de Reglas

| Fecha | Regla | Descripción |
|-------|-------|-------------|
| 2026-09-13 | Orden pacientes | `created_at DESC`, último registro primero |
| 2026-09-13 | Nomenclatura IDs | PAC-{id}, HC-{paciente}-{consulta}, FAC/PRE-{year}-{id}, INV-{id} |
| 2026-09-13 | Integridad historias | Validar paciente existe ANTES de crear historia |
| 2026-09-13 | Orden Promise.all | Frontend debe preservar orden tras peticiones asíncronas |
| 2026-09-13 | Post-flush IDs | Ningún ID correlativo se asigna antes de flush |
| 2026-09-13 | Formato fechas | `dd/mm/aa` en todo el proyecto. UTC+2 Europe/Madrid. Frontend usa `formatearFecha()` |

---

## 🚫 Prohibido

- ❌ Cambiar el orden de listado sin consultar este documento
- ❌ Usar `count() + 1` para generar IDs
- ❌ Eliminar validaciones de existencia en servicios
- ❌ Añadir campos innecesarios a las tablas
- ❌ Crear tablas sin relación con `pacientes`
- ❌ Modificar formatos de ID sin actualizar este documento
- ❌ Hacer cambios en el frontend que pierdan el orden del backend
- ❌ Usar `toLocaleDateString()`, `toLocaleString()` o `toISOString()` en frontend (usar `formatearFecha()`)
- ❌ Usar `datetime.utcnow()` en backend Python (usar `datetime.now(ZoneInfo("Europe/Madrid"))`)

---

*Última actualización: 2026-09-13*

---

## 📋 Módulo Pacientes — Verificación Completa (2026-09-13)

### Estado: ✅ FUNCIONAL

| Funcionalidad | Estado | Implementación |
|---------------|--------|----------------|
| Lista ordenada | ✅ | `order_by(Paciente.id.desc())` + `_originalIndex` en Promise.all |
| Búsqueda | ✅ | `handleBusqueda` filtra por nombre/apellidos/DNI |
| Ficha completa | ✅ | `verFicha()` carga datos completos con `GET /api/pacientes/{id}` |
| Edición funcional | ✅ | `formRef` + `requestSubmit()` + recarga datos tras guardar |
| Nueva HC | ✅ | Link a `/historia-clinica?paciente={id}` |
| Cerrar ficha | ✅ | Reset de estados + remover `body.ficha-abierta` |

### Campos que se muestran en la ficha:
- **Identificación**: Registro ID, Nombre completo, DNI, Fecha nacimiento, Edad, Sexo, Estado civil, Profesión
- **Contacto**: Teléfono, Email, Dirección, Ciudad, CP, 🚨 Emergencia (con estilo)
- **Salud**: Diabetes + detalle, Cardiovasculares + detalle, Coagulación + detalle, Reumáticas + detalle, Neurológicas + detalle, Óseas + detalle, Hepatitis/VIH + detalle, Embarazada + detalle, Alergias, Medicación, Antecedentes
- **Podología**: Cirugías, Calzado, Plantillas + **detalle**, Traumatismos + **detalle**
- **Estilo de vida**: Deporte, Frecuencia, Horas de pie, Fumador
- **RGPD**: Consentimientos con fechas

### Puntos críticos a NO romper:
1. `verFicha()` debe llamar a `GET /api/pacientes/{id}` para obtener datos completos
2. `handleEditarPaciente()` debe recargar datos tras guardar: `await cargarPacientes()` → `GET paciente` → `GET ultima-consulta`
3. `body.ficha-abierta` con `overflow: hidden` + `position: fixed` para bloquear scroll
4. Formato fechas SIEMPRE con `formatearFecha()` — nunca `toLocaleDateString()`
5. Ordenar por `id DESC` (no `created_at`) porque seed crea todos con mismo timestamp
