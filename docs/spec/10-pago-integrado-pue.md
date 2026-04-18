# §10 Pago Integrado PUE — Flujo A (backend-driven)

## Contexto

Las facturas con `metodo_pago = "PUE"` (Pago en una sola exhibición) implican que el pago se recibe en el mismo acto que la factura. El backend registra el ingreso automáticamente cuando recibe los campos de pago dentro del payload de `Add`.

Este documento describe el flujo "Flujo A": el frontend captura los datos de pago y los incluye en el `Add` de factura; el backend crea la factura y el ingreso en un solo paso.

> **Restricciones confirmadas:**
> - El pago integrado **solo aplica al endpoint `Add` (timbrado)**. Las prefacturas (`AddPrefactura`) **no registran ingreso**, independientemente del método de pago.
> - El pago solo se procesa cuando `metodo_pago === "PUE"` en la factura timbrada.
> - El pago se comunica al backend encapsulando todos sus campos bajo el contenedor `generar_ingreso[campo]=valor`. Si el contenedor está ausente o vacío, no se crea ningún ingreso.

---

## Flujo de usuario

```
1. Usuario crea factura nueva
2. En sección COMPROBANTE selecciona:
   - Método pago: PUE
   - Forma pago: (ej. 03 - Transferencia)  ← ya capturado hoy

3. Sección "PAGO INTEGRADO (PUE)" aparece automáticamente
   - Se precarga banco/cuenta del cliente vía SearchCuentasBancariasCliente
   - Usuario revisa/ajusta campos bancarios
   - Usuario ingresa referencia (opcional)

4. Usuario presiona "Timbrar" (solo Add, nunca AddPrefactura)
   → App construye payload Add incluyendo campos de pago + bandera de ingreso
   → Backend crea factura + ingreso en un solo call
   → Respuesta: FacturaCompleta → navega a modo lectura
```

---

## Llamadas al backend

### Al seleccionar cliente (ya ocurre hoy)

`SearchCuentasBancariasCliente(cliente_id)` — si devuelve registros, precargar el primero en los campos bancarios de la sección PUE.

> Este call ya se hace en IngresoDetail. En FacturaDetail debe dispararse desde `ClientePickerInline.onSelect` cuando `metodoPago === "PUE"`.

### Al guardar (solo Add — timbrado)

El pago integrado **nunca se envía en `AddPrefactura`**. El payload se extiende con los campos de pago únicamente cuando `metodoPago === "PUE"` y la acción es `Add`:

```
// Campos adicionales al payload estándar de Add
forma_pago=03                                    ← ya presente en payload estándar
forma_pago_descr=Transferencia...                ← ya presente

// Contenedor de pago — si está presente con datos, el backend crea el ingreso.
// Si se omite o está vacío, no se procesa ningún pago.

// -- Enviados por el frontend --
generar_ingreso[importe]=1234.56          ← por defecto = total de la factura; editable para pago parcial
generar_ingreso[referencia_pago]=REF-001
generar_ingreso[banco_id]=002
generar_ingreso[banco_descr]=BANAMEX
generar_ingreso[sat_cta_ori]=123456789
generar_ingreso[sat_cta_dest]=343434343
generar_ingreso[sat_banco_dest]=002
generar_ingreso[sat_banco_dest_descr]=BANAMEX

// -- Asignados por el backend desde los params de la factura --
// $generar_ingreso["cliente_id"]                 = $params["cliente_id"]
// $generar_ingreso["nombre"]                     = $params["receptor_nombre"]
// $generar_ingreso["rfc"]                        = $params["receptor_rfc"]
// $generar_ingreso["receptor_regimen_fiscal_id"] = $params["receptor_regimen_fiscal_id"]
// $generar_ingreso["codigo_postal"]              = $params["codigo_postal"]
// $generar_ingreso["moneda_id"]                  = $params["moneda_id"]
// $generar_ingreso["tipo_cambio"]                = $params["tipo_cambio"]
// $generar_ingreso["forma_pago"]                 = $params["forma_pago"]
// $generar_ingreso["forma_pago_descr"]           = $params["forma_pago_descr"]
// $generar_ingreso["fecha_pago"]                 = $factura["fecha"]
// $generar_ingreso["descripcion"]                = "PAGO DE FACTURA DE VENTA " . $factura["serie"] . $factura["folio"]
```

> `cuenta_cobro_id` — campo actualmente en el draft pero con semántica poco clara para facturas nuevas. **Pendiente confirmar con backend si es necesario o si se puede omitir.**

---

## Campos de la sección PUE (UI)

| Campo visible | Draft field | Param backend | Fuente inicial |
|---|---|---|---|
| Importe pagado | `importePago` | `generar_ingreso[importe]` | `draft.total` (editable para pago parcial) |
| Banco receptor | `bancoId` | `generar_ingreso[banco_id]` + `generar_ingreso[banco_descr]` | `SearchCuentasBancariasCliente` → `banco_id` |
| Cuenta origen (cliente) | `satCtaOri` | `generar_ingreso[sat_cta_ori]` | `SearchCuentasBancariasCliente` → `sat_cta_ori` |
| Cuenta destino (empresa) | `satCtaDest` | `generar_ingreso[sat_cta_dest]` | `ValidateLovFieldClientes` → `sat_cta_dest` (si se expone en factura) |
| Banco destino | `satBancoDest` | `generar_ingreso[sat_banco_dest]` + `generar_ingreso[sat_banco_dest_descr]` | `SearchCuentasBancariasCliente` |
| Referencia | `referenciaPago` | `generar_ingreso[referencia_pago]` | Vacío |

Todos los campos son editables por el usuario. Los datos bancarios son opcionales para poder guardar (el ingreso sin datos bancarios es válido en el backend).

---

## Cambios necesarios en el frontend

### 1. `FacturaDraft` (types.ts)

Agregar campos bancarios al tipo:

```typescript
// Campos actuales
cuentaCobroId: string;
referenciaPago: string;

// Agregar
importePago: string;       // precargado con draft.total; editable para pago parcial
bancoId: string;
bancoDescr: string;
satCtaOri: string;
satCtaDest: string;
satBancoDest: string;
satBancoDestDescr: string;
```

### 2. `newDraft` / `draftFromFactura` (facturaMappers.ts)

Inicializar los nuevos campos en vacío. En `draftFromFactura` mapear desde la respuesta si el backend los devuelve en `FacturaCompleta`.

### 3. `buildPayload` (facturaMappers.ts)

Extender el bloque condicional PUE, **solo cuando la acción es `"Add"` (no `"AddPrefactura"`)**:

```typescript
...(draft.metodoPago === "PUE" && action === "Add" ? {
  "generar_ingreso[importe]": draft.importePago,   // precargado con total; editable
  "generar_ingreso[referencia_pago]": draft.referenciaPago,
  "generar_ingreso[banco_id]": draft.bancoId,
  "generar_ingreso[banco_descr]": draft.bancoDescr,
  "generar_ingreso[sat_cta_ori]": draft.satCtaOri,
  "generar_ingreso[sat_cta_dest]": draft.satCtaDest,
  "generar_ingreso[sat_banco_dest]": draft.satBancoDest,
  "generar_ingreso[sat_banco_dest_descr]": draft.satBancoDestDescr,
} : {}),
// Si todos los campos bancarios están vacíos, el backend recibe el contenedor vacío
// y no procesa el ingreso. No se requiere lógica adicional en el frontend.
```

### 4. `ClientePickerInline` → callback `onSelect`

Cuando se selecciona cliente y `metodoPago === "PUE"`, hacer call paralelo a `SearchCuentasBancariasCliente` y precargar campos bancarios en el draft.

Alternativa más simple: hacerlo directamente en el handler `handleClienteSelected` de FacturaDetail, que ya existe y recibe el `ClienteLov`.

### 5. Sección PUE en `FacturaDetail.tsx`

Reemplazar los dos inputs actuales por el formulario completo:

```
╔══ PAGO INTEGRADO (PUE) ════════════════╗
║ Importe:         [1,234.56    ]       ║  ← precargado con total; editable
║ Banco receptor:  [002 BANAMEX ▼]      ║  ← LOV o texto libre
║ Cta. origen:     [123456789   ]       ║  ← cuenta del cliente
║ Cta. destino:    [343434343   ]       ║  ← cuenta de la empresa
║ Referencia:      [REF-001     ]       ║
╚════════════════════════════════════════╝
```

La sección se muestra solo cuando `metodoPago === "PUE" && !isReadOnly`. El botón "Prefactura" **no aplica pago**; la sección PUE es irrelevante para ese flujo y el payload de `AddPrefactura` nunca incluye `generar_ingreso` ni los campos bancarios.

En modo lectura (factura timbrada), si el backend devuelve los datos bancarios en `FacturaCompleta`, mostrarlos como texto.

---

## Pendientes de validación con backend

1. **Confirmar que el backend interpreta correctamente `generar_ingreso[campo]=valor`** como contenedor de pago y que omitirlo (o enviarlo vacío) no genera ingreso.
2. **¿Qué devuelve `FacturaCompleta`** para facturas PUE con pago registrado? ¿Incluye `serie_ingreso` / `folio_ingreso` para poder navegar al ingreso creado?
3. **`cuenta_cobro_id`** — ¿es necesario en el payload? ¿Qué valor toma para una factura nueva?
4. **`sat_cta_dest` y `sat_banco_dest`** — ¿provienen del JWT de empresa o deben enviarse explícitamente?

---

## Lo que NO cambia

- El endpoint sigue siendo `ventas:facturas_venta_33:facturas_venta:Add` (o `AddPrefactura`).
- No hay segundo call a `tesoreria:registro_ingresos_33:registro_ingresos:Add` desde el frontend.
- `forma_pago` y `forma_pago_descr` ya van en el payload estándar; no se duplican.
- Los complementos vacíos (`info_seguros`, etc.) siguen presentes como siempre.
