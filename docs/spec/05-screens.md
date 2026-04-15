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
  /productos/:sku                   → ProductoDetail
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
│  ║ Cuenta cobro: [...]    ║ │
│  ║ Referencia:   [...]    ║ │
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
- Al cambiar a USD/EUR → input TC manual + botón "Sugerir TC del día" (LOV).
- **Al cambiar moneda → solo filtrar listas de precios disponibles para esa moneda. NO modificar `precio_unitario` de los conceptos existentes.**
- **La lista de precios es por concepto, no por factura.** Cada concepto tiene su propio selector de lista de precios (visible solo si hay más de una). Al cambiar la lista de un concepto → actualizar únicamente el `precio_unitario` de ese concepto usando `precios[]` del producto (match por `lista_precios_id`). Los demás conceptos no se tocan.
- `precio_unitario` siempre editable por el usuario; se interpreta en la moneda activa de la factura.
- El campo `lista_precios_id` del root del payload refleja la lista del primer concepto (o vacío); el authoritative es el `lista_precios_id` dentro de cada concepto.

### Pago integrado

- PUE + "Integrar datos de pago" → incluir `cuenta_cobro_id`, `forma_pago`, `referencia_pago` en el Add.
- PPD → panel de pago deshabilitado (pago va por REP en Ingresos).

### Complementos opcionales (Fase 4: vacíos)

`info_seguros`, `comercio_exterior`, `compl_serv_par_construc`, `detallista` — siempre incluir en el payload aunque vacíos.

### Estados y botones disponibles

| Estatus | Descripción | Acciones |
|---|---|---|
| `P` Prefactura | Sin timbrar, `uuid: null` | Editar · Timbrar · Eliminar |
| `R` Registrada/Timbrada | Timbrada en SAT, tiene `uuid` | Ver PDF · Enviar correo · Cancelar |
| `R` + `cancelacion_estatus: "En proceso"` | Cancelación solicitada al SAT, pendiente confirmación | Re-intentar cancelación |
| `C` Cancelada | Cancelada en SAT | Ver PDF · Ver acuse (solo lectura) |

---

## FacturasPage (consulta)

- Filtros: `fecha_inicial` (default −30 días), `fecha_final`, `rfc`, `nombre`, `serie`, `folio`, `pedido_serie`, `pedido_folio`, `estatus`, `disable_sucursal_filter`.
- Tabla desktop / tarjetas mobile.
- Paginación server-side (`start`/`limit=50`).
- Acciones por fila: ver, PDF, correo.

---

## IngresoDetail

1. ClientePicker → `SearchCuentasCobrar(cliente_id)` → grid de facturas pendientes.
2. Columnas: UUID · Serie/Folio · Saldo · Importe a aplicar · Parcialidad.
3. Campos pago: fecha, forma pago, moneda, TC, cuenta cobro, referencia.
4. Validación: `Σ(importe aplicado) === total pagado`.
5. **Guardar y timbrar REP** → `Add` con array `aplicaciones`.
6. Si falla timbrado pero persistió → botón `Stamp` disponible.

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

```
cliente_id=000123
fecha=2026-04-13
forma_pago=03
moneda=MXN
tipo_cambio=1
cuenta_cobro_id=CC-001
total_pagado=3480.00
aplicaciones=[
  { "serie": "A", "folio": "1234", "importe_aplicado": 1740.00, "num_parcialidad": 1 },
  { "serie": "A", "folio": "1235", "importe_aplicado": 1740.00, "num_parcialidad": 1 }
]
```

---

## Estatus de documentos

`P` Prefactura (sin timbrar) · `R` Registrado/Timbrado (en SAT) · `C` Cancelado · `A` Autorizado

## Multi-tenancy

`empresa_id` y `sucursal_id` van en el JWT. **El frontend NUNCA los envía en el payload.** El backend los toma de la sesión. Cambiar empresa → re-login.
