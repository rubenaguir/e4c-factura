# §3 Estructura del Proyecto

```
src/
├── main.tsx                     ← entrada, registra SW, providers (incluye SnackbarProvider)
├── App.tsx                      ← router root (HashRouter)
│
├── api/
│   ├── client.ts                ← fetch base, flattenParams, errores, forceLogout
│   └── endpoints/
│       ├── auth.ts
│       ├── facturas.ts
│       ├── ingresos.ts
│       ├── clientes.ts
│       ├── productos.ts
│       └── lovs.ts              ← LOVs SAT (nombre real; no catalogos.ts)
│
├── context/
│   ├── AuthContext.tsx          ← incluye biometría y auto-refresh de JWT
│   ├── FacturasContext.tsx
│   ├── IngresosContext.tsx
│   ├── ClientesContext.tsx
│   ├── ProductosContext.tsx
│   ├── CatalogosContext.tsx
│   ├── SnackbarContext.tsx      ← toast global (showError / showSuccess)
│   ├── snackbar-context-def.ts  ← definición de tipos del contexto
│   └── useSnackbar.ts           ← hook de acceso al snackbar
│
├── hooks/
│   ├── useAuth.ts
│   ├── useIngresoForm.ts        ← estado y lógica completa de IngresoDetail
│   ├── useLov.ts                ← helper para cargar LOVs lazy
│   └── usePwaInstall.ts
│
├── lib/
│   ├── biometric.ts             ← WebAuthn wrapper (checkSupport, register, verify)
│   ├── biometricStorage.ts      ← cifrado AES-GCM de credenciales en localStorage
│   ├── pdf.ts                   ← helpers para manejar Blob de PDF
│   └── utils.ts                 ← utilidades generales (cn, etc.)
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── BottomNav.tsx
│   │   ├── MobileDrawer.tsx     ← drawer de navegación mobile
│   │   └── navItems.ts          ← definición de ítems de navegación
│   ├── BiometricBanner.tsx      ← banner de activación biométrica post-login
│   ├── PwaUpdateBanner.tsx      ← banner de actualización del SW
│   └── ui/                      ← shadcn/ui generados aquí
│
├── modules/
│   └── facturacion/             ← partes de FacturaDetail (SOLID S)
│       ├── types.ts             ← DraftImpuesto, DraftConcepto, FacturaDraft, Totales
│       ├── facturaUtils.ts      ← newKey, helpers fecha/formato, calcBase/calcTotales
│       ├── facturaMappers.ts    ← newDraft, draftFromFactura, buildPayload, conceptoFrom*
│       ├── pdfSheetState.ts     ← estado del visor de PDF
│       ├── useIsDesktop.ts      ← hook breakpoint md (768px)
│       ├── InlineModal.tsx      ← Sheet (mobile) / Dialog (desktop)
│       ├── PdfSheet.tsx         ← visor de PDF incrustado (Sheet/modal)
│       ├── ClientePickerInline.tsx  ← búsqueda + alta inline de cliente
│       ├── ProductoPickerInline.tsx ← búsqueda + alta inline de producto/SKU
│       ├── ConceptoSheet.tsx    ← editor de concepto con impuestos
│       ├── CancelDialog.tsx     ← diálogo cancelación SAT (motivos)
│       └── MailDialog.tsx       ← diálogo envío de correo
│
└── pages/
    ├── LoginPage.tsx
    ├── FacturasPage.tsx
    ├── FacturaDetail.tsx        ← orquestación + estado
    ├── IngresosPage.tsx
    ├── IngresoDetail.tsx        ← delega estado a useIngresoForm
    ├── ClientesPage.tsx
    ├── ClienteDetail.tsx
    ├── ProductosPage.tsx
    └── ProductoDetail.tsx
```

## Naming conventions

| Tipo | Convención | Ejemplo |
|---|---|---|
| Página | `PascalCase` + `Page`/`Detail` | `FacturasPage.tsx` |
| Context | `PascalCase` + `Context` | `FacturasContext.tsx` |
| Hook | `camelCase` con `use` | `useAuth.ts` |
| Endpoint file | `camelCase` | `facturas.ts` |
| Componente reutilizable | `PascalCase` | `BiometricBanner.tsx` |
| Tipos de módulo | `camelCase` + `types` | `types.ts` |
| Utils puros de módulo | `camelCase` + `Utils` | `facturaUtils.ts` |
| Mappers de módulo | `camelCase` + `Mappers` | `facturaMappers.ts` |
| Picker inline (módulo) | `PascalCase` + `Inline` | `ClientePickerInline.tsx` |

## Rutas del router

```
/login                   → LoginPage
/                        → AppShell (guard: !isAuthenticated → /login)
  /facturas              → FacturasPage
  /facturas/nuevo        → FacturaDetail (nueva)
  /facturas/:serie/:folio → FacturaDetail (existente)
  /ingresos              → IngresosPage
  /ingresos/nuevo        → IngresoDetail (nueva)
  /ingresos/:serie/:folio → IngresoDetail (existente)
  /clientes              → ClientesPage
  /clientes/nuevo        → ClienteDetail (nuevo)
  /clientes/:id          → ClienteDetail (existente)
  /productos             → ProductosPage
  /productos/nuevo       → ProductoDetail (nuevo)
  /productos/:id         → ProductoDetail (existente) ← param es :id, no :sku
```

---

## Reglas SOLID — todo el proyecto

Principios aplicados a todas las capas. Originados en la refactorización de `FacturaDetail.tsx`
(1 667 líneas → ≈ 380 + módulos); extender el mismo patrón a cualquier archivo que supere las
**400 líneas** o que mezcle más de una responsabilidad.

### S — Single Responsibility

Cada archivo tiene **una sola razón para cambiar**. Guía por capa:

| Capa | Razón de cambio permitida |
|---|---|
| `api/client.ts` | Transporte HTTP y manejo de `forceLogout` |
| `api/endpoints/*.ts` | Contratos de un único módulo de negocio |
| `context/*Context.tsx` | Estado y operaciones de un único dominio |
| `hooks/useXxxForm.ts` | Estado y lógica de formulario de un Detail |
| `modules/xxx/types.ts` | Estructura de tipos del draft local |
| `modules/xxx/xxxUtils.ts` | Lógica de cálculo pura (sin efectos) |
| `modules/xxx/xxxMappers.ts` | Mapeo draft ↔ payload de API |
| `modules/xxx/XxxPicker.tsx` | UX de un único selector inline |
| `pages/XxxDetail.tsx` | Orquestación y estado principal |

Cuando un archivo mezcla más de una razón, extraer a `utils`, `mappers` o sub-componente.

### O — Open/Closed

- Los mappers (`buildPayload`, etc.) se extienden añadiendo campos al tipo, sin tocar la UI.
- Los componentes contenedor (`InlineModal`, `AppShell`) son abiertos a nuevos `children`;
  cerrados a cambios de layout interno.
- Los archivos `api/endpoints/*.ts` son cerrados entre sí: un endpoint de facturas no importa
  nada de ingresos ni clientes.

### I — Interface Segregation

- Los `Props` de cada componente son mínimos: solo lo que ese componente necesita.
- Las páginas (`XxxDetail`) no exponen su estado interno; los sub-componentes reciben solo
  lo estrictamente necesario por props.
- Los contextos exponen solo lo que sus consumidores usan directamente — no re-exportar el
  estado interno completo.
- Los hooks (`useIngresoForm`, `useAuth`) exponen una interfaz estrecha; el componente
  consumidor ignora los detalles de implementación.

### D — Dependency Inversion

- **Regla de Detail pages:** toda página de edición (`XxxDetail`) debe delegar su estado y
  lógica a un hook `useXxxForm`. La página se limita a orquestar renders y callbacks.
  - Implementado: `useIngresoForm` → `IngresoDetail`
  - Deuda técnica pendiente: `useFacturaForm`, `useClienteForm`, `useProductoForm`
- Los sub-componentes (`ClientePickerInline`, `ProductoPickerInline`, pickers futuros) reciben
  callbacks (`onSelect`, `onAdd`) en lugar de mutar estado directamente.
- Los endpoints reciben parámetros; nunca leen contexto ni estado global por sí mismos.
