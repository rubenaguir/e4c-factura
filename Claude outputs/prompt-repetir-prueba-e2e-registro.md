# Prompt — Repetir prueba de punta a punta de /registro (sin stubs)

## Qué cambió desde tu último intento

`conf/conf.php` de SisnetV3 ya apunta a InstanceManager local, no a `10.8.0.22`
(ese servidor todavía no tiene desplegado el módulo `seguri:registro` — por
eso fallaba con "Controlador no identificado"):

```php
define("INSTANCE_MANAGER_API_URL", "http://localhost/empresa4cero-instance-manager/php/interfase_jwt.php");
```

No lo modifiques ni lo reviertas — es intencional mientras `10.8.0.22` no
tenga el módulo. `INSTANCE_MANAGER_API_KEY` no cambió.

## Qué necesito que hagas

Repite la prueba de `/registro` **contra el backend real de punta a punta,
sin ningún stub de `window.fetch`** (la vez pasada tuviste que stubear los 4
`opReq` de registro porque InstanceManager no respondía; ya no hace falta).

### Antes de arrancar

1. Confirma que responden los 3 backends locales:
   - `e4c-factura` (`npm run dev`)
   - SisnetV3 (WAMP, `http://localhost/SisnetV3Desarrollo/...`)
   - InstanceManager (WAMP, `http://localhost/empresa4cero-instance-manager/...`)
2. Usa un **RFC nuevo** (que no tenga ya una instancia activa — si reusas
   `JMRA850101AB2` de tu prueba anterior, `ExisteInstanciaActiva` lo va a
   rechazar) y un **correo real que puedas revisar tú**, que no hayas usado
   antes en una prueba de SmartWeb (el dealer scoping ya nos dio un
   "email ya en uso" una vez con un correo reciclado — ver conversación
   previa).

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
   pantalla de espera y yo lo ejecuto manualmente por PHP CLI (igual que la
   vez que probamos con la instancia 320). No intentes correrlo tú ni
   simules su resultado.
6. Una vez que yo confirme que corrí el worker, sigue observando el
   polling de `EstadoRegistro` hasta `COMPLETADO` (puede tardar según el
   tope de 17 min que ya implementamos, pero con el worker corrido a mano
   debería resolver en el primer poll después de eso).
7. Verifica el redirect final a `/login`: campo `usuario` prellenado con el
   `usuario_id` real que regresó `EstadoRegistro`, y el `Alert` verde con el
   `msg` de éxito del backend.
8. Inicia sesión con ese usuario y la contraseña que capturaste en el Paso 2
   — confirma que entra a la app.

## Qué reportar

- Cualquier error real que aparezca en cualquier paso (cítalo tal cual,
  no lo resumas) — a diferencia de la vez pasada, ahora si algo falla es
  contra el backend real, no un artefacto del stub.
- El `registro_id`, `instancia_id` y `usuario_id` finales.
- Confirmación de que el login post-registro funcionó con las credenciales
  reales capturadas en el wizard (no una cuenta preexistente).
- Si algo en el flujo requirió un cambio de código de tu parte para que
  funcionara (no debería, esto es una repetición de prueba, no una
  implementación) — repórtalo y detente antes de commitear nada.
