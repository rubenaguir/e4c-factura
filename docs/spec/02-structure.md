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

## Reglas SOLID aplicadas (módulo facturación)

Patrón adoptado al refactorizar `FacturaDetail.tsx` (1 667 líneas → ≈ 380 + módulos).
Aplicar el mismo patrón a nuevos módulos que superen las 400 líneas.

### S — Single Responsibility

Cada archivo tiene **una sola razón para cambiar**:

| Archivo | Razón de cambio |
|---|---|
| `types.ts` | Estructura del draft local |
| `facturaUtils.ts` | Lógica de cálculo (impuestos, fechas) |
| `facturaMappers.ts` | Reglas de mapeo draft ↔ API payload |
| `ClientePickerInline.tsx` | UX del selector de cliente |
| `ProductoPickerInline.tsx` | UX del selector de producto |
| `ConceptoSheet.tsx` | Formulario de edición de concepto |
| `CancelDialog.tsx` | Diálogo de cancelación SAT |
| `MailDialog.tsx` | Diálogo de envío por correo |
| `FacturaDetail.tsx` | Orquestación y estado principal |

### O — Open/Closed

- Los mappers (`buildPayload`, `buildConceptoPayload`) se extienden añadiendo campos al tipo,
  sin modificar la UI.
- `InlineModal` es abierto a nuevos contenidos vía `children`; cerrado a cambios de layout.

### I — Interface Segregation

- Los `Props` de cada sub-componente son mínimos y acotados a lo que ese componente necesita.
- `FacturaDetail` no expone su estado interno; los sub-componentes reciben sólo lo necesario
  por props.

### D — Dependency Inversion

- Los sub-componentes (`ClientePickerInline`, `ProductoPickerInline`) reciben callbacks
  (`onSelect`, `onAdd`) en lugar de mutar estado directamente.
- `FacturaDetail` controla el estado; los sub-componentes son stateless respecto al draft
  principal.
