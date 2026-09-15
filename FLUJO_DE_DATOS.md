# 🔄 Flujo de Datos — Clínica Podología

## Diagrama de Relaciones (ER Simplificado)

```
┌─────────────┐     1:N     ┌─────────────┐     1:N     ┌─────────────────────┐
│   USERS     │─────────────│    CITAS    │─────────────│  HISTORIAS_CLINICAS │
│ (médicos)   │             │  (agenda)   │             │    (consultas)      │
└─────────────┘             └─────────────┘             └──────────┬──────────┘
                                                                   │
       ┌────────────────────────────────────────────────────────────┼──────────┐
       │              │              │              │              │          │
       ▼              ▼              ▼              ▼              ▼          │
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┴──────┐
│EXPLORACIONES│ │TRATAMIENTOS │ │ PODOGRAMAS  │ │DOCUMENTOS_  │ │  PRODUCTOS      │
│BIOMECANICAS │ │(procedim.)  │ │(registro    │ │FACTURACION  │ │ (inventario)    │
│             │ │             │ │  visual)    │ │             │ │                 │
└─────────────┘ └─────────────┘ └─────────────┘ └──────┬──────┘ └────────┬────────┘
                                                       │                  │
                                                       ▼                  ▼
                                              ┌─────────────┐    ┌─────────────────┐
                                              │LINEAS_      │    │MOVIMIENTOS_     │
                                              │FACTURACION  │    │INVENTARIO       │
                                              └─────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────┐                             ┌─────────────────┐
│  CAJA_DIARIA│◄────────────────────────────│MOVIMIENTOS_CAJA │
│  (cierre    │                             │(ingresos/gastos)│
│   diario)   │                             └─────────────────┘
└─────────────┘
        ▲
        │
┌───────┴───────┐
│  PACIENTES    │  (entidad central — todas las tablas se relacionan con pacientes)
│  (ficha       │
│   clínica)    │
└───────────────┘
```

---

## 📋 Datos que Recoge Cada Tabla

### 1. `users` — Usuarios del Sistema
| Campo | Función |
|-------|---------|
| `username` | Login único |
| `role` | admin / médico / asistente |
| `full_name` | Nombre completo |

**Se crea:** Por registro inicial o por admin en panel de administración.

---

### 2. `pacientes` — Ficha del Paciente
| Campo | Función |
|-------|---------|
| `numero_historia` | Identificador único `PAC-{id:05d}` |
| `nombre, apellidos` | Datos identificativos |
| `dni, telefono, email` | Contacto |
| `alergias, medicacion_actual, antecedentes` | Datos médicos rápidos |
| `consentimiento_datos` | GDPR — consentimiento informado |
| `consentimiento_tratamiento` | GDPR — autorización tratamiento |
| `datos_extra` | JSONB — campo flexible para datos adicionales |

**Se crea:** Cuando el paciente se da de alta por primera vez (recepción).

**Relaciones:**
- 1:N → `citas` (un paciente tiene muchas citas)
- 1:N → `historias_clinicas` (un paciente tiene muchas consultas)
- 1:N → `documentos_facturacion` (un paciente tiene muchas facturas)

---

### 3. `citas` — Agenda de Citas
| Campo | Función |
|-------|---------|
| `paciente_id` | FK → pacientes.id |
| `profesional_id` | FK → users.id (médico asignado) |
| `fecha, hora_inicio, hora_fin` | Horario de la cita |
| `motivo` | Motivo breve de la cita |
| `estado` | pendiente → confirmada → completada / cancelada / no_asiste |
| `notas` | Observaciones adicionales |

**Se crea:** Cuando se agenda una cita para un paciente existente.

**Flujo de estados:**
```
PENDIENTE → CONFIRMADA → COMPLETADA
                ↓
            CANCELADA / NO_ASISTE
```

**Relaciones:**
- N:1 → `pacientes` (cita pertenece a un paciente)
- N:1 → `users` (cita asignada a un profesional)

---

### 4. `historias_clinicas` — Consulta Médica
| Campo | Función |
|-------|---------|
| `numero_historia` | `HC-{paciente_id:05d}-{num_consulta:03d}` |
| `paciente_id` | FK → pacientes.id |
| `profesional_id` | FK → users.id |
| `fecha_consulta` | Momento de la atención |
| `motivo_consulta` | Por qué viene el paciente |
| `antecedentes_personales` | Historia médica personal |
| `antecedentes_familiares` | Historia médica familiar |
| `exploracion_fisica` | Hallazgos del examen |
| `diagnostico` | Diagnóstico clínico |
| `codigo_diagnostico` | Código CIAP-2 |
| `plan_tratamiento` | Tratamiento propuesto |
| `evolución` | Seguimiento/evolución |
| `observaciones` | Notas adicionales |

**Se crea:** Cuando el médico atiende físicamente al paciente (durante/después de la cita).

**Relaciones:**
- N:1 → `pacientes` (historia pertenece a un paciente)
- N:1 → `users` (historia creada por un profesional)
- 1:N → `exploraciones_biomecanicas`
- 1:N → `tratamientos`
- 1:N → `podogramas`

---

### 5. `exploraciones_biomecanicas` — Estudios Biomecánicos
| Campo | Función |
|-------|---------|
| `historia_id` | FK → historias_clinicas.id |
| `tipo` | estatica / dinamica / marcha / carrera / equilibrio |
| `datos` | JSONB — mediciones, presiones, imágenes |
| `resultado` | Interpretación clínica |

**Se crea:** Como parte de una consulta cuando se realiza exploración.

---

### 6. `tratamientos` — Procedimientos Realizados
| Campo | Función |
|-------|---------|
| `historia_id` | FK → historias_clinicas.id |
| `tipo` | quiropodologia / ortesis / plantillas / rehabilitacion / cirurgia |
| `descripcion` | Qué se hizo exactamente |
| `zona` | Zona del pie tratada |
| `pie` | izquierdo / derecho / ambos |

**Se crea:** Como parte de una consulta cuando se realiza un procedimiento.

---

### 7. `podogramas` — Registro Visual del Pie
| Campo | Función |
|-------|---------|
| `historia_id` | FK → historias_clinicas.id |
| `pie` | izquierdo / derecho |
| `datos` | JSONB — puntos de presión, zonas de apoyo |
| `imagen` | Imagen base64 generada |

**Se crea:** Como parte de una consulta cuando se registra podograma.

---

### 8. `documentos_facturacion` — Presupuestos y Facturas
| Campo | Función |
|-------|---------|
| `numero` | `PRE-{year}-{id:05d}` o `FAC-{year}-{id:05d}` |
| `tipo` | presupuesto / factura |
| `estado` | borrador → aceptado → cobrado / anulado |
| `paciente_id` | FK → pacientes.id |
| `profesional_id` | FK → users.id |
| `base_imponible, iva_porcentaje, iva_importe, total` | Importes |
| `metodo_pago` | efectivo / tarjeta / transferencia |

**Se crea:** Después de una consulta, cuando se emite presupuesto/factura.

**Flujo de estados:**
```
BORRADOR → PENDIENTE → ACEPTADO → COBRADO
                          ↓
                       ANULADO
```

**Relaciones:**
- N:1 → `pacientes`
- N:1 → `users`
- 1:N → `lineas_facturacion`
- 1:N → `movimientos_caja` (cuando se cobra)

---

### 9. `lineas_facturacion` — Conceptos Facturados
| Campo | Función |
|-------|---------|
| `documento_id` | FK → documentos_facturacion.id |
| `concepto` | Descripción del servicio (ej: "Quiropodia") |
| `cantidad, precio_unitario` | Base del cálculo |
| `descuento, iva_porcentaje` | Aplicados a la línea |
| `importe_bruto, importe_neto` | Importes calculados |

**Se crea:** Cada línea de una factura/presupuesto.

---

### 10. `caja_diaria` — Cierre de Caja del Día
| Campo | Función |
|-------|---------|
| `fecha` | Día al que corresponde |
| `saldo_inicial` | Efectivo al inicio del día |
| `total_ingresos, total_gastos` | Totales del día |
| `saldo_final` | Cálculo automático |
| `cerrada` | Boolean — ¿caja cerrada? |

**Se crea/actualiza:** Al cobrar facturas o registrar movimientos.

**Relaciones:**
- 1:N → `movimientos_caja`

---

### 11. `movimientos_caja` — Movimientos de Caja
| Campo | Función |
|-------|---------|
| `caja_id` | FK → caja_diaria.id |
| `tipo` | ingreso / gasto |
| `concepto` | Descripción del movimiento |
| `importe` | Cantidad |
| `documento_id` | FK → documentos_facturacion.id (opcional) |

**Se crea:** Al cobrar una factura o registrar un gasto/ingreso manual.

---

### 12. `productos` — Inventario de Material
| Campo | Función |
|-------|---------|
| `codigo` | `INV-{id:05d}` |
| `nombre, descripcion` | Identificación del producto |
| `categoria` | Tipo de producto (material_cura, instrumental, etc.) |
| `stock_actual, stock_minimo, stock_maximo` | Control de stock |
| `precio_coste, precio_venta` | Valoración |
| `proveedor, ubicacion` | Logística |

**Se crea:** Al dar de alta un producto en el inventario.

**Relaciones:**
- 1:N → `movimientos_inventario`

---

### 13. `movimientos_inventario` — Trazabilidad de Stock
| Campo | Función |
|-------|---------|
| `producto_id` | FK → productos.id |
| `tipo` | entrada / salida / ajuste / devolucion |
| `cantidad` | Cantidad del movimiento |
| `stock_anterior, stock_nuevo` | Registro del cambio |
| `motivo` | Por qué se hace el movimiento |
| `usuario_id` | Quién lo realiza |

**Se crea:** Al actualizar stock (compra, uso clínico, ajuste).

---

## 🔄 Workflow Completo: Ejemplo Real

### Escenario: Médico recibe a paciente que ya tiene cita hoy

```
PASO 1: PACIENTE EXISTE EN EL SISTEMA
─────────────────────────────────────
→ Tabla: pacientes (ya creado)
   - PAC-00001, María García López
   - Datos demográficos completos
   - Consentimientos GDPR firmados

PASO 2: PACIENTE TIENE CITA HOY (previa)
────────────────────────────────────────
→ Tabla: citas
   - paciente_id = 1 (PAC-00001)
   - fecha = 2026-09-13 (hoy)
   - hora_inicio = 10:00
   - estado = "confirmada"
   - motivo = "Revisión"

PASO 3: PACIENTE LLEGA → MÉDICO CAMBIA ESTADO
─────────────────────────────────────────────
→ PATCH /api/citas/{id}/estado
   estado: "confirmada" → "completada" (o se mantiene confirmada hasta que termine)

PASO 4: MÉDICO CREA HISTORIA CLÍNICA (consulta)
──────────────────────────────────────────────
→ POST /api/historias/
   {
     paciente_id: 1,
     profesional_id: 2,
     motivo_consulta: "Dolor en talón derecho",
     antecedentes_personales: "Diabetes tipo 2",
     exploracion_fisica: "Se observa inflamación en inserción fascia plantar",
     diagnostico: "Fascitis plantar (M72.2)",
     codigo_diagnostico: "M72.2",
     plan_tratamiento: "Plantillas a medida + antiinflamatorio",
     evolucion: "Derivada a fisioterapia"
   }

→ Tabla: historias_clinicas
   - numero_historia = "HC-00001-003"  (3ª consulta de PAC-00001)
   - paciente_id = 1
   - profesional_id = 2

PASO 5 (OPCIONAL): MÉDICO AÑADE EXPLORACIÓN BIOMECÁNICA
────────────────────────────────────────────────────
→ Se incluye en el POST de historias (array exploraciones)
   {
     tipo: "estatica",
     datos: { presion_max: "320 kPa", zona: "retropie" },
     resultado: "Pronación excesiva"
   }

→ Tabla: exploraciones_biomecanicas
   - historia_id = (la recién creada)
   - tipo = "estatica"
   - datos = { JSONB }

PASO 6 (OPCIONAL): MÉDICO REGISTRA TRATAMIENTO
─────────────────────────────────────────────
→ Se incluye en el POST de historias (array tratamientos)
   {
     tipo: "quiropodologia",
     descripcion: "Corte y fresado ungueal + eliminación callosidades",
     pie: "derecho"
   }

→ Tabla: tratamientos
   - historia_id = (la recién creada)
   - tipo = "quiropodologia"

PASO 7 (OPCIONAL): SE REGISTRA POGRAMA
─────────────────────────────────────
→ Tabla: podogramas
   - historia_id = (la recién creada)
   - pie = "izquierdo"
   - datos = { puntos_presion: [...] }

PASO 8: SE GENERA FACTURA/PRESUPUESTO
────────────────────────────────────
→ POST /api/facturacion/
   {
     tipo: "factura",
     paciente_id: 1,
     profesional_id: 2,
     lineas: [
       { concepto: "Consulta podológica", cantidad: 1, precio_unitario: 45.00 },
       { concepto: "Estudio biomecánico", cantidad: 1, precio_unitario: 30.00 }
     ]
   }

→ Tabla: documentos_facturacion
   - numero = "FAC-2026-00007"
   - paciente_id = 1
   - estado = "borrador" (inicial)

→ Tabla: lineas_facturacion
   - documento_id = (el recién creado)
   - concepto = "Consulta podológica"
   - cantidad = 1
   - precio_unitario = 45.00

PASO 9: SE COBRA LA FACTURA
──────────────────────────
→ POST /api/facturacion/{id}/cobrar
   metodo_pago: "tarjeta"

→ Tabla: documentos_facturacion
   - estado = "cobrado"
   - metodo_pago = "tarjeta"

→ Tabla: movimientos_caja
   - caja_id = (caja de hoy)
   - tipo = "ingreso"
   - concepto = "Cobro FAC-2026-00007"
   - importe = 90.75 (75 + 21% IVA)

→ Tabla: caja_diaria
   - total_ingresos += 90.75
   - total_tarjeta += 90.75

PASO 10 (OPCIONAL): SE REGISTRA USO DE MATERIAL
─────────────────────────────────────────────
→ POST /api/inventario/movimientos
   {
     producto_id: 3 (Bisturí desechable),
     tipo: "salida",
     cantidad: 1,
     motivo: "Uso en consulta"
   }

→ Tabla: movimientos_inventario
   - producto_id = 3
   - tipo = "salida"
   - cantidad = 1
   - stock_anterior = 30
   - stock_nuevo = 29

→ Tabla: productos (actualizado automáticamente)
   - stock_actual = 29
```

---

## 📊 Resumen de Creación de Datos

| Orden | Tabla | Evento Disparador |
|-------|-------|-------------------|
| 1 | `users` | Registro de usuarios del sistema |
| 2 | `pacientes` | Alta de paciente nuevo |
| 3 | `citas` | Programar cita para paciente |
| 4 | `historias_clinicas` | Médico atiende al paciente |
| 5 | `exploraciones_biomecanicas` | Como parte de la consulta |
| 6 | `tratamientos` | Como parte de la consulta |
| 7 | `podogramas` | Como parte de la consulta |
| 8 | `productos` | Alta de producto en inventario |
| 9 | `documentos_facturacion` | Emitir presupuesto/factura |
| 10 | `lineas_facturacion` | Cada concepto facturado |
| 11 | `movimientos_caja` | Cobro o movimiento de caja |
| 12 | `movimientos_inventario` | Uso/compra de material |
| 13 | `caja_diaria` | Cierre de caja al final del día |

---

## 🔒 Reglas de Integridad

1. **Paciente siempre requerido:** No existe cita, historia, documento ni movimiento de inventario (asociado a paciente) sin un paciente existente
2. **Historia clínica → Paciente:** Validación a nivel de servicio (SQLAlchemy + backend)
3. **Cita → Paciente + Profesional:** Tanto paciente como profesional deben existir y estar activos
4. **Factura → Paciente:** Validación en servicio `facturacion_service.py`
5. **Producto → Stock:** Movimientos de inventario actualizan `producto.stock_actual` automáticamente
6. **Documento → Caja:** Al cobrar, se registra movimiento en caja automáticamente
7. **IDs generados post-flush:** Todas las claves descriptivas (PAC-, HC-, FAC-, INV-) se generan después de tener la PK
