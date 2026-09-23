# Prompt para InstanceManager — Implementar Alta Self-Service (spec validada)

> Ejecutar en la sesión de Claude Code del repo `empresa4cero-instance-manager`,
> respetando sus propios guardrails.

## Contexto

La especificación en `docs/specs/alta-self-service-cuentas.md` ya está **validada**
por el equipo de arquitectura, incluyendo el addendum del 2026-09-04 (§5, §6.1, §7.1,
§7.2, §9, §11, §12 — el consumidor real es un proxy servicio-a-servicio en SisnetV3,
no el navegador; parámetro `ip_origen` + columna `confia_ip_origen`).

**El lado consumidor ya está implementado y probado del otro lado.** El proxy en el
backend de SisnetV3 (`modules/seguri/registro/registro.php` +
`InstanceManagerClient.php`) ya llama exactamente a los 4 opReq documentados
(`seguri:registro:registro:ValidarRFC/IniciarRegistro/ConfirmarRegistro/EstadoRegistro`)
con los payloads exactos de §7, incluyendo `ip_origen` en `ValidarRFC` e
`IniciarRegistro`. Es un passthrough puro — no espera nada distinto a lo ya
documentado. **No hay margen para cambiar el contrato de payloads/respuestas sin
avisar** — cualquier ajuste ahí requeriría tocar también el proxy en SisnetV3.

## Objetivo

Implementar la especificación completa siguiendo el plan de fases que ya está en el
propio documento (§11):

1. DDL + config — tablas de §6 (`im_api_clientes` con la columna `confia_ip_origen`,
   `ventas_registros_self_service`), constantes `REG_SS_*` en `conf.php`, alta de
   `im_api_clientes` (script admin que imprime la key en claro una vez). **Para el
   consumidor del proxy de SisnetV3, esa fila debe quedar con `confia_ip_origen='S'`**
   — el resto de consumidores futuros, en `'N'` por default. Alta del usuario de
   servicio para el worker.
2. Helpers — `Validation::Rfc`, `Mailer`, `Registro.class.php` (sin worker todavía).
3. Endpoints 1–3 (`ValidarRFC`, `IniciarRegistro`, `ConfirmarRegistro`) — controlador
   `modules/seguri/registro/registro.php` + whitelist en `interfase_jwt.php`. Probar
   con `curl` directo (OTP visible en log en modo debug).
4. Verificar los 5 `programa_id` de §3.3 en `cat_programas` y fijar las constantes
   `REG_SS_*` (el plan `E4C_100` ya existe, no se toca).
5. Migración del código PAC a REST — ampliar `SWUserManagement`
   (`createUser`/`updatePassword`/`setActive`/`checkTaxpayer69B`), eliminar el código
   SOAP de `instancias.php` y sus literales DSCORP (§10).
6. Worker `procesa_registros_self_service.php` — `Instancia::add()` (con el fix del
   bug de `administrador_pass` de §10, ya confirmado) + `SWUserManagement::createUser()`.
   Probar contra `SW_USER_MANAGEMENT_TEST=true`.
7. Endpoint 4 (`EstadoRegistro`) + correo de bienvenida + cron de limpieza.
8. Rate limiting fino / endurecimiento.
9. Handoff: contrato §7 ya está congelado (confirmado por el consumidor real). Falta
   emitir la `api_key` de producción para el consumidor "proxy SisnetV3" y entregar
   la URL pública de este backend — eso es lo que hace falta para reemplazar los
   placeholders `INSTANCE_MANAGER_API_URL`/`INSTANCE_MANAGER_API_KEY` que hoy están en
   `conf.php` de SisnetV3.

## Dependencia externa — no bloquea empezar, sí bloquea probar el worker completo

Credenciales reales `sw_user`/`sw_pass` de la cuenta dealer de JMRA en SmartWeb. Si no
las tienes a mano, pídelas antes del paso 5/6 — no las incluyas en texto plano en
commits ni en este chat; cárgalas directo en `conf.php`.

## Qué NO tocar

- El contrato de los 4 opReq (nombres, payloads, respuestas) — ya lo consume un proxy
  real en producción-a-ser de SisnetV3. Si algo ahí necesita cambiar, es una
  conversación aparte antes de tocarlo, no un ajuste unilateral.
- El modelo de `im_api_clientes` más allá de lo ya incorporado en el addendum.

## Entregable esperado

1. Implementación completa según el plan de fases de §11, con las pruebas que ya
   describe el propio documento en cada fase.
2. Al terminar: la `api_key` de producción para el consumidor "proxy SisnetV3" (con
   `confia_ip_origen='S'`) y la URL pública del endpoint, para reemplazar los
   placeholders en `conf.php` de SisnetV3.
