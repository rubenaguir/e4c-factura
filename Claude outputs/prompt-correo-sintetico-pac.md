# Prompt — Correo sintético para el usuario del PAC (SmartWeb)

## Contexto

`docs/specs/alta-self-service-cuentas.md` ya tiene la decisión completa —
sección **"Correo del usuario en el PAC (sintético, no el del cliente)"**
(justo antes de "Contraseña del administrador de instancia") y el pseudocódigo
actualizado en los pasos 2/2a/2b/2c/3/5 del worker. **Léela primero, no
repitas su contenido.** No está commiteada todavía (hay un problema de git
lento/colgado en este repo que estamos resolviendo aparte — no es relevante
para tu trabajo, el archivo en disco ya tiene el contenido correcto).

Resumen de una línea: el campo `email`/`notificationEmail` que se manda a
`SWUserManagement::createUser()` deja de ser el correo real del cliente y pasa
a ser `{administrador_usuario_id}@pac.empresa4cero.mx` — sintético, único por
registro, estable entre reintentos.

## Dónde tocar

Todo en **`cron_proccess/procesa_registros_self_service.php`**, función
`ProcessRegistro()` (el archivo completo tiene 297 líneas, la función
ocupa aprox. líneas 60-250 según la última vez que lo leímos — verifica los
números reales, pueden haber cambiado):

1. **Reordenar la determinación de `administrador_usuario_id`.** Hoy el
   worker calcula `$administradorUsuarioId` (línea ~123 en la última lectura)
   **después** del dup-check del PAC (`getUsers(["Email"=>...])`, línea ~113).
   Eso es un problema: en un intento nuevo (no reintento), `administrador_usuario_id`
   todavía no existe en ese punto, así que no hay de dónde derivar el correo
   sintético para el dup-check. Sigue el pseudocódigo del spec §paso 2: mueve
   (o duplica de forma segura) la determinación de `$administradorUsuarioId`
   a **antes** de la llamada a `getUsers()`:
   - Si es reintento (`$esReintentoConInstancia`): usa
     `$registro["administrador_usuario_id"]` tal cual viene de la BD.
   - Si es intento nuevo: genera `$subfijo = date("Ymd_His")` **una sola vez**
     y `$administradorUsuarioId = "admin_" . strtolower($registro["rfc"]) . "_" . $subfijo`.
     **No vuelvas a llamar `date("Ymd_His")` más adelante** en el bloque que
     arma `$nombreDb`/`$empresaId` (línea ~124-133 actual) — reusa la misma
     variable `$subfijo`, si no vas a terminar con dos timestamps distintos y
     el correo del dup-check no va a coincidir con el que de verdad se manda
     a `createUser`.
   - Con `$administradorUsuarioId` ya resuelto:
     `$correoPacSintetico = $administradorUsuarioId . "@pac.empresa4cero.mx"`.

2. **Dup-check (línea ~113):** cambia
   `$sw->getUsers(["Email" => $registro["email"]])` por
   `$sw->getUsers(["Email" => $correoPacSintetico])`.

3. **`createUser()` (línea ~206-213):** cambia `"email" => $registro["email"]`
   y `"notificationEmail" => $registro["email"]` por `$correoPacSintetico` en
   ambos.

4. **`GuardaConfigPac()` (línea ~263 en adelante):** agrégale un parámetro
   `$correoPacSintetico` explícito (no lo recalcules ahí a partir de
   `$registro["administrador_usuario_id"]` — ese array está en memoria desde
   el inicio de `ProcessRegistro()` y no se refresca después del `UPDATE` que
   guarda `administrador_usuario_id` en un intento nuevo, seguiría viendo el
   valor viejo/null). Actualiza la llamada a `GuardaConfigPac(...)` (línea
   ~217) para pasarle la variable ya resuelta. Dentro de la función, cambia
   `$registro["email"]` por el nuevo parámetro en el `INSERT INTO
   corporativo_empresa_pac` (columnas `usuario_pruebas`/`usuario_produccion`).

5. **No toques** `correo_cobranza` (sigue siendo `$registro["email"]`, el
   correo real — eso es correcto, es para cobranza/facturación, no para el
   PAC) ni el correo de bienvenida (`Registro::EnviarCorreoBienvenida`, sigue
   yendo al correo real del cliente).

## Qué NO es parte de este cambio

- Limpiar en SmartWeb las cuentas de prueba ya creadas con correos reales
  (incluyendo las de Ruben) — eso lo hace Ruben por separado, manualmente o
  con `SWUserManagement::setActive()`. No lo automatices aquí.
- El dominio `pac.empresa4cero.mx` es la convención elegida — no necesita
  existir/recibir correo (SmartWeb solo valida formato). Si en algún punto se
  cambia, es un cambio de una sola línea (la derivación vive en un solo
  lugar).

## Al terminar

- Cita línea por línea qué moviste/cambiaste (no un resumen narrativo) —
  especialmente confirma que `$subfijo` se genera una sola vez y que
  `$correoPacSintetico` es el mismo valor en el dup-check, en `createUser()`
  y en `GuardaConfigPac()`.
- Corre `php -l` sobre el archivo.
- Si puedes, arma un caso de prueba mental (o real, si el ambiente lo permite)
  para el camino de reintento: registro con `instancia_id` ya seteado,
  confirma que reusa `administrador_usuario_id` de la BD y no genera un
  `subfijo` nuevo.
