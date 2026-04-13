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

### Estructura visual

```
PageHeader + Acciones: [Guardar Prefactura] [Timbrar] [Cancelar] [Volver]

┌── Cliente ──────────────────────────────────────────────────┐
│ ClientePicker (con alta inline)                             │
│ RFC · Razón Social · Uso CFDI · Régimen fiscal              │
└─────────────────────────────────────────────────────────────┘
┌── Comprobante ───────────────────────────────────────────────┐
│ Serie · Folio · Fecha · Moneda · TC                         │
│ Lista precios · Vendedor · Centro costo/utilidad            │
│ Método pago (PUE/PPD) · Forma pago · Condiciones            │
│ A crédito · Fecha vcto · Orden compra                       │
└─────────────────────────────────────────────────────────────┘
┌── Conceptos ─────────────────────────────────────────────────┐
│ [+ Producto] (ProductoPicker con alta inline)               │
│ SKU · Descripción (editable) · UM · Cant · Precio · Desc    │
│ Subtotal · IVA · Retenciones · Total                        │
└─────────────────────────────────────────────────────────────┘
┌── Pago (opcional, solo PUE) ────────────────────────────────┐
│ Cuenta cobro · Fecha · Referencia · Monto                   │
└─────────────────────────────────────────────────────────────┘
```

### Alta inline de cliente (ClientePicker)

Sin resultado → botón **"+ Registrar cliente nuevo"** → `<Sheet>` (mobile) / `<Dialog>` (desktop):
- RFC *, Razón social *, Régimen fiscal *, CP fiscal *
- Guarda → `ventas:clientes:clientes:Add` → auto-selecciona → `ClientesContext.invalidate()`.

### Alta inline de producto (ProductoPicker)

Mismo patrón. Campos mínimos:
- SKU *, Descripción *, Unidad de medida *, Clave SAT prod/serv *, Almacenable (S/N) *, Esquema impuestos *
- Guarda → endpoint Add productos (pendiente §4.6.5).

### Cálculo de impuestos (AUTHORITATIVE en frontend)

1. Al agregar concepto → copiar `impuestos_traslados`/`impuestos_retenciones` del producto.
2. Calcular `importe` = `base × tasa` (base = `cantidad × precio − descuento`; cuota fija si `tipo_factor === 'Cuota'`).
3. Usuario puede **agregar / quitar / editar impuestos por línea**.
4. Recalcular totales al cambiar cantidad, precio, descuento o impuestos.
5. El payload `Add`/`AddPrefactura` envía `impuestos_traslados` + `impuestos_retenciones` con `importe` calculado.

### Prefactura vs. Timbrado

- **Guardar Prefactura** → `AddPrefactura` (o `UpdatePrefactura`). Estatus `R`. Sin SAT.
- **Timbrar directo** → `Add` (crea + timbra).
- **Timbrar prefactura existente** → `Stamp(serie, folio)`.
- Respuesta exitosa → navegar a `/facturas/:serie/:folio` en modo lectura.

### Moneda y tipo de cambio

- Default MXN, TC = 1 (ocultos hasta expandir "Divisa").
- Al cambiar a USD/EUR → input TC manual + botón "Sugerir TC del día" (LOV).
- Al cambiar lista de precios o moneda → reemplazar `precio_unitario` de cada concepto usando `precios[]` del producto (match por `lista_precios_id` o `moneda_id`).

### Pago integrado

- PUE + "Integrar datos de pago" → incluir `cuenta_cobro_id`, `forma_pago`, `referencia_pago` en el Add.
- PPD → panel de pago deshabilitado (pago va por REP en Ingresos).

### Complementos opcionales (Fase 4: vacíos)

`info_seguros`, `comercio_exterior`, `compl_serv_par_construc`, `detallista` — siempre incluir en el payload aunque vacíos.

### Estados y botones disponibles

| Estatus | Acciones |
|---|---|
| `R` Prefactura | Editar · Timbrar · Eliminar |
| `T` Timbrada | Ver PDF · Enviar correo · Cancelar (solo lectura) |
| `C` Cancelada | Ver PDF · Ver acuse (solo lectura) |

---

## FacturasPage (consulta)

- Filtros: rango fechas (default −30 días), cliente, serie, folio, estatus, UUID.
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

## Payload real — `AddPrefactura`

```json
{
  "serie": "", "folio": "", "estatus_sat": "",
  "empresa_id": "", "notas_impresion": "", "observaciones": "",
  "estatus": "", "fecha": "", "cliente_id": "6",
  "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
  "receptor_rfc": "RAVM810219IW0",
  "receptor_regimen_fiscal_id": "612",
  "lista_precios_id": "",
  "calle": "", "no_exterior": "", "no_interior": "",
  "colonia": "", "municipio": "", "codigo_postal": "",
  "localidad": "", "estado": "", "pais": "MEX",
  "vendedor_id": "", "vendedor_nombre": "",
  "centro_costo_id": "", "centro_utilidad_id": "",
  "condiciones_de_pago": "", "confirmacion_sat": "",
  "uso_id": "G03", "uso_descr": "Gastos en general",
  "metodo_pago": "PPD", "metodo_pago_descr": "Pago en parcialidades o diferido",
  "moneda_id": "MXN", "tipo_cambio": "1", "decimales_sat": "2",
  "forma_pago": "99", "forma_pago_descr": "Por definir",
  "fecha_vencimiento": "13/05/2026", "a_credito": "N",
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
    "aseguradora_id": "", "poliza": "", "vehiculo_serie": "",
    "deducible_porcentaje": "0", "deducible_importe": "0", "integra_deducible": "N"
  },
  "comercio_exterior": {
    "tipo_operacion": "", "clave_de_pedimento": "", "incoterm": "",
    "subdivision": "0", "tipo_cambio_usd": "", "total_usd": ""
  },
  "detallista": {
    "document_status": "", "requestForPaymentIdentification": "",
    "buyer": { "gln": "", "personOrDepartmentName": "" },
    "seller": { "gln": "", "type": "" }
  },
  "es_prefactura": "S"
}
```

**Notas del payload:**
- `es_prefactura: "S"` para `AddPrefactura`, `"N"` para `Add` (timbrado directo).
- Todos los valores numéricos viajan **como string**.
- Los bloques de complementos (`info_seguros`, `comercio_exterior`, etc.) se envían siempre, vacíos en Fase 4.

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

`R` Registrado · `T` Timbrado · `C` Cancelado · `P` Procesado · `A` Autorizado

## Multi-tenancy

`empresa_id` y `sucursal_id` van en el JWT. **El frontend NUNCA los envía en el payload.** El backend los toma de la sesión. Cambiar empresa → re-login.
