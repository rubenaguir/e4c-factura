# Prompt — Disparar un correo real para ver la plantilla final

## Contexto

Se volvió a corregir `conf/conf.php` de InstanceManager: la plantilla de
correo ahora es `php/mail_templates/RegistroSelfServiceTemplate/` (logo
oficial de Empresa4Cero + degradado de marca + liga de producción). Solo
necesito **disparar un correo real** para verla — no hace falta completar
el registro.

## Qué necesito que hagas

1. Confirma que los 3 backends locales responden (e4c-factura, SisnetV3,
   InstanceManager).
2. Navega a `/registro` y llena **solo Paso 1 y Paso 2** con un RFC nuevo y
   mi correo real (país: selector, elige México normalmente).
3. Dale "Continuar" en Paso 2 — dispara `IniciarRegistro`, que manda el
   correo de OTP. **No sigas al Paso 3, no me pidas el código.**
4. Confírmame la respuesta textual de `IniciarRegistro`.
5. Detente ahí — no completes el registro, no corras el worker.

## Qué reportar

- El `registro_id` generado (para borrarlo después, cuenta para el rate
  limit de mi correo).
- La respuesta textual de `IniciarRegistro`.
- Nada más — yo reviso mi bandeja de entrada por mi cuenta.
