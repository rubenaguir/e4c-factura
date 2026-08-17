# Plan: Botón "Aplicar Pago" en FacturasPage → preselección en IngresoDetail

Fecha: 2026-08-17
Estado: propuesto (no implementado)

## Problema

El usuario recibe la instrucción de aplicar un pago a una factura específica, pero
`IngresoDetail` solo permite buscar cliente por nombre/RFC en texto libre — no hay
forma de llegar ahí ya con el cliente resuelto desde `FacturasPage`. Esto obliga a
un flujo manual: ver la factura → anotar el nombre del cliente → ir a
`/ingresos/nuevo` → buscar por nombre → localizar la factura en la lista de cuentas
por cobrar → marcarla. (`FacturaRow` ya trae `cliente_id` — ver sección siguiente —
lo que falta es el puente de UI entre ambas pantallas.)

## Objetivo

Botón **Aplicar Pago** en cada fila de `FacturasPage` (solo si la factura tiene saldo
pendiente) que abra `IngresoDetail` con el cliente ya seleccionado y la factura ya
marcada en la sección "Facturas a aplicar", dejando el resto del flujo normal
(importe, forma de pago, datos bancarios, Guardar) sin cambios.

**`IngresoDetail.tsx` no cambia visualmente.** No se agrega ningún componente,
banner ni sección nueva a esa pantalla. La preselección es puramente
programática: dispara los mismos handlers que ya existen para la selección
manual de cliente (`handleSearchSelect`) y de factura (`toggleCuenta`), así que
el resultado en pantalla es indistinguible de si el usuario los hubiera hecho a
mano.

## `cliente_id` ya viene en `FacturaRow` (cambio de backend)

`facturas_venta:Search` ahora incluye `cliente_id` en cada registro (cambio de
backend ya aplicado). Esto evita una llamada extra a `Load(serie, folio)` solo para
resolver el cliente: el botón "Aplicar Pago" navega directo usando
`row.cliente_id`, sin round-trip previo. La acción queda **síncrona** — no hay
estado de carga ni manejo de error de red en este handler.

`num_cta_cobrar` también viene en `FacturaRow`, pero no se usa directamente: el flujo de
`IngresoDetail` siempre recarga las cuentas por cobrar vigentes vía
`SearchCuentasCobrar(cliente_id)` al seleccionar cliente (autoritativo, con saldos
actualizados), y la preselección hace *match* por `documento_serie` +
`documento_folio` contra esa lista ya cargada — no por `num_cta_cobrar` directo,
por si cambiara entre la búsqueda y el clic.

## Fase 1 — Specs (antes de código)

Editar `docs/spec/03-api-client.md`:

1. **§Facturas → `FacturaRow`** — agregar el campo `cliente_id: string` a la
   interfaz documentada (línea ~107-136), reflejando que el backend ahora lo
   incluye en la respuesta de `Search`.

Editar `docs/spec/05-screens.md`:

1. **§FacturasPage (consulta)** — agregar a la lista de acciones por fila:
   > `Aplicar Pago` (solo si `estatus === "R"` y `estatus_cxc !== "P"`, i.e. hay saldo
   > pendiente): navega directo a `/ingresos/nuevo` pasando
   > `{ clienteId: row.cliente_id, serie, folio }` como `router state` — ya no
   > requiere una llamada previa a `Load`, `cliente_id` viene incluido en cada
   > `FacturaRow` de `Search` — para preseleccionar cliente y factura en
   > `IngresoDetail`.

2. **§IngresoDetail** — **sin subsección nueva.** La pantalla no cambia
   visualmente: llegar desde "Aplicar Pago" solo dispara, de forma programática,
   las mismas dos acciones que el usuario ya puede hacer a mano — seleccionar un
   cliente del buscador y marcar el checkbox de una factura en la lista. Se
   documenta como una nota corta dentro de cada sección ya existente, no como un
   flujo aparte:
   - En **"### Sección: Cliente"**, agregar al final una nota: al llegar desde el
     botón "Aplicar Pago" de `FacturasPage` (router `state`:
     `{ clienteId, serie, folio }`), el cliente se selecciona automáticamente
     invocando el mismo camino que la selección manual (`ValidateLovFieldClientes`
     + `SearchCuentasBancariasCliente` + `SearchCuentasCobrar`) — no hay UI
     distinta, es la misma tarjeta de cliente que ya se muestra tras cualquier
     selección.
   - En **"### Sección: Facturas a aplicar (multi-factura)"**, agregar al final
     una nota: si la navegación trae `serie`/`folio` de precarga, en cuanto
     resuelve `SearchCuentasCobrar` se marca automáticamente el checkbox de la
     fila cuya `documento_serie`/`documento_folio` coincidan — mismo efecto
     visual que si el usuario la marcara a mano (incluida la regla de
     pre-llenado de importe). Si no aparece en la lista (ya cobrada, cancelada
     entre el clic y la carga, etc.), no se marca nada y se usa el snackbar de
     error ya existente en la pantalla para avisar — no se agrega ningún
     elemento visual nuevo.

## Fase 2 — Código

### 2.1 `src/api/endpoints/facturas.ts`

- Agregar `cliente_id: string;` a la interfaz `FacturaRow` (junto a `receptor_rfc`
  o donde sea más natural en el orden de campos), reflejando el nuevo campo que ya
  devuelve el backend en `Search`.

### 2.2 `src/pages/FacturasPage.tsx`

- Importar un ícono nuevo de `lucide-react` (`Wallet`). No se necesita `loadFactura`
  ni estado de carga — la acción es síncrona.
- Helper `canApplyPago(row: FacturaRow)` → `row.estatus === "R" && row.estatus_cxc !== "P" && !!row.cliente_id`
  (el `!!row.cliente_id` es una guarda defensiva por si algún registro legacy no
  trae el campo aún poblado en el backend).
- Handler `handleAplicarPago(e, row)`:
  ```ts
  const handleAplicarPago = (e: React.MouseEvent, row: FacturaRow) => {
    e.stopPropagation();
    navigate("/ingresos/nuevo", {
      state: { clienteId: row.cliente_id, serie: row.serie, folio: row.folio },
    });
  };
  ```
- Agregar el botón en la celda de acciones de la tabla desktop (junto a Ver/PDF/Correo)
  y en la fila de acciones mobile, condicionado a `canApplyPago(row)` — mismo
  patrón visual/estructural que los botones PDF y Correo ya existentes (sin
  spinner, sin `disabled`, ya que no hay operación async de por medio).

### 2.3 `src/hooks/useIngresoPreselect.ts` (nuevo archivo)

Se aísla en un hook propio en vez de meter la lógica inline en `IngresoDetail.tsx`
porque ese archivo ya tiene 644 líneas (por encima del límite de 400 de
`CLAUDE.md` regla 10a) — no debe crecer más; y porque es lógica de orquestación
claramente separable (regla 10b: la page delega a hooks).

```ts
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSnackbar } from "@/context/useSnackbar";
import type { useIngresoForm } from "@/hooks/useIngresoForm";

type IngresoForm = ReturnType<typeof useIngresoForm>;

interface PreselectState {
  clienteId?: string;
  serie?: string;
  folio?: string;
}

/**
 * Consume el `location.state` dejado por el botón "Aplicar Pago" de FacturasPage:
 * selecciona el cliente y, cuando cargan sus cuentas por cobrar, marca la factura
 * indicada. Debe invocarse en IngresoDetail DESPUÉS del efecto que resetea el
 * formulario en estado "nueva", para que el reset no pise la preselección.
 */
export function useIngresoPreselect(isNew: boolean, form: IngresoForm) {
  const location = useLocation();
  const { showError } = useSnackbar();
  const preselect = (location.state as PreselectState | null) ?? null;
  const clienteAppliedRef = useRef(false);
  const facturaAppliedRef = useRef(false);
  const facturaNotFoundNotifiedRef = useRef(false);

  useEffect(() => {
    if (!isNew || !preselect?.clienteId || clienteAppliedRef.current) return;
    clienteAppliedRef.current = true;
    form.handleSearchSelect(preselect.clienteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew]);

  useEffect(() => {
    if (!preselect?.serie || !preselect?.folio || facturaAppliedRef.current) return;
    if (form.loadingCuentas || form.cuentasCobrar.length === 0) return;

    const cuenta = form.cuentasCobrar.find(
      c => c.documento_serie === preselect.serie && c.documento_folio === preselect.folio
    );
    if (cuenta) {
      facturaAppliedRef.current = true;
      form.toggleCuenta(cuenta.num_cta_cobrar);
    } else if (!facturaNotFoundNotifiedRef.current) {
      facturaNotFoundNotifiedRef.current = true;
      showError(`No se encontró la factura ${preselect.serie}-${preselect.folio} pendiente de pago para este cliente.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cuentasCobrar, form.loadingCuentas]);
}
```

Notas de implementación:
- Los `ref` evitan doble aplicación por el doble-invoke de efectos en React 18
  StrictMode (dev) y por re-renders posteriores.
- No se limpia `location.state` tras consumirlo (se evaluó, pero
  `navigate(..., { replace: true, state: null })` complica la sincronización con
  los dos efectos async); el peor caso — volver por el botón "atrás" del navegador
  a `/ingresos/nuevo` con el `state` viejo — vuelve a preseleccionar el mismo
  cliente/factura, lo cual es un comportamiento razonable, no un bug funcional.

### 2.4 `src/pages/IngresoDetail.tsx`

- Importar `useIngresoPreselect` del nuevo hook.
- Insertar `useIngresoPreselect(isNew, form);` **inmediatamente después** del
  `useEffect` existente que resetea el formulario cuando `isNew` (el bloque
  `useEffect(() => { if (!isNew && serie && folio) {...} else if (isNew) {...
  form.reset(); } }, [serie, folio])`, para que el orden de efectos garantice que
  el reset corre antes que la preselección.
- No se requiere ningún otro cambio en este archivo — toda la lógica nueva vive en
  el hook.

## Fase 3 — Verificación manual

1. `npm run dev`, ir a `/facturas`, filtrar por una factura con `estatus_cxc = SP`
   o `VE`.
2. Confirmar que el botón "Aplicar Pago" aparece (desktop y mobile) y que **no**
   aparece en facturas `estatus_cxc = P`, en prefacturas (`estatus !== "R"`) ni en
   canceladas.
3. Clic en "Aplicar Pago" → navega de inmediato a `/ingresos/nuevo`, y ahí (ya
   async, dentro de `IngresoDetail`) se ve el cliente correcto cargándose
   (nombre/RFC visibles, datos bancarios precargados si el cliente tiene
   historial) y la factura correspondiente queda marcada con su importe por
   defecto en cuanto resuelve `SearchCuentasCobrar`.
4. Completar forma de pago y Guardar → confirmar que el flujo normal de
   `IngresoDetail` (Guardar → Timbrar) no se alteró.
5. Caso borde: aplicar pago sobre una factura y, en otra pestaña, cancelar/cobrar
   esa cuenta antes de que cargue `SearchCuentasCobrar` — confirmar que se muestra
   el snackbar de "no se encontró" y el formulario queda utilizable (sin factura
   marcada).
6. `npm run build` (o `tsc --noEmit`) para confirmar tipos.

## Fuera de alcance

- No se toca el backend PHP.
- No se resuelve el ya-existente exceso de 400 líneas en `FacturasPage.tsx` /
  `IngresoDetail.tsx` (deuda preexistente) — solo se evita agravarlo metiendo la
  lógica nueva de orquestación en un hook separado.
- No se limpia el `router state` tras consumirlo (ver nota en 2.3).
