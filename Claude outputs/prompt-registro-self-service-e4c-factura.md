# Prompt — Implementar Alta Self-Service (Fase 10) en e4c-factura

## Contexto

Vas a implementar el flujo público de registro de nuevas cuentas (`/registro`)
descrito en **`docs/spec/14-alta-self-service.md`** (ya commiteado en este repo,
commit `d398d6b`). Ese documento es la fuente de verdad — **no repitas su
contenido aquí, léelo primero completo.** También lee:

- `docs/spec/07-phases.md` §Fase 10 (lista de archivos a crear, criterio de éxito)
- `docs/spec/08-decisions.md` #13–20 (por qué se diseñó así)
- `CLAUDE.md` (reglas críticas del proyecto — SOLID, patrón de `apiCall`, `HashRouter`, mensajes del backend nunca hardcodeados)

El contrato con InstanceManager (los 4 `opReq` sin sesión) ya está confirmado y
probado de punta a punta por Ruben en su ambiente local — no hay ambigüedad de
contrato, solo falta esta implementación.

## Orden de implementación

Sigue el orden de `07-phases.md` §Fase 10:

1. `src/hooks/useRegistroForm.ts` — estado del wizard (paso actual, datos
   acumulados de los 3 pasos), llamadas a `ValidarRFC` / `IniciarRegistro` /
   `ConfirmarRegistro`, y el polling de `EstadoRegistro`.
2. `src/components/registro/DatosFiscalesStep.tsx`, `CuentaAccesoStep.tsx`,
   `VerificacionStep.tsx`, `AprovisionandoScreen.tsx`, `RegistroProgress.tsx`.
3. `src/pages/RegistroPage.tsx` — solo orquesta (regla SOLID 10-b de `CLAUDE.md`).
4. Ruta pública `/registro` en `src/App.tsx` (ver nota de routing abajo) + link
   "Crear cuenta" en `LoginPage.tsx`.

**No implementes el punto 5 de `07-phases.md`** (banner de recordatorio de CSD
en `AppShell`) — depende del flag `csd_cargado` en `LoadBasicData`, que no
existe todavía en el backend de SisnetV3 (es un prompt independiente en ese
repo, aún no priorizado). Déjalo fuera de este alcance.

## Detalles de implementación que no están en el spec (decisiones técnicas, resuélvelas así)

### 1. Prellenar `usuario` en `LoginPage` tras el registro

Hoy `LoginPage.tsx` no acepta ningún estado de entrada — siempre arranca en
blanco. El spec (§Paso 4) pide redirigir a `/login` con `usuario` prellenado
con `usuario_id` y un mensaje de éxito. Como el proyecto usa `HashRouter`
(react-router v6/v7), resuélvelo con `location.state`:

```tsx
// Al completar el registro:
navigate("/login", { replace: true, state: { prefillUsuario: usuario_id, successMessage: "..." } });

// En LoginPage.tsx:
const location = useLocation();
const prefillUsuario = (location.state as { prefillUsuario?: string })?.prefillUsuario;
// usarlo como defaultValue del form1 (usuario), y mostrar successMessage (Alert o el Snackbar existente) una sola vez
```

No agregues query params ni un nuevo campo a `AuthContext` — es un detalle de
navegación entre dos páginas públicas, no de autenticación.

### 2. Indicador de progreso indeterminado

No existe un componente `Progress` en `src/components/ui/`. No agregues una
dependencia nueva (`CLAUDE.md` ya prohíbe librerías fuera de la lista). Usa el
mismo patrón que ya existe en el proyecto para estados de carga (`Loader2` de
`lucide-react` con `animate-spin`, como en los botones de `LoginPage.tsx`) —
un ícono girando + el `msg` que devuelve el backend es suficiente; no simules
una barra de progreso con pasos falsos (el spec lo prohíbe explícitamente).

### 3. Tope y frecuencia de polling (ya confirmado, no es una decisión abierta)

El worker corre por cron cada 5 min en el servidor Ubuntu (fuera de este
repo). Implementa exactamente lo que dice `14-alta-self-service.md` §Paso 4
(ya actualizado con esta decisión): polling cada 3 s durante el primer
minuto, luego cada 20 s hasta un tope de 17 minutos, mensaje de "tardando
más de lo usual" al llegar al tope.

### 4. Nombre de campo `regimen_fiscal` vs `regimen_fiscal_id`

Ya está anotado en el spec (§Paso 1) pero es un error fácil de cometer: el
picker de régimen fiscal (mismo LOV que usa Perfil, `SearchRegimenesSAT`)te
da un valor que en el payload de `IniciarRegistro` va como `regimen_fiscal`
(sin `_id`) — no reuses el nombre de campo de `13-perfil-empresa.md` tal cual.

## Qué NO tocar

- `LoginPage.tsx` — solo el prefill descrito arriba. No reestructures su
  wizard de 2 pasos ni el flujo biométrico.
- `AuthContext` / `useAuth.ts` — el registro no toca autenticación, termina
  siempre en un redirect a `/login`, nunca en auto-login (contrato ya
  confirmado, ver `08-decisions.md` #18).
- `src/api/client.ts` — no hace falta un cliente nuevo; los 4 `opReq` de
  registro usan el mismo `apiCall` sin `session`, igual que
  `SearchSucursalesUsuario`/`Login` (ver `03-api-client.md`).
- El backend PHP de SisnetV3 — cualquier cambio ahí (el proxy, el flag
  `csd_cargado` a futuro) es un prompt independiente en ese repo (regla
  `08-decisions.md` #20). Si durante la implementación encuentras que el
  proxy no se comporta como dice el contrato, repórtalo — no lo "arregles"
  editando ese repo desde aquí.

## Al terminar

Repórtame con líneas de código citadas (archivo:línea), no un resumen
narrativo:
- Qué archivos creaste/modificaste y su tamaño en líneas (recuerda el límite
  de 400 líneas por archivo de `CLAUDE.md` — si algún componente se acerca,
  dime cómo lo partiste).
- Cómo quedó el manejo de errores de cada paso (`ValidarRFC` rechazado, RFC
  en 69-B, rate limit excedido, código OTP incorrecto/expirado,
  `estatus: "ERROR"` del aprovisionamiento) — cita dónde se muestra cada
  mensaje y confirma que es el `msg`/`Message` del backend, no texto
  hardcodeado (regla `CLAUDE.md` #9).
- Confirma que probaste al menos un registro de punta a punta contra tu
  ambiente local (backend real de SisnetV3 + InstanceManager), no solo que
  compila.
