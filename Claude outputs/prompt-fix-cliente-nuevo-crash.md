# Prompt — Fix crash en /clientes/nuevo ("Cannot read properties of null (reading 'nombre')")

## Causa raíz (confirmada en código, no hace falta investigar más)

`src/App.tsx:63-64` tiene dos rutas para `ClienteDetail`:
```
{ path: "clientes/nuevo", element: <ClienteDetail /> },
{ path: "clientes/:id",   element: <ClienteDetail /> },
```
En la ruta `clientes/nuevo` no hay `:id`, así que `useParams<{id}>()` regresa
`id: undefined`. `ClienteDetail.tsx:184` calcula:
```ts
const isNew = id === "nuevo";   // undefined === "nuevo" → false
```
Con `isNew` en `false`, el `useEffect` de la línea 224 no corta temprano, y
como `state.selected` arranca en `null` (`ClientesContext.tsx`, initialState),
la condición `state.selected?.cliente_id === id` da `undefined === undefined`
→ `true`, así que llama `populateForm(null)`, que revienta en
`d.nombre` (línea 255) porque `d` es `null`. Eso es el
`TypeError: Cannot read properties of null (reading 'nombre')` reportado en
producción — crash inmediato al montar, sin red de por medio.

`FacturaDetail.tsx:44`, `IngresoDetail.tsx:145` y `ProductoDetail.tsx:165`
NO tienen este bug — calculan `isNew` por ausencia del parámetro
(`!serie && !folio`, `!id`, `!id || id === "nuevo"`), no por comparación
exacta de string. Solo `ClienteDetail.tsx` usa el patrón frágil.

## El fix

**`src/pages/ClienteDetail.tsx:184`**, un cambio de una línea:
```ts
// antes:
const isNew = id === "nuevo";
// después:
const isNew = !id || id === "nuevo";
```
(mismo patrón que ya usa `ProductoDetail.tsx:165` — cúbrelo también por si
algún día cambia el ruteo, no solo por el caso de `id` ausente).

## Qué NO hacer

- No toques `App.tsx` ni las rutas — el patrón de ruta doble
  (`x/nuevo` + `x/:id`) es el mismo que usan Facturas/Ingresos/Productos,
  no hace falta unificarlo ni quitarlo.
- No toques `ClientesContext.tsx` ni `populateForm` — el fix es solo la
  detección de `isNew`.
- No repitas este patrón de `useParams` con comparación de string en
  ningún otro archivo — si ves algo similar en otro lado, repórtalo, no lo
  cambies sin que te lo pida.

## Al terminar

- Confirma el cambio (archivo:línea, antes/después).
- Reproduce el bug ANTES del fix (opcional, si es rápido) y confirma que
  YA NO truena después del fix, navegando directo a `/clientes/nuevo` desde
  cero (recarga completa de la página, no solo click interno, para
  garantizar que `state.selected` arranca en `null` como en producción).
- Confirma que crear un cliente nuevo de principio a fin sigue funcionando
  (guardar, redirect a `/clientes/:id` con el id real).
- Corre `npx tsc --noEmit`.
