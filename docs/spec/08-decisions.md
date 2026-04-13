# §11 Decisiones de Diseño Registradas

| # | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| 1 | Proyecto React separado | Integrar en el mismo WAMP con ExtJS | Deploy independiente, stacks desacoplados |
| 2 | `fetch` nativo | Axios, TanStack Query | Sin dependencias extra, control total |
| 3 | React Context para caché | Redux, Zustand | Suficiente a esta escala |
| 4 | `HashRouter` | `BrowserRouter` | Sin configuración Apache adicional |
| 5 | JWT en body (`session`) | Header `Authorization: Bearer` | Paridad con el resto del stack PHP |
| 6 | Impuestos calculados en el cliente | Recalcular en backend | El backend recibe `importe` por línea; la UI ExtJS permite editar impuestos por concepto (paridad requerida) |
| 7 | Mutaciones siempre online (sin Background Sync) | Cola offline | CFDI es síncrono contra SAT; diferir genera inconsistencias fiscales |
| 8 | shadcn/ui | MUI, Ant Design | Sin runtime, Tailwind-native |
| 9 | Alta inline de cliente/producto en Facturación | Navegar a pantalla de alta | Reduce fricción del flujo principal |
| 10 | Virtualización solo en Productos | Virtualizar todos los listados | Solo productos justifica >10k filas |
| 11 | PWA con VitePWA / Workbox | PWA manual o Next.js | Menor config, HMR intacto |
| 12 | Sin cache offline de mutaciones | Persistencia optimista | Facturación es operación fiscal: no se tolera divergencia |
