# Prompt — Repetir prueba de punta a punta de /registro (sin stubs) — v3

## Qué ya quedó confirmado (no repetir análisis, solo ejecutar)

- El correo sintético del PAC (hash de 16 hex + `@pac.empresa4cero.mx`) ya
  se probó real y funcionó: aprovisionó sin "usuario quemado" ni el error de
  50 caracteres (registro `415e3e26-451a-453f-a5b2-16547d037e58`, instancia
  `323`).
- Lo único que falta observar es el **tramo final de la UI**: el redirect
  real a `/login` con `usuario` prellenado + el `Alert` de éxito, que la vez
  pasada no se vio porque el polling llegó al timeout de 17 min antes de que
  yo corriera el worker a mano.

## Antes de arrancar

1. Confirma que responden los 3 backends locales (igual que antes):
   `e4c-factura` (`npm run dev`), SisnetV3 (WAMP), InstanceManager (WAMP).
2. **No toques `.env.local`** de e4c-factura — ya quedó apuntando al backend
   correcto (el que sí ve las instancias creadas en `10.8.0.22`, no
   SisnetV3Desarrollo local). Si algo falla apuntando ahí, repórtalo, no lo
   "arregles" cambiando la URL de vuelta.
3. Usa un **RFC nuevo** (que no haya llegado a `COMPLETADO` antes) y un
   correo real tuyo que puedas revisar.
4. En Paso 1 (Datos fiscales), **captura México/MEX en el campo País a
   mano** — el default de `useRegistroForm.ts:43` sigue rompiendo
   `IniciarRegistro` si lo dejas tal cual (ya lo vimos la vez pasada). No lo
   corrijas ahora, solo evítalo capturando el valor correcto; repórtalo otra
   vez igual para que quede evidencia de que sigue pendiente.

## Flujo

1. Paso 1 → 2 → 3 igual que las veces anteriores (RFC/correo nuevos,
   contraseña válida, país capturado a mano).
2. **Pausa en Paso 3 y pídeme el OTP** — yo te lo paso.
3. "Crear mi cuenta" → `ConfirmarRegistro` → pantalla de espera.
4. **Avísame apenas llegues a la pantalla de espera** — voy a correr el
   worker por PHP CLI **de inmediato**, no esperes tú tampoco antes de
   avisarme, para dejar margen dentro de los 17 minutos.
5. Sigue el polling de `EstadoRegistro` hasta `COMPLETADO` — esta vez sin
   intervenir ni consultarlo tú por consola, quiero ver el comportamiento
   real de la UI hasta el final.
6. Confirma el redirect a `/login`: `usuario` prellenado con el `usuario_id`
   real, `Alert` verde con el `msg` de éxito del backend.
7. Inicia sesión con esas credenciales y confirma que entra a la app.

## Qué reportar

- Timestamps: cuándo pasaste a la pantalla de espera, cuándo me avisaste,
  en qué poll se detectó `COMPLETADO` (para ver si el margen alcanzó con
  holgura esta vez).
- Captura o cita textual del redirect: valor prellenado en `usuario` y
  texto exacto del `Alert`.
- `registro_id`, `instancia_id`, `usuario_id` finales.
- Confirmación de login exitoso.
- Cualquier error real que aparezca — cítalo tal cual.
- No cambies código; si algo requiere un cambio para funcionar, repórtalo y
  detente antes de commitear nada.
