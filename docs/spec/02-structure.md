# §3 Estructura del Proyecto

```
src/
├── main.tsx                     ← entrada, registra SW, providers
├── App.tsx                      ← router root (HashRouter)
│
├── api/
│   ├── client.ts                ← fetch base, errores, token, forceLogout
│   └── endpoints/
│       ├── auth.ts
│       ├── facturas.ts
│       ├── ingresos.ts
│       ├── clientes.ts
│       ├── productos.ts
│       └── catalogos.ts         ← LOVs SAT
│
├── context/
│   ├── AuthContext.tsx
│   ├── FacturasContext.tsx
│   ├── IngresosContext.tsx
│   ├── ClientesContext.tsx
│   ├── ProductosContext.tsx
│   └── CatalogosContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts                ← wrapper fetch con loading/error
│   ├── useDebounce.ts           ← búsquedas incrementales (300ms)
│   └── usePwaInstall.ts
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── BottomNav.tsx
│   │   └── PageHeader.tsx
│   ├── pickers/
│   │   ├── ClientePicker.tsx    ← combo con alta inline
│   │   ├── ProductoPicker.tsx   ← combo con alta inline + virtualizado
│   │   ├── MonedaPicker.tsx
│   │   ├── UsoCfdiPicker.tsx
│   │   ├── FormaPagoPicker.tsx
│   │   ├── MetodoPagoPicker.tsx
│   │   └── RegimenFiscalPicker.tsx
│   └── ui/                      ← shadcn/ui generados aquí
│
├── modules/
│   └── facturacion/             ← partes de FacturaDetail (SOLID S)
│       ├── types.ts             ← DraftImpuesto, DraftConcepto, FacturaDraft, Totales
│       ├── facturaUtils.ts      ← newKey, helpers fecha/formato, calcBase/calcTotales
│       ├── facturaMappers.ts    ← newDraft, draftFromFactura, buildPayload, conceptoFrom*
│       ├── useIsDesktop.ts      ← hook breakpoint md (768px)
│       ├── InlineModal.tsx      ← Sheet (mobile) / Dialog (desktop)
│       ├── ClientePickerInline.tsx  ← búsqueda + alta inline de cliente
│       ├── ProductoPickerInline.tsx ← búsqueda + alta inline de producto/SKU
│       ├── ConceptoSheet.tsx    ← editor de concepto con impuestos
│       ├── CancelDialog.tsx     ← diálogo cancelación SAT (motivos)
│       └── MailDialog.tsx       ← diálogo envío de correo
│
└── pages/
    ├── LoginPage.tsx
    ├── FacturasPage.tsx
    ├── FacturaDetail.tsx        ← orquestación + estado (≈ 380 líneas)
    ├── IngresosPage.tsx
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
| Componente reutilizable | `PascalCase` | `ClientePicker.tsx` |
| Tipos de módulo | `camelCase` + `types` | `types.ts` |
| Utils puros de módulo | `camelCase` + `Utils` | `facturaUtils.ts` |
| Mappers de módulo | `camelCase` + `Mappers` | `facturaMappers.ts` |
| Picker inline (módulo) | `PascalCase` + `Inline` | `ClientePickerInline.tsx` |

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
