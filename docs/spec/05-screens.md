# §6 Pantallas y Flujos

## Rutas

```
/login                              → LoginPage (pública)

/ (AppShell — protegidas)
  /facturas                         → FacturasPage
  /facturas/nuevo                   → FacturaDetail
  /facturas/:serie/:folio           → FacturaDetail
  /ingresos                         → IngresosPage
  /ingresos/nuevo                   → IngresoDetail
  /ingresos/:serie/:folio           → IngresoDetail
  /clientes                         → ClientesPage
  /clientes/nuevo                   → ClienteDetail
  /clientes/:id                     → ClienteDetail
  /productos                        → ProductosPage
  /productos/nuevo                  → ProductoDetail
  /productos/:id                    → ProductoDetail  ← param es :id, no :sku
```

Guard en `AppShell`: `!isAuthenticated` → redirect `/login`.

---

## FacturaDetail (pantalla principal)

### Estructura visual (mobile-first, vertical)

Layout de secciones apiladas con sticky bottom bar. Desktop añade columnas pero mantiene el mismo orden.

```
┌─────────────────────────────┐
│ ←  Nueva Factura       ···  │  TopBar (··· = acciones secundarias)
├─────────────────────────────┤
│                             │
│  ╔══ CLIENTE ═════════════╗ │
│  ║ [🔍 Buscar cliente...] ║ │  autocomplete full-width
│  ║ ─────────────────────  ║ │
│  ║ XAXX010101000          ║ │
│  ║ PUBLICO EN GENERAL     ║ │
│  ║ Uso: G03 · Reg: 616    ║ │
│  ║              [Cambiar] ║ │
│  ╚════════════════════════╝ │
│                             │
│  ╔══ COMPROBANTE ▼ ═══════╗ │  abierta por defecto
│  ║ Método pago: [PUE ▼]   ║ │
│  ║ Forma pago:  [01 Efec] ║ │
│  ║ Fecha: [14/04/2026]    ║ │
│  ║ Serie: A   Folio: auto ║ │
│  ║ [+ Divisa / T.C.]      ║ │  expandible
│  ╚════════════════════════╝ │
│                             │
│  ╔══ CONCEPTOS ═══════════╗ │
│  ║ ┌──────────────────┐   ║ │
│  ║ │ PROD-001    ✏ 🗑 │   ║ │  botones visibles + swipe-left
│  ║ │ Llanta 10R15     │   ║ │
│  ║ │ 2 PZ × $2,750    │   ║ │
│  ║ │ Traslado IVA 16%:$880│ ║ │  ← cada impuesto en su línea
│  ║ │ Retención ISR 5%:-$137│ ║ │  ← retención con signo negativo
│  ║ │ Total:  $3,493   │   ║ │
│  ║ └──────────────────┘   ║ │
│  ║ [＋ Agregar producto]   ║ │
│  ╚════════════════════════╝ │
│                             │
│  ╔══ TOTALES ══════════════╗ │
│  ║ Subtotal          $2,750.00 ║ │
│  ║ Traslado IVA 16%    $440.00 ║ │  ← un renglón por (Aplic+Imp+Tasa)
│  ║ Retención ISR 5%   −$137.50 ║ │  ← retenciones en negativo
│  ║ ──────────────────────── ║ │
│  ║ TOTAL             $3,052.50 ║ │
│  ╚════════════════════════╝ │
│                             │
│  ╔══ PAGO (solo PUE) ═════╗ │  oculto si PPD
│  ║ Importe:      [...]    ║ │  precargado del total de la factura
│  ║ Referencia:   [...]    ║ │
│  ║ Banco origen: [clave]  ║ │  clave + nombre (banco del cliente)
│  ║ Cta. origen:  [select] ║ │  select de historial o input libre
│  ║ Banco destino:[clave]  ║ │  clave + nombre (banco de la empresa)
│  ║ Cta. destino: [...]    ║ │  cuenta de la empresa
│  ╚════════════════════════╝ │
│                             │
├─────────────────────────────┤
│  [Prefactura]  [Timbrar ▶]  │  sticky bottom bar
└─────────────────────────────┘
```

**Edición de concepto** — abre Sheet (bottom drawer en mobile, Dialog en desktop):
```
╔══ Editar concepto ════════════════╗
║ Descripción: [________________] ║
║ Cantidad:    [2            ]    ║
║ Precio:      [$2,750       ]    ║  en la moneda de la factura
║ Descuento:   [0%           ]    ║
║                                 ║
║ ── Impuestos ─────────────────  ║
║ [＋ Agregar]  [－ Eliminar]      ║
║                                 ║
║  Aplicación  Impuesto  Tasa  Importe   ║
║  Traslado    IVA       16%   $440.00   ║  ← calculado (base × tasa)
║  Retención   ISR        5%   $137.50   ║  ← calculado
║                                 ║
║ ─────────────────────────────── ║
║              [Cancelar]  [OK]   ║
╚═════════════════════════════════╝
```

Fila de impuesto editable: Aplicación (`Traslado`/`Retención`), Impuesto (`IVA`/`ISR`/`IEPS`...), Tipo Factor (`Tasa`/`Cuota`/`Exento`), Tasa (editable), Importe (calculado, solo lectura). El usuario puede agregar o quitar filas libremente.

**Factura timbrada** (modo lectura) — sticky bar cambia:
```
│  [PDF ↓]  [✉ Correo]  [··· Cancelar]  │
```

### Decisiones de diseño mobile

| # | Decisión |
|---|---|
| 1 | **Conceptos: botones ✏ 🗑 visibles en la card** + swipe-left como atajo. Ambos mecanismos coexisten para evitar confusión. |
| 2 | **Sección Comprobante abierta por defecto.** PUE/PPD depende del cliente, no del usuario. |
| 3 | **Alta inline:** `<Sheet>` en mobile, `<Dialog>` en desktop (breakpoint `md`). |
| 4 | **Lista de precios:** visible solo cuando existen más de una. Al cambiar moneda se filtran las listas disponibles para esa moneda. `precio_unitario` siempre editable; se interpreta en la moneda seleccionada para la factura. |

### Alta inline de cliente (ClientePicker)

Sin resultado → botón **"+ Registrar cliente nuevo"** → `<Sheet>` (mobile) / `<Dialog>` (desktop):
- RFC *, Razón social *, Régimen fiscal *, CP fiscal *
- Guarda → `ventas:clientes:clientes:Add` → auto-selecciona → `ClientesContext.invalidate()`.

### Alta inline de producto (ProductoPicker)

Mismo patrón. Campos mínimos:
- SKU *, Descripción *, Unidad de medida *, Clave SAT prod/serv *, Almacenable (S/N) *, Esquema impuestos *
- Guarda → endpoint Add productos (pendiente §4.6.5).

### Cálculo de impuestos (AUTHORITATIVE en frontend)

1. Al agregar concepto → copiar `impuestos_traslados`/`impuestos_retenciones` del producto como punto de partida.
2. Calcular `importe` por fila = `base × tasa` (base = `cantidad × precio − descuento`; cuota fija si `tipo_factor === 'Cuota'`).
3. Usuario puede **agregar / quitar / editar filas de impuesto por concepto** desde el Sheet de edición (tabla con columnas: Aplicación, Impuesto, Tipo Factor, Tasa, Importe calculado).
4. Recalcular importes al cambiar cantidad, precio, descuento o tasa de cualquier impuesto.
5. El payload `Add`/`AddPrefactura` envía `impuestos_traslados` + `impuestos_retenciones` con `importe` calculado.

**Totales:**
```
Subtotal   = Σ(cantidad × precio − descuento) de todos los conceptos
Total      = Subtotal + Σ(traslados.importe) − Σ(retenciones.importe)
```
En la sección Totales se muestra **un renglón por cada combinación única de (Aplicación + Impuesto + Tasa)**, agregando los importes de todos los conceptos. Ejemplo:
- `Subtotal              $2,750.00`
- `Traslado IVA 16.0000%   $440.00`
- `Retención ISR 5%       −$137.50`
- `Total               $3,052.50`

### Prefactura vs. Timbrado

- **Guardar Prefactura** → `AddPrefactura` (crea) o `UpdatePrefactura` (modifica). Estatus `P`. `uuid: null`. Sin SAT.
- **Timbrar directo** → `Add` (crea + timbra en un paso). Estatus resultante `R`.
- **Timbrar prefactura existente** → `Stamp(serie, folio)`. Estatus cambia a `R`.
- `Add`, `AddPrefactura`, `UpdatePrefactura` y `Stamp` usan **el mismo payload**; solo difiere el `opReq`.
- Respuesta exitosa (todas) → `{ msg, log, record: FacturaCompleta }`. Navegar a `/facturas/:serie/:folio` en modo lectura.

### Moneda y tipo de cambio

- Default MXN, TC = 1 (ocultos hasta expandir "Divisa").
- Al cambiar a USD/EUR → el TC se **auto-llena** desde el campo `tipo_cambio` del registro de moneda en `CatalogosContext` (cargado via `Lov:Lov:Lov:LoadLovFieldMonedasEmpresa`). El campo queda editable para ajuste manual.
- ⚠️ **Pendiente:** botón "Sugerir TC del día" descrito en versiones anteriores del spec no está implementado (`LoadLovFieldTipoCambio` tampoco está implementado).
- **Al cambiar moneda → solo filtrar listas de precios disponibles para esa moneda. NO modificar `precio_unitario` de los conceptos existentes.**
- **La lista de precios es por concepto, no por factura.** Cada concepto tiene su propio selector de lista de precios (visible solo si hay más de una). Al cambiar la lista de un concepto → actualizar únicamente el `precio_unitario` de ese concepto usando `precios[]` del producto (match por `lista_precios_id`). Los demás conceptos no se tocan.
- `precio_unitario` siempre editable por el usuario; se interpreta en la moneda activa de la factura.
- El campo `lista_precios_id` del root del payload refleja la lista del primer concepto (o vacío); el authoritative es el `lista_precios_id` dentro de cada concepto.

### Pago integrado (PUE)

Al seleccionar método de pago **PUE**, se muestra la sección de pago con estos campos:

| Campo | `FacturaDraft` | Fuente inicial |
|---|---|---|
| Importe | `importePago` | Precargado con el total de la factura |
| Referencia | `referenciaPago` | Manual |
| Banco origen (cliente) | `bancoId` + `bancoDescr` | `validateLovFieldClientesIngresos` al seleccionar cliente |
| Cuenta origen (cliente) | `satCtaOri` | Select desde `SearchCuentasBancariasCliente` o input libre |
| Banco destino (empresa) | `satBancoDest` + `satBancoDestDescr` | `validateLovFieldClientesIngresos` al seleccionar cliente |
| Cuenta destino (empresa) | `satCtaDest` | `validateLovFieldClientesIngresos` al seleccionar cliente |

Los datos bancarios del cliente se obtienen con `tesoreria:registro_ingresos_33:registro_ingresos:ValidateLovFieldClientes` (no la versión de `Lov:Lov:Lov`), que devuelve además `banco_id`, `sat_cta_dest`, `sat_banco_dest`, `sat_banco_dest_descr`.

Cuando `metodoPago === "PUE"` y la acción es `Add`, el `buildPayload()` incluye el bloque `generar_ingreso[...]` con los datos bancarios y el importe de pago. Ver spec `docs/spec/10-pago-integrado-pue.md` para el contrato completo.

**PPD** → panel de pago oculto. El pago va por REP en Ingresos.

### Complementos opcionales (Fase 4: vacíos)

`info_seguros`, `comercio_exterior`, `compl_serv_par_construc`, `detallista` — siempre incluir en el payload aunque vacíos.

### Estados y botones disponibles

| Estatus | Descripción | Acciones |
|---|---|---|
| `P` Prefactura | Sin timbrar, `uuid: null` | Editar · Timbrar ⚠️ (Eliminar pendiente implementar) |
| `R` Registrada/Timbrada | Timbrada en SAT, tiene `uuid` | Ver PDF · Enviar correo · Cancelar |
| `R` + `cancelacion_estatus: "En proceso"` | Cancelación solicitada al SAT, pendiente confirmación | Re-intentar cancelación |
| `C` Cancelada | Cancelada en SAT | Ver PDF · Ver acuse (solo lectura) |

En `FacturasPage`, el badge de estatus para `R` vigente (sin cancelación en proceso) no dice genéricamente "Timbrada": usa `estatus_cxc` para mostrar **Cobrado** (`P`), **Saldo pendiente** (`SP`), **Vencido** (`VE`) o **No cobrado** (`NC`) — ver `docs/spec/03-api-client.md` §Facturas para los valores completos. `NC` puede seguir llegando en un registro y se sigue pintando como badge, aunque ya no es seleccionable en el filtro (ver más abajo). Cuando `estatus_cxc` es `SP` o `VE` se muestra además el importe de `saldo` debajo del badge.

---

## FacturasPage (consulta)

- Filtros: `fecha_inicial` (default −30 días), `fecha_final`, `rfc`, `nombre`, `serie`, `folio`, `pedido_serie`, `pedido_folio`, `estatus_cxc` (Todos/Prefactura/Cobrado/Saldo pendiente/Vencido/Cancelado — `NC` "No cobrado" se retiró del `<Select>` por confundirse con Saldo pendiente en pruebas con usuarios; ver `docs/spec/03-api-client.md` §Facturas), `disable_sucursal_filter`.
- Tabla desktop / tarjetas mobile.
- Paginación server-side (`start`/`limit=50`). La barra de paginación muestra `totalCount`, y junto a él los agregados `totalGlobal` (importe total) y `cobradoGlobal` (importe cobrado) devueltos por `Search` sobre todo el resultado filtrado — no solo la página actual (ver `docs/spec/03-api-client.md` §Facturas).
- Acciones por fila: ver, PDF, correo.

---

## IngresoDetail

### Estados de la pantalla

| Estado | Condición | Comportamiento |
|---|---|---|
| `nueva` | Ruta `/ingresos/nuevo` | Todos los campos editables, cliente vacío |
| `cargada` | Ruta `/ingresos/:serie/:folio`, `estatus=R`, sin UUID | Campos en solo lectura; botón **Timbrar** visible |
| `timbrada` | `estatus=R` con `uuid` presente | Solo lectura completa; botones **PDF**, **Correo** |
| `cancelada` | `estatus=C` | Solo lectura, badge "Cancelado" |

---

### Sección: Cliente

**Campo:** ClientePicker (texto + botón lupa)

- Al escribir `cliente_id` numérico y salir del campo → `ValidateLovFieldClientes(cliente_id)`
- Al abrir LOV (botón lupa) → `LoadLovFieldClientes(pageSize=500)` con búsqueda local por nombre/RFC
- Al seleccionar cliente, en paralelo:
  - `SearchCuentasBancariasCliente(cliente_id)` → si devuelve registros, precarga el primer resultado en los campos bancarios (`banco_id`, `banco_descr`, `sat_cta_ori`)
  - `SearchCuentasCobrar(cliente_id)` → carga la lista de facturas disponibles en el selector de factura

**Campos que se leen de `ValidateLovFieldClientes` / `LoadLovFieldClientes`:**
`cliente_id`, `rfc`, `nombre`, `codigo_postal`, `regimen_fiscal_id`, `banco_id`, `banco_descr`, `sat_cta_ori`, `sat_banco_dest`, `sat_banco_dest_descr`, `sat_cta_dest`

---

### Sección: Facturas a aplicar (multi-factura)

Lista de las facturas pendientes del cliente obtenidas de `SearchCuentasCobrar`, cada una con un **checkbox** para incluirla en el ingreso. Un mismo ingreso puede aplicar **parcial o totalmente a varias facturas** (ej.: ingreso de 5000 → 3000 a la factura A1 dejando saldo 7000, y 2000 a la factura A2 dejándola en cero).

Al marcar una factura:

- Se agrega una fila editable con su **Importe a aplicar** (en la moneda del pago), precargado según la regla de pre-llenado (ver abajo).
- Si `factura.moneda_id ≠ moneda_id` del pago **y** el pago es `MXN`, se muestra además un campo **TC pago** (`tipo_cambio_pago`) **requerido**; en los demás casos se envía vacío y lo calcula el backend.
- Mostrar en solo lectura: Serie/Folio, Fecha, Moneda, Total, Saldo, Tipo (PUE/PPD).

**Pre-llenado del importe por renglón** (replica el grid legacy): si el pago es `MXN` → `saldo_moneda_base`; si el pago es la misma moneda que la factura → `saldo`; en otro caso → vacío (lo captura el usuario).

**Importe total del ingreso = suma de los importes por factura** (auto-calculado, solo lectura). El backend valida que `Σ importe == importe` del ingreso ([Ingreso.class.php::ValidateCuentasCobrar](../../../../wamp/www/SisnetV3Desarrollo/php/classes/Tesoreria/Ingreso.class.php)).

El payload envía una fila `cuentas_cobrar[N][...]` por cada factura seleccionada con `importe > 0`; las de `importe = 0` se omiten. El `importe` de cada renglón va en la **moneda del pago**; el backend recalcula equivalencias y descuenta el saldo de cada factura. **No se recalcula nada de moneda en el frontend.**

**Campos en estado (no necesariamente visibles):** `num_cta_cobrar`, `documento`, `documento_serie`, `documento_folio`, `cliente_id`, `rfc`, `nombre`, `subtotal`, `impuestos_ret`, `impuestos_tras`, `tipo_cambio`, `total_moneda_base`, `saldo_moneda_base`

---

### Sección: Datos del pago

| Campo | Param backend | Notas |
|---|---|---|
| Fecha de pago | `fecha_pago` | DateTimePicker, default: ahora |
| Forma de pago | `forma_pago` + `forma_pago_descr` | LOV SAT (clave + descripción) |
| Moneda | `moneda_id` | `MXN` \| `USD` |
| Tipo de cambio | `tipo_cambio` | Solo editable si moneda ≠ MXN |
| Importe | `importe` | **Auto-calculado** = suma de los importes por factura; solo lectura |
| Descripción | `descripcion` | Texto libre, ej. `"PAGO DE FACTURA F1532"` |
| Referencia | `referencia` | Opcional |
| No. autorización | `no_autorizacion` | Opcional |

---

### Sección: Datos bancarios

Todos los campos bancarios son **texto libre y editables**. No existe un catálogo centralizado de cuentas bancarias de clientes — el backend las va acumulando por registro de pago.

Al seleccionar cliente, `SearchCuentasBancariasCliente` devuelve las cuentas previamente usadas. Si hay registros, ofrecer el primero como valor precargado; el usuario puede cambiarlo libremente. Si no hay historial, los campos quedan vacíos.

| Campo | Param backend | Fuente inicial |
|---|---|---|
| Banco receptor (empresa) | `banco_id` + `banco_descr` | `ValidateLovFieldClientes` → `banco_id` / `banco_descr` |
| Cuenta origen (cliente) | `sat_cta_ori` | `SearchCuentasBancariasCliente` → `sat_cta_ori` (primer resultado) |
| Banco origen (cliente) | *(no se envía — backend lo resuelve)* | — |
| Cuenta destino (empresa) | `sat_cta_dest` | `ValidateLovFieldClientes` → `sat_cta_dest` |
| Banco destino (empresa) | `sat_banco_dest` + `sat_banco_dest_descr` | `ValidateLovFieldClientes` → `sat_banco_dest` / `sat_banco_dest_descr` |

---

### Validaciones antes de guardar

- Cliente seleccionado
- Al menos una factura seleccionada con `importe > 0`
- `forma_pago` seleccionada
- Si `moneda_id ≠ MXN`: `tipo_cambio > 0`
- Por cada factura con moneda distinta a la del pago y pago `MXN`: `tipo_cambio_pago > 0`
- El importe por factura no excede su saldo (caso misma moneda / pago MXN; el resto lo valida el backend)

---

### Botones de acción

| Botón | Visible cuando | Acción |
|---|---|---|
| **Guardar** | estado `nueva` | `Add` → pasa a `cargada` o `timbrada` |
| **Timbrar** | `cargada` (sin UUID) | `Stamp(serie, folio)` → pasa a `timbrada` |
| **PDF** | `timbrada` | `PrintPdf(serie, folio)` → abre PDF |
| **Correo** | `timbrada` | Sheet con campos nombre/correo → `SendMail` |
| **Cancelar** | `timbrada` | `Cancel33(serie, folio, motivo)` |

---

### Payload `Add` (una sola factura)

```
serie=
folio=
fecha_pago=DD/MM/YYYY HH:mm:ss
cliente_id=6
nombre=JOSE MIGUEL RAMIREZ VALENCIA
rfc=RAVM810219IW0
receptor_regimen_fiscal_id=612
codigo_postal=57150
descripcion=PAGO DE FACTURA DE VENTA F1532
moneda_id=MXN
tipo_cambio=1
forma_pago=03
forma_pago_descr=Transferencia electrónica de fondos
importe=3190
banco_id=002
banco_descr=BANAMEX
sat_cta_ori=123456789
sat_banco_dest=002
sat_banco_dest_descr=BANAMEX
sat_cta_dest=343434343
no_autorizacion=
referencia=
fecha=
observaciones=
estatus_sat=
cuentas_cobrar[0][num_cta_cobrar]=1409
cuentas_cobrar[0][importe]=3190
cuentas_cobrar[0][moneda_id]=MXN
cuentas_cobrar[0][tipo_cambio]=1
cuentas_cobrar[0][documento]=FACTURA_VENTA
cuentas_cobrar[0][documento_serie]=F
cuentas_cobrar[0][documento_folio]=1532
cuentas_cobrar[0][tipo_cambio_pago]=
```

El índice siempre es `0`. `tipo_cambio_pago` va vacío en `Add`; el backend lo resuelve.

---

### Detalle cargado (`Load`)

`cuentas_cobrar.records` contiene la factura aplicada con los mismos campos que `SearchCuentasCobrar` más `tipo_cambio_pago` (TC al momento del pago). Mostrar en solo lectura.

---

## ClienteDetail

Pestañas:
- **Generales:** RFC, razón social, régimen fiscal(es), moneda/uso CFDI/forma pago/método pago default.
- **Domicilios:** grid de direcciones (fiscal/entrega). Alta/edición por `SaveDireccion`.

---

## ProductosPage

Búsqueda incremental sobre SKU y descripción. Virtualización con `react-virtual`. Paginación server-side.

---

## Payload — `Add` / `AddPrefactura` / `UpdatePrefactura` / `Stamp`

Los cuatro endpoints comparten el mismo payload. La diferencia es únicamente el `opReq`.  
`UpdatePrefactura` y `Stamp` además requieren `serie` y `folio` del documento a modificar.

```json
{
  "serie": "", "folio": "", "estatus_sat": "",
  "empresa_id": "", "notas_impresion": "", "observaciones": "",
  "estatus": "", "fecha": "", "cliente_id": "6",
  "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
  "receptor_rfc": "RAVM810219IW0",
  "receptor_regimen_fiscal_id": "612",
  "lista_precios_id": "",
  "calle": "Monterrey", "no_exterior": "22", "no_interior": "",
  "colonia": "Vergel de Guadalupe", "municipio": "Nezahualcoyotl",
  "codigo_postal": "57150", "localidad": "Ciudad Nezahualcoyotl",
  "estado": "Mexico", "pais": "MEX",
  "vendedor_id": "", "vendedor_nombre": "",
  "centro_costo_id": "", "centro_utilidad_id": "",
  "condiciones_de_pago": "", "confirmacion_sat": "",
  "uso_id": "G03", "uso_descr": "Gastos en general",
  "metodo_pago": "PPD", "metodo_pago_descr": "Pago en parcialidades o diferido",
  "moneda_id": "MXN", "tipo_cambio": "1", "decimales_sat": "2",
  "forma_pago": "99", "forma_pago_descr": "Por definir",
  "fecha_vencimiento": "14/05/2026", "a_credito": "N",
  "NumRegIdTrib": "", "orden_compra_cliente": "",
  "conceptos": [
    {
      "sku": "04470030000", "clave_prod_ser_sat": "25172504",
      "cantidad": "1", "no_identificacion": "", "cuenta_predial_numero": "",
      "precio_unitario": "2750", "precio_lista": "2750.0000",
      "descuento": "0", "tipo_descuento": "F", "factor_descuento": "0",
      "importe_precio_lista": "2750", "importe": "2750", "importe_ieps": "0",
      "observaciones": "", "unidad_id": "PZ",
      "usa_lotes": "N", "usa_series": "N", "es_paquete": "N", "almacenable": "S",
      "costo": "0",
      "impuestos_traslados": [
        { "esquema_impuestos_id": "GENERAL", "impuesto": "IVA", "aplicacion": "T",
          "tasa": "16.0000", "tipo_factor": "", "num_impuesto": "1", "importe": "440" }
      ],
      "pedido_serie": "", "pedido_folio": "", "pedido_item": "",
      "precios": [
        ["LISTA4", "2750.0000", "MXN", "1.000000"],
        ["LISTA2", "1250.0000", "MXN", "1.000000"],
        ["LISTA1", "1000.0000", "MXN", "1.000000"],
        ["USD",     "55.0000", "USD", "17.253200"]
      ],
      "lista_precios_id": "LISTA4", "es_consigna": "",
      "objeto_impuesto_sat": "02", "deducible_integrado": "0",
      "fraccion_arancelaria": "", "marca": "EUZKADY",
      "modelo": "ALL TERRAIN", "submodelo": "", "descripcion": "10 R15 EUZKADY ALL TERRAIN",
      "unidad_aduana": "", "moneda_id": "MXN", "tipo_cambio": "1.000000"
    }
  ],
  "compl_serv_par_construc": {
    "num_per_lico_aut": "", "calle": "", "no_exterior": "", "no_interior": "",
    "colonia": "", "localidad": "", "referencia": "", "municipio": "",
    "estado": "", "codigo_postal": "", "leyenda_impresa": ""
  },
  "info_seguros": {
    "aseguradora_id": "", "aseguradora_nombre": "", "orden_servicio": "",
    "asegurado_nombre": "", "poliza": "", "vehiculo_serie": "", "no_siniestro": "",
    "vehiculo_modelo": "", "vehiculo_tarjeta_circulacion": "", "asegurado_id_oficial": "",
    "vehiculo_tipo": "", "autorizo_nombre": "", "inciso": "", "num_reporte": "",
    "num_folio": "", "num_cotizacion": "", "vehiculo_marca": "", "vehiculo_submarca": "",
    "vehiculo_color": "", "vehiculo_placa": "", "tipo_servicio": "",
    "deducible_porcentaje": "0", "deducible_importe": "0", "integra_deducible": "N",
    "descuento_aseguradora_porcent": "", "descuento_aseguradora_importe": "",
    "fecha_instalacion": "", "fecha_digitaliza_expediente": ""
  },
  "comercio_exterior": {
    "tipo_operacion": "2", "clave_de_pedimento": "A1",
    "num_certificado_origen": "", "incoterm": "", "certificado_origen": "",
    "numero_exportador_confiable": "", "subdivision": "0",
    "tipo_cambio_usd": "", "total_usd": "", "observaciones": ""
  },
  "detallista": {
    "document_status": "", "requestForPaymentIdentification": "",
    "buyer": { "gln": "", "personOrDepartmentName": "" },
    "seller": { "gln": "", "type": "", "seller_alt_party_identification": "" },
    "delivery_note_reference_date": "", "order_identification_reference_date": "",
    "special_instruction_code": ""
  }
}
```

**Notas del payload:**
- `Add` timbra directo; `AddPrefactura` guarda sin timbrar. No hay campo `es_prefactura` — el `opReq` distingue la operación.
- `UpdatePrefactura` y `Stamp` incluyen además `serie`, `folio`, `estatus`, `fecha` del documento existente.
- Todos los valores numéricos viajan **como string**.
- Los bloques de complementos (`info_seguros`, `comercio_exterior`, `compl_serv_par_construc`, `detallista`) se envían **siempre**, vacíos en Fase 4.
- La clave del objeto en el response es `compl_serv_parc_construc` (con `c`), pero en el payload del request se usa `compl_serv_par_construc` (sin `c`).

### Payload Ingreso (`tesoreria:...:Add`)

Todos los valores numéricos como string. Params de la cabecera:

| Param | Descripción |
|---|---|
| `serie` | Vacío — el backend asigna `"IN"` |
| `folio` | Vacío — el backend lo asigna |
| `fecha_pago` | `"DD/MM/YYYY HH:mm:ss"` |
| `cliente_id` | ID del cliente |
| `nombre` | Razón social del cliente |
| `rfc` | RFC del cliente |
| `receptor_regimen_fiscal_id` | Régimen fiscal SAT del cliente |
| `codigo_postal` | CP del cliente |
| `descripcion` | Texto descriptivo del pago (ej. `"PAGO DE FACTURA DE VENTA F1532"`) |
| `moneda_id` | `"MXN"` \| `"USD"` |
| `tipo_cambio` | Tipo de cambio como string |
| `forma_pago` | Clave SAT (ej. `"03"`) |
| `forma_pago_descr` | Descripción forma pago |
| `importe` | Total pagado |
| `banco_id` | Banco destino (cuenta de la empresa) |
| `banco_descr` | Descripción del banco destino |
| `sat_cta_ori` | Cuenta bancaria origen del cliente |
| `sat_banco_ori` | Banco origen (clave SAT) — lo resuelve el backend del `banco_id` del cliente |
| `sat_cta_dest` | Cuenta bancaria destino (de la empresa) |
| `sat_banco_dest` | Banco destino (clave SAT) |
| `sat_banco_dest_descr` | Descripción banco destino |
| `no_autorizacion` | Número de autorización (opcional) |
| `referencia` | Referencia del pago (opcional) |
| `fecha` | Vacío — backend asigna fecha de registro |
| `observaciones` | Observaciones generales (opcional) |
| `estatus_sat` | Vacío en alta |

Las cuentas por cobrar aplicadas van como array indexado con los índices originales de la tabla (`cuentas_cobrar[N][campo]`). Filas con `importe=0` se envían igualmente para que el backend las descarte:

```
cuentas_cobrar[0][num_cta_cobrar]=704
cuentas_cobrar[0][importe]=0
cuentas_cobrar[0][moneda_id]=USD
cuentas_cobrar[0][tipo_cambio]=18.2523
cuentas_cobrar[0][documento]=FACTURA_VENTA
cuentas_cobrar[0][documento_serie]=F
cuentas_cobrar[0][documento_folio]=800
cuentas_cobrar[0][tipo_cambio_pago]=

cuentas_cobrar[22][num_cta_cobrar]=1409
cuentas_cobrar[22][importe]=3190
cuentas_cobrar[22][moneda_id]=MXN
cuentas_cobrar[22][tipo_cambio]=1
cuentas_cobrar[22][documento]=FACTURA_VENTA
cuentas_cobrar[22][documento_serie]=F
cuentas_cobrar[22][documento_folio]=1532
cuentas_cobrar[22][tipo_cambio_pago]=
```

El índice `N` corresponde a la posición original en el grid (no se renumera). `tipo_cambio_pago` se envía vacío en el `Add`; el backend lo calcula.

Respuesta: `{ msg, record: IngresoDetalle }` (ver shape de `Load`)

---

## Estatus de documentos

`P` Prefactura (sin timbrar) · `R` Registrado/Timbrado (en SAT) · `C` Cancelado · `A` Autorizado

## Multi-tenancy

`empresa_id` y `sucursal_id` van en el JWT. **El frontend NUNCA los envía en el payload.** El backend los toma de la sesión. Cambiar empresa → re-login.
