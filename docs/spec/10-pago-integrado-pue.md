# §10 Pago Integrado PUE — Flujo A (backend-driven)

## Contexto

Las facturas con `metodo_pago = "PUE"` (Pago en una sola exhibición) implican que el pago se recibe en el mismo acto que la factura. El backend registra el ingreso automáticamente cuando recibe los campos de pago dentro del payload de `Add`.

Este documento describe el flujo "Flujo A": el frontend captura los datos de pago y los incluye en el `Add` de factura; el backend crea la factura y el ingreso en un solo paso.

> **Pendiente de validación en backend:** confirmar que el endpoint `ventas:facturas_venta_33:facturas_venta:Add` efectivamente crea el registro de ingreso cuando se reciben los campos de pago. Si el backend requiere refactorización para soportarlo, este flujo queda bloqueado hasta que esté listo.

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

4. Usuario presiona "Prefactura" o "Timbrar"
   → App construye payload Add/AddPrefactura incluyendo campos de pago
   → Backend crea factura + ingreso en un solo call
   → Respuesta: FacturaCompleta → navega a modo lectura
```

---

## Llamadas al backend

### Al seleccionar cliente (ya ocurre hoy)

`SearchCuentasBancariasCliente(cliente_id)` — si devuelve registros, precargar el primero en los campos bancarios de la sección PUE.

> Este call ya se hace en IngresoDetail. En FacturaDetail debe dispararse desde `ClientePickerInline.onSelect` cuando `metodoPago === "PUE"`.

### Al guardar (Add / AddPrefactura)

El payload ya existente se extiende con los campos de pago cuando `metodoPago === "PUE"`:

```
// Campos adicionales al payload estándar de Add
forma_pago=03                          ← ya presente en payload estándar
forma_pago_descr=Transferencia...      ← ya presente
referencia_pago=REF-001                ← nuevo
banco_id=002                           ← nuevo (banco receptor de la empresa)
banco_descr=BANAMEX                    ← nuevo
sat_cta_ori=123456789                  ← nuevo (cuenta origen del cliente)
sat_cta_dest=343434343                 ← nuevo (cuenta destino de la empresa)
sat_banco_dest=002                     ← nuevo
sat_banco_dest_descr=BANAMEX           ← nuevo
```

> `cuenta_cobro_id` — campo actualmente en el draft pero con semántica poco clara para facturas nuevas. **Pendiente confirmar con backend si es necesario o si se puede omitir.**

---

## Campos de la sección PUE (UI)

| Campo visible | Draft field | Param backend | Fuente inicial |
|---|---|---|---|
| Banco receptor | `bancoId` | `banco_id` + `banco_descr` | `SearchCuentasBancariasCliente` → `banco_id` |
| Cuenta origen (cliente) | `satCtaOri` | `sat_cta_ori` | `SearchCuentasBancariasCliente` → `sat_cta_ori` |
| Cuenta destino (empresa) | `satCtaDest` | `sat_cta_dest` | `ValidateLovFieldClientes` → `sat_cta_dest` (si se expone en factura) |
| Banco destino | `satBancoDest` | `sat_banco_dest` + `sat_banco_dest_descr` | `SearchCuentasBancariasCliente` |
| Referencia | `referenciaPago` | `referencia_pago` | Vacío |

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

Extender el bloque condicional PUE:

```typescript
...(draft.metodoPago === "PUE" ? {
  referencia_pago: draft.referenciaPago,
  banco_id: draft.bancoId,
  banco_descr: draft.bancoDescr,
  sat_cta_ori: draft.satCtaOri,
  sat_cta_dest: draft.satCtaDest,
  sat_banco_dest: draft.satBancoDest,
  sat_banco_dest_descr: draft.satBancoDestDescr,
} : {}),
```

### 4. `ClientePickerInline` → callback `onSelect`

Cuando se selecciona cliente y `metodoPago === "PUE"`, hacer call paralelo a `SearchCuentasBancariasCliente` y precargar campos bancarios en el draft.

Alternativa más simple: hacerlo directamente en el handler `handleClienteSelected` de FacturaDetail, que ya existe y recibe el `ClienteLov`.

### 5. Sección PUE en `FacturaDetail.tsx`

Reemplazar los dos inputs actuales por el formulario completo:

```
╔══ PAGO INTEGRADO (PUE) ════════════════╗
║ Banco receptor:  [002 BANAMEX ▼]      ║  ← LOV o texto libre
║ Cta. origen:     [123456789   ]       ║  ← cuenta del cliente
║ Cta. destino:    [343434343   ]       ║  ← cuenta de la empresa
║ Referencia:      [REF-001     ]       ║
╚════════════════════════════════════════╝
```

La sección se muestra solo cuando `metodoPago === "PUE" && !isReadOnly`.

En modo lectura (factura timbrada), si el backend devuelve los datos bancarios en `FacturaCompleta`, mostrarlos como texto.

---

## Pendientes de validación con backend

1. **¿El `Add` de factura crea el ingreso automáticamente** cuando recibe los campos bancarios? ¿O se necesita un endpoint separado?
2. **¿Qué devuelve `FacturaCompleta`** para facturas PUE con pago registrado? ¿Incluye `serie_ingreso` / `folio_ingreso` para poder navegar al ingreso creado?
3. **`cuenta_cobro_id`** — ¿es necesario en el payload? ¿Qué valor toma para una factura nueva?
4. **`sat_cta_dest` y `sat_banco_dest`** — ¿provienen del JWT de empresa o deben enviarse explícitamente?

---

## Lo que NO cambia

- El endpoint sigue siendo `ventas:facturas_venta_33:facturas_venta:Add` (o `AddPrefactura`).
- No hay segundo call a `tesoreria:registro_ingresos_33:registro_ingresos:Add` desde el frontend.
- `forma_pago` y `forma_pago_descr` ya van en el payload estándar; no se duplican.
- Los complementos vacíos (`info_seguros`, etc.) siguen presentes como siempre.
