# §7 Layout Responsivo y PWA

## Breakpoints

| Tailwind | px | Modo |
|---|---|---|
| `< md` | < 768px | Mobile — layout vertical, bottom nav |
| `≥ md` | ≥ 768px | Desktop — sidebar izquierdo |

## AppShell

**Desktop:** Sidebar (240px, colapsable a 60px) + TopBar + `<Outlet />`.
**Mobile:** TopBar con hamburguesa + `<Outlet />` + BottomNav (4 tabs: Facturas · Ingresos · Clientes · Productos).

## Tablas en mobile

Tablas con >3 columnas → **card list**:
```
┌───────────────────────────────┐
│ A-1234 · MXN $12,450.00        │
│ Cliente: ACME S.A. de C.V.    │
│ 2026-04-10 · Timbrada         │
│                          [→]  │
└───────────────────────────────┘
```

## Modales

- Mobile → `<Sheet>` de shadcn/ui (pantalla completa).
- Desktop → `<Dialog>` centrado.

## PWA Manifest

```json
{
  "name": "E4C Facturación",
  "short_name": "E4C",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/pwa-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Service Worker (Workbox / VitePWA)

- **Precaché:** assets estáticos del build.
- **Runtime caching:**
  - LOVs (`Sistem:Lov:Lov:*`) → `StaleWhileRevalidate`, TTL 24h.
  - `Search`/`Load` de lecturas → `NetworkFirst`, timeout 5s; fallback caché offline.
  - **Mutaciones (`Add`, `Update`, `Delete`, `Stamp`, `Cancel*`) → NO caché, NO Background Sync.**
- Banner de actualización con `onNeedRefresh` de `vite-plugin-pwa/react`.

## Instalabilidad (A2HS)

Hook `usePwaInstall` captura `beforeinstallprompt`. Botón "Instalar app" en TopBar solo cuando el evento está disponible y la app no está instalada.

## Vite config (extracto)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: { /* ver arriba */ },
      workbox: { /* ver Service Worker */ }
    })
  ]
});
```

Router: `createHashRouter` (HashRouter) — evita reescrituras Apache.

## Loading states

- Tabla en carga → skeletons.
- Botón submit → spinner dentro + disabled.
- Página inicial → spinner centrado.

## Errores y mensajes de operación

- API error → `<Alert>` en la página con `response.msg ?? response.Message`. Nunca `alert()`. No hardcodear textos si el backend los provee.
- Mutación exitosa → toast/`<Alert>` con `response.msg`.
- Validación form → inline debajo del campo (RHF).
- `forceLogout` → manejado globalmente en `client.ts`.

## i18n

Único idioma: **español mexicano**.
- Fechas: `es-MX`
- Moneda: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
