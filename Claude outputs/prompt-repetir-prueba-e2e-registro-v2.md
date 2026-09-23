# Prompt — Repetir prueba de punta a punta de /registro (sin stubs) — v2

## Qué cambió desde tu último intento

1. `conf/conf.php` de SisnetV3 sigue apuntando a InstanceManager local (no
   `10.8.0.22`, que todavía no tiene desplegado el módulo `seguri:registro`):

   ```php
   define("INSTANCE_MANAGER_API_URL", "http://localhost/empresa4cero-instance-manager/php/interfase_jwt.php");
   ```

   No lo modifiques ni lo reviertas. `INSTANCE_MANAGER_API_KEY` no cambió.

2. **Se corrigió el bug que tumbó el worker la vez pasada.** El correo que se
   manda al PAC (SmartWeb) para el usuario administrador ya no es el correo
   real del cliente — ahora es uno sintético
   (`{administrador_usuario_id}@pac.empresa4cero.mx`), único por registro.
   Esto ya se verificó línea por línea contra el código real de
   `cron_proccess/procesa_registros_self_service.php` en InstanceManager. No
   debería volver a fallar por "ya existe una cuenta con este correo en el
   proveedor de certificación".

3. Se borraron las filas de intentos anteriores en
   `ventas_registros_self_service` (InstanceManager), así que el rate limit
   por correo (`REG_SS_RL_EMAIL_HORA`/`REG_SS_RL_EMAIL_DIA`, cuenta filas de
   esa tabla sin importar su estatus) quedó en cero — puedes repetir con tu
   correo real sin toparte ese límite.

## Qué necesito que hagas

Repite la prueba de `/registro` **contra el backend real de punta a punta,
sin ningún stub de `window.fetch`**.

### Antes de arrancar

1. Confirma que responden los 3 backends locales:
   - `e4c-factura` (`npm run dev`)
   - SisnetV3 (WAMP, `http://localhost/SisnetV3Desarrollo/...`)
   - InstanceManager (WAMP, `http://localhost/empresa4cero-instance-manager/...`)
2. Usa un **RFC nuevo** — uno que no haya llegado a `COMPLETADO` en un
   intento previo (`ExisteInstanciaActiva` revisa `sis_instancias`, una
   tabla distinta de la que se limpió, así que un RFC que ya terminó en una
   instancia activa se sigue rechazando aunque se hayan borrado los
   registros de `ventas_registros_self_service`). Correo: puedes usar tu
   correo real de siempre, ya no hay límite de intentos pendiente sobre él.

### Flujo

1. Navega a `/registro`, llena Paso 1 (Datos fiscales) con el RFC/correo
   nuevos y Continuar → debe llamar `ValidarRFC` real y avanzar a Paso 2.
2. Paso 2 (Cuenta de acceso): correo real + contraseña válida (política:
   8-72 car., mayúscula, minúscula, dígito, especial, sin espacios, distinta
   del RFC) → Continuar dispara `IniciarRegistro` real y debe llegarte un
   correo con el código OTP.
3. **Aquí necesito tu intervención**: cuando llegues a Paso 3
   (Verificación), **pausa y pídeme el código de 6 dígitos** que llegó al
   correo real — no lo adivines ni lo generes. Yo te lo paso y tú lo
   capturas en el campo.
4. Envía "Crear mi cuenta" → `ConfirmarRegistro` real, debe pasar a la
   pantalla de espera (`AprovisionandoScreen`) con el `msg` del backend.
5. El worker de aprovisionamiento (`cron_proccess/procesa_registros_self_service.php`)
   **no corre automático en local** — avísame en cuanto llegues a la
   pantalla de espera y yo lo ejecuto manualmente por PHP CLI. No intentes
   correrlo tú ni simules su resultado.
6. Una vez que yo confirme que corrí el worker, sigue observando el
   polling de `EstadoRegistro` hasta `COMPLETADO`.
7. Verifica el redirect final a `/login`: campo `usuario` prellenado con el
   `usuario_id` real que regresó `EstadoRegistro`, y el `Alert` verde con el
   `msg` de éxito del backend.
8. Inicia sesión con ese usuario y la contraseña que capturaste en el Paso 2
   — confirma que entra a la app.

## Qué reportar

- Cualquier error real que aparezca en cualquier paso (cítalo tal cual, no
  lo resumas).
- El `registro_id`, `instancia_id` y `usuario_id` finales.
- Confirmación de que el login post-registro funcionó con las credenciales
  reales capturadas en el wizard.
- Confirma explícitamente si el aprovisionamiento del PAC (SmartWeb) pasó
  sin el error de "usuario quemado" — este es el punto que estamos
  validando en esta repetición.
- Si algo en el flujo requirió un cambio de código de tu parte (no debería,
  esto es una repetición de prueba) — repórtalo y detente antes de
  commitear nada.
