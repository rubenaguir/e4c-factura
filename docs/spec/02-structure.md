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
└── modules/
    ├── auth/LoginPage.tsx
    ├── facturacion/
    │   ├── FacturasPage.tsx
    │   └── FacturaDetail.tsx
    ├── ingresos/
    │   ├── IngresosPage.tsx
    │   └── IngresoDetail.tsx
    ├── clientes/
    │   ├── ClientesPage.tsx
    │   └── ClienteDetail.tsx
    └── productos/
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
