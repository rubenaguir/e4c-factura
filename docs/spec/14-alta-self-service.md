# §14 Alta Self-Service (Registro de Nuevas Cuentas)

## Contexto

Hoy el alta de un cliente nuevo es 100% manual: soporte da de alta la instancia en **InstanceManager** (registro + script de creación de BD + script de datos iniciales), crea el usuario/contraseña, coordina la carga del CSD y el alta de la cuenta en el **PAC**. Este ciclo manual es el cuello de botella para la campaña de marketing: cada usuario nuevo espera atención de soporte antes de poder usar la app.

Este documento define el flujo de registro self-service **del lado de `e4c-factura`**. El contrato con InstanceManager está **confirmado** (ver `docs/specs/alta-self-service-cuentas.md` en el repo de InstanceManager, validado 2026-09-01 — resumen en §Contrato). No cubre cambios al backend PHP de SisnetV3 salvo lo anotado en §Pendientes.

> **Estado:** contrato confirmado, pendiente de implementación en `e4c-factura`.

## Decisiones que enmarcan este flujo

Ver `docs/spec/08-decisions.md` #13–19:

- Verificación ligera: RFC (formato + unicidad + 69-B/EFOS vía SmartWeb) + email verificado por OTP. Sin captura de método de pago ni cola de aprobación manual en esta versión. La validación de **existencia/vigencia** del RFC ante el SAT (más allá de 69-B) se difiere al momento de cargar el CSD.
- CSD **opcional** al registro, con recordatorio persistente — no bloquea la creación de la cuenta; sí bloquea el timbrado.
- La orquestación completa (instancia + BD + datos iniciales + cuenta PAC + usuario) vive en **InstanceManager**, y corre **asíncrona** (worker/cron) — no hay respuesta síncrona del aprovisionamiento completo.
- `e4c-factura` **no habla directo con InstanceManager**. Llama a un proxy delgado en el backend PHP de SisnetV3 (mismo `interfase_jwt.php`, mismo `apiCall` de siempre), que reenvía servicio-a-servicio a InstanceManager usando el `api_key` guardado en su `conf.php`. El navegador nunca ve ese `api_key` (ver `08-decisions.md` #16, #19).
- El login posterior **reutiliza el `LoginPage`/`AuthContext` existentes sin cambios** — InstanceManager no emite JWT ni credenciales; el usuario inicia sesión igual que cualquier otro.

## Ruta

```
/registro                            → RegistroPage (pública, fuera de AppShell)
```

Accesible desde `/login` con un link "Crear cuenta". No usa `AuthContext` ni JWT — es pre-autenticación.

## Flujo (wizard de 3 pasos + espera)

```
┌───────────────────────────────────────┐
│  Crear cuenta            [1] [2] [3]  │  RegistroProgress
├───────────────────────────────────────┤
│                                       │
│  PASO 1 — Datos fiscales              │
│  RFC              [____________]      │
│  Razón social     [____________]      │
│  Régimen fiscal   [____________]      │  catálogo SAT (mismo picker que Perfil)
│  Calle / No.      [________][____]    │
│  Colonia          [____________]      │
│  Municipio        [____________]      │
│  Estado / CP      [______][______]    │
│                       [Continuar →]   │
│                                       │
└───────────────────────────────────────┘
```

### Paso 1 — Datos fiscales
- Campos: `rfc`, `razon_social`, `regimen_fiscal`, `calle`, `no_exterior`, `no_interior`, `colonia`, `municipio`, `estado`, `pais`, `codigo_postal` — mismo shape que `UpdateBasicData` en `13-perfil-empresa.md`, **salvo el nombre del campo de régimen fiscal**: en Perfil es `regimen_fiscal_id`, en el contrato de InstanceManager es `regimen_fiscal` — mapear explícitamente al armar el payload de `IniciarRegistro`, no asumir el mismo nombre.
- Al presionar **Continuar**: llama `ValidarRFC` (formato + unicidad + 69-B/EFOS, ver §Validaciones) antes de avanzar al paso 2. Si el RFC ya está registrado, error inline con opción de ir a `/login`. Si aparece en la lista 69-B (`Definitivo` o `Presunto`), error inline — no hay forma de continuar el registro con ese RFC en v1.

### Paso 2 — Cuenta de acceso
- Campos: `email`, `password`, `password_confirm`.
- **Política de contraseña (confirmada, la exige SmartWeb y aplica también a la instancia):** mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 dígito y 1 carácter especial (`!@#$%^&*()_+=[]{};:<>|./?,-`), sin espacios, distinta del RFC, máximo 72 caracteres. Validar con Zod en el cliente para no gastar el round-trip; el mensaje de error debe listar el requisito que falta, no un genérico "contraseña inválida".
- Al presionar **Continuar**: dispara `IniciarRegistro` (guarda datos fiscales + email, genera y envía OTP) y avanza al paso 3. Rate limit de InstanceManager: 5/hora y 10/día por email, 10/hora por IP — si se excede, mostrar `msg` del backend tal cual (ya viene en español, orientado al usuario).

### Paso 3 — Verificación
- Input de código de verificación (6 dígitos, vigente 15 minutos, máx. 5 intentos, máx. 3 reenvíos — límites ya fijados en InstanceManager, no configurables desde aquí).
- Checkbox de términos / aviso de privacidad.
- Botón **Crear mi cuenta** → `ConfirmarRegistro(registro_id, codigo, password)` → responde en <1s con `{ registro_id, estatus: "APROVISIONANDO", msg }`. El aprovisionamiento real (BD + PAC) corre después, en un worker — no es parte de esta respuesta.

### Paso 4 — Aprovisionando (pantalla de espera, no es un paso del wizard sino su desenlace)
- Al recibir `estatus: "APROVISIONANDO"` de `ConfirmarRegistro`, arrancar polling de `EstadoRegistro(registro_id)` cada 3–5 s.
- Indicador de progreso **indeterminado** (no simular pasos falsos) con el `msg` que devuelva el backend ("Creando tu cuenta…").
- **Límite de espera en el cliente (confirmado, 2026-09-22):** el worker corre por cron cada 5 min en el servidor Ubuntu, hasta 3 intentos por registro (cada intento fallido regresa el registro a `OTP_VERIFICADO` para el siguiente tick; al tercer fallo pasa a `ERROR` sin más espera). Peor caso ≈ 3 × 5 min = 15 min. Tope de polling: **17 minutos**. Estrategia de frecuencia (evita golpear el backend con cientos de requests durante una espera larga):
  - 0–60 s: poll cada 3 s (cubre el caso típico: sin reintentos, resuelve en el primer tick de cron).
  - 60 s–17 min: poll cada 20 s.
  - Al llegar a 17 min sin `COMPLETADO`/`ERROR`: detener el polling y mostrar "esto está tardando más de lo usual, te avisamos por correo cuando esté lista".
- `estatus: "COMPLETADO"` → la respuesta trae `instancia_id`, `nombre_sesion`, `usuario_id` — **no** un JWT ni contraseña. Redirigir a `/login` con el campo `usuario` **prellenado con `usuario_id`** (la contraseña la conoce el usuario, la eligió en el paso 2) y un mensaje de éxito. `nombre_sesion` es informativo/interno — no se le pide al usuario, el `LoginPage`/`SearchSucursalesUsuario` actual ya resuelve el workspace a partir del usuario (ver `03-api-client.md` — `SucursalOption.workspace`).
- `estatus: "ERROR"` → mostrar el `msg` del backend (ya es un mensaje amigable, p. ej. "No pudimos completar el alta con el proveedor de certificación. Un asesor te contactará.") con opción de reintentar `IniciarRegistro` desde cero si el mensaje lo sugiere.

## Validaciones y anti-abuso

- **RFC (v1, confirmado):** formato + unicidad local (no exista ya una instancia activa con ese RFC) + verificación contra la lista 69-B/EFOS del SAT (vía el PAC). La validación de **existencia/vigencia** del RFC ante el SAT queda fuera de este flujo — se hace al cargar el CSD, dentro de la app.
- **Email:** verificación por código (OTP) enviado por correo, no magic link.
- **Rate limiting:** ya definido y fijo en InstanceManager (no configurable desde `e4c-factura`) — 5/hora y 10/día por email, 10/hora por IP en `IniciarRegistro`; 30/min por IP en `ValidarRFC`.
- **Contraseña:** ver política confirmada en Paso 2.
- **`api_key` de InstanceManager:** vive solo en el `conf.php` de SisnetV3 — el navegador nunca lo ve. Es un secreto real, no un identificador público (ver `08-decisions.md` #16, #19).
- **Importante para el rate limiting por IP:** como SisnetV3 llama a InstanceManager por su cuenta, si no se hace nada, InstanceManager vería siempre la IP del servidor de SisnetV3 en `ValidarRFC`/`IniciarRegistro` — no la del usuario real — y el rate limit por IP quedaría inútil (o peor, un solo usuario legítimo con mala suerte podría bloquear a los demás). El proxy de SisnetV3 **debe reenviar el IP real del visitante** (el que ve en su propio request) como parámetro explícito, e InstanceManager debe confiar en ese IP reenviado **solo** cuando la llamada viene autenticada con el `api_key` de SisnetV3 (nunca aceptar un IP declarado por cualquier otro consumidor). Ver prompts de SisnetV3 e InstanceManager.

## Componentes (SOLID)

```
src/
  pages/
    RegistroPage.tsx                 ← orquesta el wizard, delega a useRegistroForm
  hooks/
    useRegistroForm.ts               ← estado de los pasos, validaciones, polling de EstadoRegistro
  components/registro/
    DatosFiscalesStep.tsx
    CuentaAccesoStep.tsx
    VerificacionStep.tsx
    AprovisionandoScreen.tsx         ← pantalla de espera + polling + tope de espera
    RegistroProgress.tsx             ← indicador de paso 1/2/3
```

`RegistroPage` solo orquesta renders (regla SOLID §10-b). Cada step recibe `data` + callbacks (`onNext`, `onBack`) como props; nunca muta el estado del wizard directamente (regla SOLID §10-d). El polling vive en `useRegistroForm` (o un hook dedicado `usePollEstadoRegistro`), no en `AprovisionandoScreen`.

## Cliente API

**No hay cliente nuevo.** El registro usa el mismo `apiCall` de siempre, contra el mismo `VITE_API_BASE_URL` de SisnetV3, sin `session` (son 4 opReq sin sesión, como `Login`/`SearchSucursalesUsuario`). El proxy hacia InstanceManager vive del lado del backend PHP de SisnetV3 (ver prompt independiente para ese repo) — `e4c-factura` no sabe que InstanceManager existe. Esto simplifica el frontend: no hay segunda base URL, no hay `instanceManagerClient.ts`, no hay `api_key` en ninguna variable `VITE_*`.

## Contrato

> **Estado (2026-09-04): implementado en ambos backends, pendiente de credenciales reales.** El proxy en SisnetV3 (`modules/seguri/registro/registro.php` + `InstanceManagerClient`) y el ajuste de rate-limiting por IP en InstanceManager ya están implementados y revisados. Falta reemplazar `INSTANCE_MANAGER_API_URL`/`INSTANCE_MANAGER_API_KEY` (hoy placeholders en `conf.php` de SisnetV3) por los valores reales — sin eso el proxy responde con error de transporte (ya probado: falla de forma controlada, queda en `sisnet_error_log`). El contrato de abajo ya no es especulativo: es lo que `e4c-factura` va a recibir. **`e4c-factura` puede empezar a implementarse ya** contra este contrato, aunque el flujo completo (paso 4, aprovisionamiento real) no se pueda probar de punta a punta hasta que las credenciales lleguen.

`e4c-factura` llama `interfase_jwt.php` de **SisnetV3** (su `VITE_API_BASE_URL` de siempre, sin `session`), con los **mismos 4 nombres de opReq** que usa InstanceManager (`seguri:registro:registro:*` — SisnetV3 los reenvía 1:1, sin transformar payloads ni respuestas):

| # | Operación (InstanceManager) | Payload → Respuesta |
|---|---|---|
| 1 | `ValidarRFC` | `{rfc}` → `{rfc, valido, ya_registrado, efos, msg}` |
| 2 | `IniciarRegistro` | `{rfc, razon_social, regimen_fiscal, codigo_postal, calle?, no_exterior?, no_interior?, colonia?, municipio?, estado?, pais?, email}` → `{registro_id, msg}` |
| 3 | `ConfirmarRegistro` | `{registro_id, codigo, contrasena}` → `{registro_id, estatus:"APROVISIONANDO", msg}` (síncrono, <1s — no aprovisiona en esta llamada) |
| 4 | `EstadoRegistro` | `{registro_id}` → en progreso: `{registro_id, estatus:"APROVISIONANDO", msg}`; completado: `{registro_id, estatus:"COMPLETADO", instancia_id, nombre_sesion, usuario_id, msg}`; error: `{registro_id, estatus:"ERROR", msg}` |

Notas clave para la implementación:
- Ningún endpoint devuelve JWT ni contraseña — el flujo termina en un redirect a `/login`, nunca en auto-login.
- `IniciarRegistro` no revela si el email ya tenía un registro previo (respuesta uniforme) — no construir UI que asuma lo contrario.
- Los mensajes de error/éxito vienen listos para mostrar en `msg`/`Message` — no reconstruir textos de negocio en el frontend (regla ya vigente en el proyecto).
- `ValidarRFC` e `IniciarRegistro` deben viajar con el IP real del usuario incluido de algún modo desde SisnetV3 hacia InstanceManager (ver §Validaciones) — irrelevante para el payload que arma `e4c-factura` (el IP lo captura SisnetV3 del propio request, no lo envía el frontend).

## Integración con Perfil (CSD opcional)

- `AppShell` muestra un banner persistente (dismissible por sesión, no por siempre) si la cuenta no tiene CSD cargado, con link directo a `/perfil`.
- El botón de timbrar en `FacturaDetail` se deshabilita (o muestra alerta al intentar) si no hay CSD cargado — evita un request fallido contra el SAT.
- ❓ **Sigue pendiente:** requiere que `LoadBasicData` (o un nuevo endpoint) devuelva un flag `csd_cargado: boolean`. Esto es un cambio al backend PHP de SisnetV3 — fuera del alcance de `e4c-factura` e InstanceManager, anotado para un prompt independiente en ese proyecto cuando se priorice.

## Pendientes / abiertos

Resueltos por InstanceManager (ya no son abiertos de este documento): validación SAT/69-B, tipo de PAC, síncrono vs. asíncrono, autenticación servicio-a-servicio, timeout del aprovisionamiento.

**Ya no bloquea el inicio de Fase 10** (2026-09-04): el proxy en SisnetV3 y el flag `csd_cargado` ya están implementados y revisados — código en `modules/seguri/registro/registro.php`, `php/classes/Services/InstanceManager/InstanceManagerClient.php`, whitelist en `interfase_jwt.php`, y `csd_cargado` en `GetEmpresaBasicData()` (`modules/sistema/empresas/empresas.php`). Se puede empezar `RegistroPage` ya, contra el contrato de §Contrato.

Quedan, y no son decisiones de `e4c-factura`:
- Credenciales reales `sw_user`/`sw_pass` del dealer JMRA en SmartWeb, y `INSTANCE_MANAGER_API_URL`/`API_KEY` reales en `conf.php` de SisnetV3 (hoy placeholders) — sin esto no hay prueba de punta a punta posible, pero no bloquea construir la UI.
- Texto final del correo de OTP y de bienvenida (InstanceManager usa un texto provisional; no bloquea implementar aquí).
- **Verificar la topología de red:** el IP real del usuario que usa InstanceManager para el rate limiting depende de que SisnetV3 reciba correctamente esa IP (via `HTTP_X_REAL_IP`, patrón ya usado en este proyecto para el rate limiting de `Login`). Si en producción algo puede llegar a SisnetV3 sin pasar por el reverse proxy que fija ese header (o si ese proxy no lo sobreescribe cuando el cliente ya lo manda), cualquiera podría falsear su IP y volver inútil el límite por IP — igual que ya sería posible hoy contra el rate limiting de `Login`. No es nuevo de este feature, pero vale la pena confirmarlo una vez, ya que ahora también protege el alta de cuentas.

Resuelto (2026-09-22, Ruben) — ya no es abierto:
- Tope de polling en `AprovisionandoScreen` y estrategia de frecuencia: ver §Paso 4 arriba (worker por cron cada 5 min, tope 17 min).
