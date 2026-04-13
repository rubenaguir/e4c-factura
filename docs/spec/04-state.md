# §5 Gestión de Estado (React Context)

## Principios

1. **Online-first:** Context es caché de sesión; la verdad está en el backend.
2. **No re-fetch al volver atrás:** si la lista ya está en Context y no está stale, se reusa.
3. **Invalidación explícita:** después de Add/Update/Delete/Stamp/Cancel → `stale: true`.
4. **Sin duplicación:** si `loading === true`, no lanzar otro fetch al mismo recurso.
5. **Catálogos SAT:** cargados una sola vez por sesión (`CatalogosContext`), TTL = sesión.

## Forma del estado base

```typescript
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
  remove: (id: string) => Promise<void>;
  setSelected: (record: T | null) => void;
  invalidate: () => void;
}
```

## Contexts específicos

- **`FacturasContext`** — agrega `addPrefactura`, `stamp(serie, folio)`, `cancel(serie, folio, motivo, uuidSustituye)`, `loadPresetClientData(cliente_id)`.
- **`IngresosContext`** — agrega `searchCuentasCobrar(cliente_id)`, `stamp(serie, folio)`.
- **`ClientesContext`** — agrega `validateCP(cp)`, `saveDireccion(...)`, `searchDirecciones(cliente_id)`.
- **`ProductosContext`** — paginación server-side (`start`/`limit=100`) + debounce 300ms para búsqueda.
- **`CatalogosContext`** — carga lazy por LOV; cachea indefinido hasta logout.

## AuthContext

```typescript
interface AuthState {
  token: string | null;
  workspace: string | null;
  empresaId: string | null;
  sucursalId: string | null;
  usuario: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (usuario: string, contrasena: string, empresaId: string, sucursalId: string) => Promise<void>;
  logout: () => void;
}
```

JWT key en `localStorage`: `sv3_session`. Al arrancar la app se lee; `forceLogout` lo limpia.

## Patrones de página

### Lista
1. Leer Context (lista, loading, error, filters).
2. `useEffect`: si lista vacía o stale → `context.search()`.
3. Filtros + tabla/cards + paginación.
4. Click fila → `context.setSelected(row)` + `navigate('/:id')`.
5. Botón "Nuevo" → `navigate('/nuevo')`.

### Detalle
1. Leer `:id` de `useParams()`.
2. Si `context.selected?.id === :id` → reutilizar datos.
3. Sino → `context.loadOne(:id)`.
4. Form con React Hook Form + Zod.
5. `onSubmit` → `context.add()` o `context.update()`.
6. Éxito → `context.invalidate()` + `navigate(lista)`.
