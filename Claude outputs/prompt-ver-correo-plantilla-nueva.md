# Prompt — Disparar un correo real para ver la plantilla nueva de Empresa4Cero

## Contexto

Se corrigió `conf/conf.php` de InstanceManager: la plantilla de correo pasó
de la de Sisnet a una de Empresa4Cero ya diseñada
(`php/mail_templates/Empresa4ceroTemplate/`). Solo necesito **disparar un
correo real** para verla — no hace falta completar el registro entero.

## Qué necesito que hagas

1. Confirma que los 3 backends locales responden (e4c-factura, SisnetV3,
   InstanceManager — igual que en las pruebas anteriores).
2. Navega a `/registro` y llena **solo Paso 1 y Paso 2** con un RFC nuevo
   (no importa si ya se usó antes para otra cosa, no vamos a completar el
   registro) y mi correo real.
3. En Paso 1 no olvides el selector de País (ya no es texto libre, elige
   México normalmente).
4. Dale "Continuar" en Paso 2 — eso dispara `IniciarRegistro`, que manda el
   correo de OTP. **No necesito el código ni que sigas al Paso 3** — el
   objetivo es solo el correo, no completar el registro.
5. Confírmame que la llamada a `IniciarRegistro` regresó
   `"msg": "Enviamos un código de verificación..."` (o el mensaje que sea,
   cítalo tal cual) — eso confirma que el correo se disparó del lado del
   backend.
6. Detente ahí. No completes el registro, no me pidas el OTP, no corras el
   worker.

## Qué reportar

- El `registro_id` que se generó (para que yo lo borre después, cuenta para
  el rate limit de mi correo igual que los anteriores).
- La respuesta textual de `IniciarRegistro`.
- Nada más — no hay nada que verificar en código, es solo para generar el
  correo. Yo reviso mi bandeja de entrada por mi cuenta.
