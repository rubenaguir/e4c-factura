# §5 Gestión de Estado (React Context)

## Principios

1. **Online-first:** Context es caché de sesión; la verdad está en el backend.
2. **No re-fetch al volver atrás:** si la lista ya está en Context y no está stale, se reusa.
3. **Invalidación explícita:** después de Add/Update/Delete/Stamp/Cancel → `stale: true`.
4. **Sin duplicación:** si `loading === true`, no lanzar otro fetch al mismo recurso.
5. **Catálogos SAT:** cargados una sola vez por sesión (`CatalogosContext`), TTL = sesión.

## Forma del estado base

> Las interfaces `ModuleState<T>` y `ModuleActions<T>` son el **patrón conceptual** que guía el diseño, pero no son una clase base o interfaz TypeScript genérica que se implemente explícitamente. Cada context define su propio shape con variaciones según su dominio.

```typescript
// Patrón de referencia (no implementado como genérico)
interface ModuleState<T> {
  list: T[];
  totalCount: number;
  filters: Record<string, string>;
  stale: boolean;
  loading: boolean;
  error: string | null;
  selected: T | null;
}

interface ModuleActions<T> {
  search: (filters?: Record<string, string>, forceRefresh?: boolean) => Promise<void>;
  loadOne: (id: string) => Promise<void>;
  add: (data: Record<string, unknown>) => Promise<{ id: string }>;
  update: (id: string, data: Record<string, unknown>) => Promise<void>;
  // remove() no implementado — inactivar via update (estatus="I")
  setSelected: (record: T | null) => void;
  invalidate: () => void;
}
```

Variaciones reales por módulo:
- `FacturasState` tiene `page: number` adicional para paginación
- `ClientesContext.add()` → `Promise<{ clienteId: string; msg: string }>`
- `IngresosContext.add()` → `Promise<{ msg: string; record: IngresoDetalle }>`

## Contexts específicos

- **`FacturasContext`** — agrega `addPrefactura`, `stamp(payload: FacturaPayload)`, `cancel(serie, folio, motivo, uuidSustituye)`, `loadPresetClientData(cliente_id)`.
- **`IngresosContext`** — agrega `stamp(serie, folio)`, `cancel`, `sendMail`. Las llamadas a `SearchCuentasCobrar` y `SearchCuentasBancariasCliente` se hacen directamente desde `useIngresoForm` (no expuestas en el context).
- **`ClientesContext`** — agrega `validateCP(cp)`, `saveDireccion(...)`, `searchDirecciones(cliente_id)`.
- **`ProductosContext`** — paginación server-side (`start`/`limit=100`) + debounce 300ms inline (no hook separado).
- **`CatalogosContext`** — carga lazy via método `ensure(name: CatalogName)`; cachea indefinido hasta logout. Llamar `ensure` desde cada componente que necesite el catálogo; evita fetches duplicados con flag `fetched`.

## Snackbar (toast global)

`SnackbarContext` provee `showError(msg)` y `showSuccess(msg)` para notificaciones toast. Se accede via el hook `useSnackbar()`. `SnackbarProvider` envuelve la app en `main.tsx`.

> Los errores de API se muestran via snackbar o `<Alert>` inline según el contexto de la pantalla. Las validaciones de formulario antes de llamar al backend pueden usar texto fijo.

## AuthContext

```typescript
interface AuthState {
  token: string | null;
  workspace: string | null;
  empresaId: string | null;
  sucursalId: string | null;
  empresaNombre: string | null;   // nombre de empresa (persiste en localStorage "sv3_session_names")
  sucursalNombre: string | null;  // nombre de sucursal (persiste en localStorage "sv3_session_names")
  usuario: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  /** Paso 2: login definitivo con empresa/sucursal seleccionada */
  login: (usuario: string, contrasena: string, empresaId: string, sucursalId: string) => Promise<void>;
  logout: () => void;
  /** Paso 1: obtener sucursales disponibles → SearchSucursalesUsuario */
  getSucursales: (usuario: string, contrasena: string) => Promise<SucursalOption[]>;
  // --- Biometría ---
  hasBiometric: boolean;
  biometricSupported: boolean;
  enableBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  disableBiometric: () => void;
}
```

JWT key en `localStorage`: `sv3_session`. Al arrancar la app se lee; `forceLogout` lo limpia.

**Auto-refresh de token:** `AuthContext` lee el claim `exp` del JWT, programa un `setTimeout` al 80% del lifetime restante para llamar `ValidateSession` y obtener un token renovado. Se re-agenda en cada `visibilitychange` (app vuelve a primer plano). Ver `docs/spec/11-biometric-auth.md` para el flujo biométrico completo.

## Patrones de página

### Lista
1. Leer Context (lista, loading, error, filters).
2. `useEffect`: si lista vacía o stale → `context.search()`.
3. Filtros + tabla/cards + paginación.
4. Click fila → `context.setSelected(row)` + `navigate('/:id')`.
5. Botón "Nuevo" → `navigate('/nuevo')`.

### Detalle — Clientes y Productos
1. Leer `:id` de `useParams()`.
2. Si `context.selected?.id === :id` → reutilizar datos.
3. Sino → `context.loadOne(:id)`.
4. Form con React Hook Form + Zod.
5. `onSubmit` → `context.add()` o `context.update()`.
6. Éxito → `context.invalidate()` + `navigate(lista)`.

### Detalle — Facturas e Ingresos
Usan `useState` directamente (no React Hook Form). `IngresoDetail` delega todo el estado al hook `useIngresoForm`.

