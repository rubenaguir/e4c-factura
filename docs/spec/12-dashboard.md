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
| 2 | Por cobrar | Saldo PPD sin complemento **del mes actual** + Δ% vs mes anterior | Métrica |
| 3 | Ingresos registrados | Total REP del mes actual + Δ% vs mes anterior | Métrica |
| 4 | Antigüedad de saldos | Gráfica de barras por rango de días + saldo total acumulado histórico | Gráfica |
| 5 | Cancelaciones pendientes | Lista de folios con solicitud enviada al SAT sin respuesta | Lista |

> Todos los valores vienen pre-procesados del backend. El frontend no aplica ningún cálculo ni lógica de filtrado.

> **Separación de alcances:** Las tarjetas 1–3 corresponden al mes en curso (período del header). La tarjeta 4 muestra la cartera acumulada histórica; su total es el único lugar donde aparece el saldo global pendiente.

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

Devuelve el saldo PPD sin complemento **del mes en curso** + comparativa vs. mes anterior (misma semántica que `GetMontoFacturado`).

**Response esperado:**
```json
{
  "success": true,
  "mes_actual": "340000.00",
  "mes_anterior": "410000.00"
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

### `GetAntiguedadSaldos`

Devuelve el saldo acumulado histórico de facturas PPD sin complemento, desglosado por antigüedad. Es la fuente del **total por cobrar global** que ya no aparece en `GetPorCobrar`.

**Request:** sin parámetros adicionales.

**Response esperado:**
```json
{
  "success": true,
  "saldo_0": "19030.000000",
  "saldo_1_30": "9971.360000",
  "saldo_31_60": "42272.680000",
  "saldo_61_90": "19289.460000",
  "saldo_91": "4267281.102392",
  "saldo_total": "4357844.602392"
}
```

| Campo | Significado |
|---|---|
| `saldo_0` | Al corriente (sin vencer) |
| `saldo_1_30` | Vencido 1–30 días |
| `saldo_31_60` | Vencido 31–60 días |
| `saldo_61_90` | Vencido 61–90 días |
| `saldo_91` | Vencido más de 90 días |
| `saldo_total` | Suma de todos los rangos |

**Tarjeta `AntiguedadSaldos`:**
- Título: "Antigüedad de saldos"
- Subtítulo: "Saldo total: $X,XXX,XXX" (formateado en MXN)
- Gráfica de barras horizontales, una barra por rango
- Cada barra muestra el importe + etiqueta de rango
- Colores progresivos por urgencia: `saldo_0` → gris neutro, `saldo_1_30` → amarillo, `saldo_31_60` → naranja, `saldo_61_90` → rojo claro, `saldo_91` → rojo intenso
- Si un rango es `"0"` o `"0.000000"`, la barra no se renderiza (se omite del gráfico)

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
│               GetIngresos, GetAntiguedadSaldos, GetCancelacionesPendientes])
│         Cada card muestra su propio estado (ok / error / cargando)
│         On success total → escribe localStorage["e4c_dashboard"]
│
└─ Cleanup en unmount cancela el timer si aún no disparó
```

### Estructura del caché en `localStorage`

```typescript
// key: "e4c_dashboard"
type DashboardCache = {
  facturado:       { mes_actual: string; mes_anterior: string };
  porCobrar:       { mes_actual: string; mes_anterior: string };
  ingresos:        { mes_actual: string; mes_anterior: string };
  antiguedadSaldos: AntiguedadSaldos;
  cancelaciones:   CancelacionPendiente[];
  fetchedAt:       string; // ISO 8601
};

type AntiguedadSaldos = {
  saldo_0: string;
  saldo_1_30: string;
  saldo_31_60: string;
  saldo_61_90: string;
  saldo_91: string;
  saldo_total: string;
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
│  Abril 2026 · vs Marzo      │  ← período (solo aplica a tarjetas 1–3)
│                             │
│  ╔═══════════════════════╗  │
│  ║ Monto facturado       ║  │
│  ║ $1,250,000            ║  │
│  ║ ▲ 27.6% vs Marzo      ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Por cobrar            ║  │  ← solo mes actual
│  ║ $340,000              ║  │
│  ║ ▼ 17.1% vs Marzo      ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Ingresos registrados  ║  │
│  ║ $890,000              ║  │
│  ║ ▲ 17.1% vs Marzo      ║  │
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Antigüedad de saldos  ║  │  ← cartera acumulada histórica
│  ║ Saldo total: $4,357,844 ║ │
│  ║ ─────────────────     ║  │
│  ║ Al corriente  ████░   ║  │  (gris)
│  ║ 1–30 días     ██░░░   ║  │  (amarillo)
│  ║ 31–60 días    ███░░   ║  │  (naranja)
│  ║ 61–90 días    ██░░░   ║  │  (rojo claro)
│  ║ +90 días      █████   ║  │  (rojo intenso)
│  ╚═══════════════════════╝  │
│                             │
│  ╔═══════════════════════╗  │
│  ║ Cancelaciones         ║  │
│  ║ pendientes (3)        ║  │
│  ║ ─────────────────     ║  │
│  ║ A-1042 · EMPRESA...   ║  │
│  ║ $5,800 · 10 abr       ║  │
│  ╚═══════════════════════╝  │
│                             │
└─────────────────────────────┘
```

- Las tarjetas 1–4 muestran `Skeleton` mientras cargan.
- El Δ% se muestra verde si positivo (▲), rojo si negativo (▼), gris si = 0.
- La tarjeta 4 (`AntiguedadSaldos`) usa barras horizontales proporcionales al `saldo_total`; rangos con valor `0` se omiten.
- La tarjeta 5 muestra la lista completa (sin paginación); si está vacía muestra "Sin cancelaciones pendientes".
- Cada fila de cancelaciones muestra un badge de estado: `Plazo vencido` en rojo (acción urgente) y `En proceso` en amarillo (en espera).
- En error de fetch, cada tarjeta muestra su propio mensaje de error con botón "Reintentar" (dispara solo ese endpoint sin esperar 1.5 s).

---

## Archivos a crear

```
src/
  endpoints/
    dashboard.ts          ← GetMontoFacturado | GetPorCobrar | GetIngresos | GetAntiguedadSaldos | GetCancelacionesPendientes
  lib/
    dashboardCache.ts     ← read/write/clear helpers sobre localStorage["e4c_dashboard"]
  pages/
    DashboardPage.tsx     ← lógica de caché + disparo retrasado + grid de tarjetas
  components/dashboard/
    MetricCard.tsx        ← tarjeta genérica: label + valor + Δ% opcional + skeleton
    AntiguedadSaldosCard.tsx ← gráfica de barras horizontales por rango + saldo total
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
