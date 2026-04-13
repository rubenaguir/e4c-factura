# §1–2 Contexto, Objetivos y Stack

## 1. Contexto y Objetivos

PWA React de facturación para **Sisnet V3 / PLANATOR ERP**. Reemplaza pantallas ExtJS 3.4 progresivamente consumiendo el backend PHP existente como API externa.

**Scope:** Facturación (CFDI 4.0), Pagos (REP), Catálogo Clientes, Catálogo Productos.

### Restricciones clave

- Backend PHP (`SisnetV3Desarrollo/`) **no se modifica** — API externa.
- Conectividad: `fetch` nativo. Sin Axios.
- Estado: React Context. Sin Redux/Zustand/TanStack Query.
- **Online-first.** Mutaciones (timbrado) siempre online — no Background Sync.
- **Cálculo de impuestos: authoritative en el frontend.** Los productos devuelven `impuestos_traslados`/`impuestos_retenciones` resueltos. La UI calcula `importe` por impuesto y envía el array completo en cada concepto de `Add`/`AddPrefactura`.
- Los listados se mantienen en Context durante la sesión (no re-fetch al volver de un detalle).
- `modules/ventas/facturas_venta_33/app_api.php` — implementación anterior fallida, **ignorar**.

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 19 |
| Build | Vite | 5.x |
| Lenguaje | TypeScript | 5.x |
| Routing | React Router | v6 |
| Estilos | Tailwind CSS | 3.x |
| Componentes UI | shadcn/ui | latest |
| Formularios | React Hook Form | 7.x |
| Validación | Zod | 3.x |
| Iconos | Lucide React | latest |
| PWA | vite-plugin-pwa | latest |
| Virtualización | @tanstack/react-virtual | latest |

**NO usar:** Redux, Zustand, TanStack Query, Axios, SWR, MobX, Material UI.
