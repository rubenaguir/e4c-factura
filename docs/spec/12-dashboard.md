# §12 Dashboard — Pantalla de Inicio

## Contexto

Pantalla de inicio de la PWA que muestra indicadores operativos del mes en curso con comparativa vs. mes anterior. Orientada a uso mobile-first. Sin restricción por rol. La ruta `/` del shell redirige aquí.

> **Estado:** pendiente de implementación (Fase 7).

---

## Ruta

```
/ (AppShell)
  /dashboard                         → DashboardPage   ← nueva ruta raíz
```

El `AppShell` redirecciona `/` → `/dashboard`. Las rutas existentes no cambian.

---

## Indicadores (tarjetas)

| # | Tarjeta | Datos | Tipo |
|---|---|---|---|
| 1 | Monto facturado | Total mes actual (MXN) + Δ% vs mes anterior | Métrica |
| 2 | Por cobrar | Saldo pendiente de facturas PPD sin complemento | Métrica |
| 3 | Ingresos registrados | Total REP del mes actual + Δ% vs mes anterior | Métrica |
| 4 | Cancelaciones pendientes | Lista de folios con solicitud enviada al SAT sin respuesta | Lista |

> Todos los valores vienen pre-procesados del backend. El frontend no aplica ningún cálculo ni lógica de filtrado.

---

## Endpoints backend (nuevos)

Prefijo común: `ventas:facturas_venta_33:dashboard_pwa`

### `GetMontoFacturado`

**Request:** sin parámetros adicionales (el backend toma empresa/sucursal del JWT).

**Response esperado:**
```json
{
  "success": true,
  "mes_actual": "1250000.00",
  "mes_anterior": "980000.00"
}
```

### `GetPorCobrar`

**Response esperado:**
```json
{
  "success": true,
  "total": "340000.00"
}
```

### `GetIngresos`

**Response esperado:**
```json
{
  "success": true,
  "mes_actual": "890000.00",
  "mes_anterior": "760000.00"
}
```

### `GetCancelacionesPendientes`

**Response esperado:**
```json
{
  "success": true,
  "records": [
    {
      "serie": "A",
      "folio": "1042",
      "fecha": "2026-04-10",
      "receptor_nombre": "EMPRESA CLIENTE SA DE CV",
      "total": "5800.00",
      "estatus": "R",
      "estatus_cancelacion": "En proceso"
    }
  ]
}
```

> **Valores posibles de `estatus_cancelacion`:**
>
> | Valor | Significado | Acción requerida |
> |---|---|---|
> | `En proceso` | Solicitud enviada al SAT; el cliente tiene plazo para aceptar o rechazar | Esperar respuesta del cliente |
> | `Plazo vencido` | El cliente no respondió en el plazo SAT; la cancelación **no se aplicó**; el folio sigue vigente | Nueva solicitud de cancelación + nueva aceptación del cliente |
>
> El frontend muestra ambos estados en la misma lista, diferenciando visualmente `Plazo vencido` como más urgente (ej. badge rojo vs. amarillo). No aplica ninguna lógica adicional — los valores vienen del backend tal cual.

---

## Estrategia de caché — Stale-While-Revalidate con disparo retrasado

### Objetivo

Si el usuario abre la app y navega a Facturas antes de 1.5 s, no se lanza ninguna petición al dashboard. En visitas subsecuentes, los datos se muestran de inmediato desde caché mientras se refresca en background.

### Implementación

```
Mount de DashboardPage
│
├─ 1. Lee localStorage["e4c_dashboard"]
│     Si existe Y fetchedAt < 10 min → renderiza con datos stale; omite fetch
│     Si existe Y fetchedAt ≥ 10 min → renderiza con datos stale; programa fetch
│     Si no existe → muestra skeletons; programa fetch
│
├─ 2. setTimeout(1_500 ms) — timer de intención
│
│   [usuario navega antes de 1.5 s]
│   └─ useEffect cleanup cancela el timer → 0 llamadas al backend ✓
│
│   [usuario permanece ≥ 1.5 s]
│   └─ 3. Promise.allSettled([GetMontoFacturado, GetPorCobrar,
│               GetIngresos, GetCancelacionesPendientes])
│         Cada card muestra su propio estado (ok / error / cargando)
│         On success total → escribe localStorage["e4c_dashboard"]
│
└─ Cleanup en unmount cancela el timer si aún no disparó
```

### Estructura del caché en `localStorage`

```typescript
// key: "e4c_dashboard"
type DashboardCache = {
  facturado:  { mes_actual: string; mes_anterior: string };
  porCobrar:  { total: string };
  ingresos:   { mes_actual: string; mes_anterior: string };
  cancelaciones: CancelacionPendiente[];
  fetchedAt:  string; // ISO 8601
};

type CancelacionPendiente = {
  serie: string;
  folio: string;
  fecha: string;
  receptor_nombre: string;
  total: string;
  estatus: string;
  estatus_cancelacion: string;
};
```

**TTL:** 10 minutos. Si `fetchedAt` es más reciente, se omite el fetch aunque el usuario permanezca en la pantalla.

---

## Layout (mobile-first)

```
┌─────────────────────────────┐
│  Dashboard           👤     │  TopBar
├─────────────────────────────┤
│                             │
│  ╔═══════════════════════╗  │
│  ║ Monto facturado       ║  │
│  ║ $1,250,000            ║  │
│  ║ ▲ 27.6% vs abril      ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Por cobrar            ║  │
│  ║ $340,000              ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Ingresos registrados  ║  │
│  ║ $890,000              ║  │
│  ║ ▲ 17.1% vs abril      ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Cancelaciones         ║  │
│  ║ pendientes (3)        ║  │
│  ║ ─────────────────     ║  │
│  ║ A-1042 · EMPRESA...   ║  │
│  ║ $5,800 · 10 abr       ║  │
│  ║ ─────────────────     ║  │
│  ║ A-1038 · CLIENTE...   ║  │
│  ╚═══════════════════════╝  │
│                             │
└─────────────────────────────┘
```

- Las tarjetas 1–3 muestran `Skeleton` mientras cargan.
- El Δ% se muestra verde si positivo (▲), rojo si negativo (▼), gris si = 0.
- La tarjeta 4 muestra la lista completa (sin paginación); si está vacía muestra "Sin cancelaciones pendientes".
- Cada fila muestra un badge de estado: `Plazo vencido` en rojo (acción urgente) y `En proceso` en amarillo (en espera).
- En error de fetch, cada tarjeta muestra su propio mensaje de error con botón "Reintentar" (dispara solo ese endpoint sin esperar 1.5 s).

---

## Archivos a crear

```
src/
  endpoints/
    dashboard.ts          ← GetMontoFacturado | GetPorCobrar | GetIngresos | GetCancelacionesPendientes
  lib/
    dashboardCache.ts     ← read/write/clear helpers sobre localStorage["e4c_dashboard"]
  pages/
    DashboardPage.tsx     ← lógica de caché + disparo retrasado + grid de tarjetas
  components/dashboard/
    MetricCard.tsx        ← tarjeta genérica: label + valor + Δ% opcional + skeleton
    CancelacionesList.tsx ← tarjeta de lista de cancelaciones pendientes
```

---

## Integración con el router

Agregar en `AppRoutes`:

```tsx
<Route index element={<Navigate to="/dashboard" replace />} />
<Route path="dashboard" element={<DashboardPage />} />
```

Actualizar `BottomNav` / `Sidebar` para incluir el enlace a `/dashboard` como primer ítem.

---

## Pendientes / Fuera de alcance (v1)

- Navegación drill-down al tap de una tarjeta → **Fase posterior**.
- Filtro por período (semana, trimestre) → **Fuera de alcance v1**.
- Restricción por rol → **No aplica en esta PWA**.
- Comparativa gráfica (chart) → **Fuera de alcance v1**.
