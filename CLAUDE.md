# CLAUDE.md

PWA React 19 de facturación (CFDI 4.0) y pagos (REP) para Empresa4Cero.
Reemplaza pantallas ExtJS 3.4. Consume backend PHP como API externa sin modificarlo.

## Setup

```bash
npm install && npm run dev
# Copiar .env.example → .env.local
VITE_API_BASE_URL=http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php
VITE_XDEBUG_ENABLED=false
```

Backend: `C:\wamp\www\SisnetV3Desarrollo\`  
Endpoint único: `POST http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php`

---

## Reglas críticas (memorizar, no requieren leer el spec)

1. **Impuestos: authoritative en el frontend.** Productos devuelven `impuestos_traslados`/`impuestos_retenciones` con `importe: "0"`. La UI calcula `importe = base × tasa` y envía el array completo en cada concepto de `Add`/`AddPrefactura`. El backend no los recalcula.

2. **Todos los valores numéricos van como string** en el payload (paridad con el serializador ExtJS del backend PHP).

3. **Mutaciones siempre online.** Sin Background Sync ni optimistic offline. Timbrado CFDI es síncrono contra el SAT.

4. **JWT en `localStorage` key `sv3_session`.** Solo leer/escribir desde `AuthContext`.

5. **`HashRouter`** (no `BrowserRouter`) — Apache sin reglas de reescritura.

6. **Complementos en el payload siempre presentes, aunque vacíos:** `info_seguros`, `comercio_exterior`, `compl_serv_par_construc`, `detallista`.

7. **`empresa_id`/`sucursal_id` nunca en el payload** — el backend los toma del JWT.

8. **`app_api.php` en `modules/ventas/facturas_venta_33/` — ignorar**, es una implementación anterior fallida.

9. **Mensajes del backend, nunca hardcodeados.** Errores → `response.msg ?? response.Message ?? "Error desconocido"`. Éxito en mutaciones → `response.msg`. Solo usar texto fijo si el backend no devuelve ninguno de estos campos.

---

## Patrón de llamada al backend

```typescript
// src/api/client.ts
export async function apiCall<T>(opReq: string, params: Record<string, string | number | boolean> = {}): Promise<T>
// Body: URLSearchParams { opReq, session (JWT), ...params }
// POST siempre, Content-Type: application/x-www-form-urlencoded
// forceLogout === "S" → limpiar token y redirigir /login
```

Módulos principales:

| Módulo | opReq prefix |
|---|---|
| Facturas | `ventas:facturas_venta_33:facturas_venta:*` |
| Conceptos/productos | `ventas:facturas_venta_33:facturas_venta_conceptos:*` |
| Ingresos/REP | `tesoreria:registro_ingresos_33:registro_ingresos:*` |
| Clientes | `ventas:clientes:clientes:*` |
| LOVs SAT y Clientes LOV | `Lov:Lov:Lov:*` |
| Auth | `seguri:acceso:acceso_jwt:*` |

---

## Stack

React 19 · Vite 5 · TypeScript 5 · React Router v6 · Tailwind 3 · shadcn/ui · React Hook Form 7 · Zod 3 · Lucide · vite-plugin-pwa · @tanstack/react-virtual

**No usar:** Redux, Zustand, TanStack Query, Axios, SWR, MUI.

---

## Spec dividida por sección (leer solo lo necesario)

| Cuándo leer | Archivo |
|---|---|
| Contexto del proyecto, stack, restricciones | `docs/spec/01-context-stack.md` |
| Estructura de carpetas y naming | `docs/spec/02-structure.md` |
| **API client, endpoints, payloads** (leer siempre al tocar API) | `docs/spec/03-api-client.md` |
| Context/state patterns, AuthContext | `docs/spec/04-state.md` |
| **Pantallas, flujos, payload completo AddPrefactura** | `docs/spec/05-screens.md` |
| PWA, layout responsivo, SW, errores, i18n | `docs/spec/06-pwa-layout.md` |
| Plan por fases con referencias cruzadas | `docs/spec/07-phases.md` |
| Decisiones de diseño (por qué se eligió X) | `docs/spec/08-decisions.md` |
| Contratos backend ingresos (ejemplos request/response) | `docs/spec/09-sv3-contracts-ingresos.md` |
| **Pago integrado PUE en FacturaDetail** (pendiente backend) | `docs/spec/10-pago-integrado-pue.md` |

### Qué leer por fase

- **Fase 1** (infra, auth, shell, PWA): `03-api-client.md` + `04-state.md` + `06-pwa-layout.md`
- **Fase 2** (clientes): `03-api-client.md` §Clientes + `04-state.md`
- **Fase 3** (productos): `03-api-client.md` §Productos + `04-state.md`
- **Fase 4** (facturación): `03-api-client.md` + `05-screens.md` completos
- **Fase 5** (ingresos): `03-api-client.md` §Ingresos + `05-screens.md` §IngresoDetail
- **Fase 6** (deploy): `06-pwa-layout.md`
