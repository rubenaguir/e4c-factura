# §10 Plan de Implementación por Fases

## Fase 1 — Infraestructura base

**Entregable:** app que arranca, hace login JWT, shell navegable, PWA instalable.

1. `npm create vite@latest sv3-facturacion-pwa -- --template react-ts`
2. Instalar Tailwind + shadcn/ui (Button, Input, Label, Alert, Card, Skeleton, Badge, Dialog, Sheet, Table, Select)
3. Instalar `react-router-dom@6`, `react-hook-form`, `zod`, `lucide-react`, `vite-plugin-pwa`, `@tanstack/react-virtual`
4. `src/api/client.ts`
5. `AuthContext` + `LoginPage` + guard en router
6. `AppShell` + `Sidebar` + `TopBar` + `BottomNav`
7. Manifest + SW (precaché solo)
8. Verificar login contra backend real

**Leer antes:** `docs/spec/03-api-client.md`, `docs/spec/04-state.md`, `docs/spec/06-pwa-layout.md`

**Éxito:** login, shell, logout, PWA instalable en Chrome/Edge.

---

## Fase 2 — Catálogo de Clientes

**Entregable:** CRUD completo de clientes.

1. `endpoints/clientes.ts`
2. `ClientesContext`
3. `ClientesPage` (filtros + tabla/cards + paginación)
4. `ClienteDetail` (Generales + Domicilios)
5. `ValidateCodigoPostal` integrado

**Leer antes:** `docs/spec/03-api-client.md` §Clientes, `docs/spec/04-state.md`

**Éxito:** CRUD funcional sin re-fetches innecesarios.

---

## Fase 3 — Catálogo de Productos

**Entregable:** CRUD completo de productos con búsqueda virtualizada.

Módulo backend: `inventarios:catalogo_inventarios:catalogo_inventarios:*`

1. `endpoints/productos.ts` — wraps `Search`, `Load`, `Add`, `Update`
2. `ProductosContext` con paginación server-side + debounce 300ms
3. `ProductosPage` virtualizada (`@tanstack/react-virtual`)
4. `ProductoDetail` — lectura + edición + alta inline

**Leer antes:** `docs/spec/03-api-client.md` §"Productos — Catálogo", `docs/spec/04-state.md`

**Éxito:** búsqueda fluida con >10k registros; alta y edición funcionales contra backend real.

---

## Fase 4 — Facturación

**Entregable:** registro de factura completa (pre y con timbre).

1. `CatalogosContext` con LOVs SAT
2. `endpoints/facturas.ts`
3. `FacturasContext` con `addPrefactura`, `stamp`, `cancel`
4. `FacturasPage` (consulta)
5. `FacturaDetail`:
   - ClientePicker con alta inline
   - ProductoPicker con alta inline
   - Grid de conceptos editable
   - Preview de impuestos (cálculo en frontend)
   - Moneda/TC
   - Pago integrado (PUE)
   - Guardar Prefactura / Timbrar / Cancelar
6. PDF download

**Leer antes:** `docs/spec/03-api-client.md`, `docs/spec/05-screens.md` (toda la sección)

**Éxito:** facturar PUE y PPD contra backend real con timbrado SAT.

---

## Fase 5 — Ingresos / Pagos

**Entregable:** registro de pago (REP) aplicado a una factura.

1. `endpoints/ingresos.ts` — wraps: `Search`, `Load`, `LoadLovFieldClientes`, `ValidateLovFieldClientes`, `SearchCuentasBancariasCliente`, `SearchCuentasCobrar`, `Add`, `Stamp`, `Cancel33`, `SendMail`, `PrintPdf`
2. `IngresosContext` — `search`, `load`, `add`, `stamp`, `cancel`, `sendMail`
3. `IngresosPage` — búsqueda con filtros (fecha pago, RFC, nombre, serie/folio factura, estatus)
4. `IngresoDetail`:
   - ClientePicker (`ValidateLovFieldClientes` / LOV `LoadLovFieldClientes`)
   - Al seleccionar cliente: `SearchCuentasBancariasCliente` + `SearchCuentasCobrar` en paralelo
   - Selector de una sola factura (no grid multi-selección)
   - Precarga de `importe` con el saldo de la factura seleccionada
   - Campos de pago: fecha, forma pago, moneda, TC, importe, descripción, referencia
   - Campos bancarios: precargados desde historial del cliente
   - Botones según estado: Guardar / Timbrar / PDF / Correo / Cancelar
5. Payload `Add`: solo el registro `cuentas_cobrar[0][...]` de la factura seleccionada — no enviar registros con `importe=0`

**Leer antes:** `docs/spec/03-api-client.md` §Ingresos, `docs/spec/05-screens.md` §IngresoDetail

**Éxito:** registrar un pago aplicado a una factura, timbrar REP (PPD automático / PUE manual), PDF y correo funcionales.

---

## Fase 6 — PWA en producción

1. `vite build`
2. Despliegue en raiz Apache (`/`)
3. QA Chrome desktop + Android + iOS Safari
4. Activar runtime caching de lecturas

**Leer antes:** `docs/spec/06-pwa-layout.md`

---

## Fase 7 — Mejoras iterativas

- Notificaciones push (MQTT/WebPush)
- CRUD completo de productos (pendiente agent backend)
- Contactos de cliente y expedientes
- Dashboards móviles

---

## Fuera de alcance

- CRM (prospectos, oportunidades, activities)
- Notas de crédito
- Pedidos de venta
- Comercio exterior, adendas, seguros (complementos opcionales — Fase 4 los envía vacíos)
- Reportes (permanecen en ExtJS)
- Carga masiva de catálogos
- Tests automatizados
- i18n (solo español mexicano)
