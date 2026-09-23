# Prompt — `administrador_usuario_id` pasa a ser el email de registro

## Contexto

`docs/specs/alta-self-service-cuentas.md` ya tiene la decisión completa —
sección **"Usuario de acceso (`administrador_usuario_id`)"** (dentro de §8,
justo antes de "Contraseña del administrador de instancia"), más los ajustes
relacionados en §7.2 (paso 4 nuevo) y §8 (worker, derivación de
`correo_pac_sintetico`) y el checklist §12. **Léela primero, no repitas su
contenido ni su razonamiento aquí.**

Resumen de una línea: `administrador_usuario_id` deja de ser
`admin_<rfc>_<subfijo>` y pasa a ser el email de registro normalizado. Esto
obliga a: (1) un dup-check nuevo en `IniciarRegistro`, (2) re-derivar
`correo_pac_sintetico` desde `nombre_sesion` en vez de
`administrador_usuario_id` (para no perder su unicidad-por-construcción), y
(3) quitar la línea "Sesión: ..." del correo de bienvenida. Son 4 cambios,
en 3 archivos, todos descritos abajo con el diff exacto.

## Dónde tocar

### 1. `php/classes/Registro.class.php` — nuevo método `ExisteUsuarioId()`

Agrégalo junto a `ExisteInstanciaActiva()` (línea 119), mismo estilo:

```php
public static function ExisteUsuarioId($db, $sistemaId, $usuarioId)
{
   $sqlQuery = "SELECT 1
                FROM sistemas_usuarios
                WHERE sistema_id = $1 AND usuario_id = $2
                LIMIT 1";
   $rs = $db->Query($sqlQuery, [$sistemaId, $usuarioId]);

   return count($rs) > 0;
}
```

### 2. `modules/seguri/registro/registro.php` — llamar el dup-check en `IniciarRegistro`

Línea 106-107 actual:
```php
   if (Registro::ExisteInstanciaActiva($db, $rfc))
      throw new Exception("Ya existe una cuenta activa para este RFC. Inicia sesión o contacta a soporte.", ALERT_USUARIO);
```

Justo después, agrega:
```php
   if (Registro::ExisteUsuarioId($db, REG_SS_SISTEMA_ID, strtolower(trim($email))))
      throw new Exception("Ya existe una cuenta con este correo. Inicia sesión o contacta a soporte.", ALERT_USUARIO);
```

(Va antes de `CheckEfos` y de `BuscarRegistroNoTerminal`, exactamente como
describe §7.2 paso 4 de la spec — no cambies el orden de las validaciones
que ya están.)

### 3. `cron_proccess/procesa_registros_self_service.php` — derivación de usuario y correo PAC

**3a. Línea 118**, cambia qué es `$administradorUsuarioId` en el caso "intento nuevo":
```php
// antes:
$administradorUsuarioId = "admin_{$rfc}_{$subfijo}";
// después:
$administradorUsuarioId = strtolower(trim($registro["email"]));
```
`$subfijo` y `$rfc` (líneas 116-117) **se quedan igual** — siguen haciendo
falta para `nombre_sesion_pac` (siguiente punto), no los borres.

**3b. Línea 120**, `$correoPacSintetico` deja de derivarse de
`$administradorUsuarioId` y pasa a derivarse de un nuevo valor
`$nombreSesionPac` que necesitas introducir. Reemplaza el bloque completo
(líneas ~104-120) por:

```php
      if ($esReintentoConInstancia) {
         // Reintento: reusa tal cual los valores ya persistidos en BD -- NO
         // regenerar nada, tienen que ser los mismos que ya se usaron (o se
         // intentaron usar) para el PAC en el intento anterior.
         $administradorUsuarioId = $registro["administrador_usuario_id"];
         $nombreSesionPac        = $registro["nombre_sesion"];
      } else {
         // Intento nuevo: subfijo se genera una sola vez aquí y se reutiliza
         // en el paso 3 (nombre_db/nombre_sesion) -- NO volver a llamar
         // date("Ymd_His") ahí, o el correo del dup-check quedaría
         // desincronizado del que de verdad se manda a createUser().
         $subfijo = date("Ymd_His");
         $rfc     = strtolower($registro["rfc"]);
         $administradorUsuarioId = strtolower(trim($registro["email"]));
         $nombreSesionPac        = "e4c_{$rfc}_{$subfijo}";
      }
      $correoPacSintetico = substr(sha1($nombreSesionPac), 0, 16) . "@pac.empresa4cero.mx";
```

**3c. Línea ~151**, en el paso 3 (`if (!$esReintentoConInstancia)`), evita
recalcular la misma fórmula dos veces -- reutiliza `$nombreSesionPac`:
```php
// antes:
$nombreDb  = "e4c_{$rfc}_{$subfijo}";
$empresaId = strtoupper(substr($registro["rfc"], 0, 3)) . "_01";
$nombreSesion = $nombreDb;
// después:
$nombreDb  = $nombreSesionPac;
$empresaId = strtoupper(substr($registro["rfc"], 0, 3)) . "_01";
$nombreSesion = $nombreDb;
```

El resto del worker (pasos 4-7: `Instancia->add()`, alta PAC, `UPDATE` final,
correo de bienvenida) **no cambia** — ya usan `$administradorUsuarioId`,
`$correoPacSintetico` y `$nombreSesion` por nombre de variable, no les
importa cómo se calcularon.

### 4. `php/classes/Registro.class.php` — quitar "Sesión" del correo de bienvenida

`EnviarCorreoBienvenida()` (línea ~352-355):
```php
// antes:
$body = "<h2>Tu cuenta está lista</h2>" .
        "<p>Hola {$nombre}, tu cuenta en Empresa4Cero ha sido creada exitosamente.</p>" .
        "<p>Usuario: <strong>{$usuarioId}</strong><br/>Sesión: <strong>{$nombreSesion}</strong></p>" .
        "<p>Ya puedes iniciar sesión con la contraseña que elegiste durante el registro.</p>";
// después:
$body = "<h2>Tu cuenta está lista</h2>" .
        "<p>Hola {$nombre}, tu cuenta en Empresa4Cero ha sido creada exitosamente.</p>" .
        "<p>Usuario: <strong>{$usuarioId}</strong></p>" .
        "<p>Ya puedes iniciar sesión con la contraseña que elegiste durante el registro.</p>";
```
No cambies la firma del método (sigue recibiendo `$nombreSesion` aunque ya
no lo use en el cuerpo) ni el call site en el worker (línea 250) — es el
cambio mínimo, no hace falta tocar nada más.

## Qué NO hacer

- No toques el esquema de BD — no hace falta ninguna migración.
  `sistemas_usuarios.correo` existe pero no se usa aquí (fuera de alcance);
  `nombre_sesion` en `ventas_registros_self_service` ya existe y ya se
  persiste, no es un campo nuevo.
- No agregues normalización de mayúsculas/minúsculas al **login**
  (`SisnetV3Desarrollo/.../acceso_jwt.php`) — está fuera de alcance de este
  cambio (la spec lo marca explícitamente). Solo te toca normalizar
  (`strtolower(trim(...))`) donde `administrador_usuario_id` se **genera**
  (paso 3b arriba) y donde se **consulta** en el dup-check (paso 2 arriba).
- No cambies `GuardaConfigPac()` ni su firma — sigue recibiendo
  `$correoPacSintetico` como parámetro explícito, solo cambia de dónde salió
  ese valor antes de llegar ahí.
- No repitas la fórmula `"e4c_{$rfc}_{$subfijo}"` en dos lugares del worker
  (paso 2 y paso 3) — con el cambio 3c ya no hace falta, queda en un solo
  lugar (`$nombreSesionPac`).

## Al terminar

- Cita los 4 diffs exactos (archivo:línea, antes/después).
- Corre una prueba de registro nueva de punta a punta contra el backend
  real (mismo estilo de las pruebas anteriores): confirma que
  `administrador_usuario_id` que queda en `sis_instancias`/`sistemas_usuarios`
  es el email que capturaste en el registro (no `admin_...`), que el login
  con ese email + la contraseña elegida funciona, y que el correo de
  bienvenida ya no trae la línea "Sesión: ...".
- Prueba el dup-check: intenta iniciar un registro nuevo con un email que
  YA sea `usuario_id` de una cuenta existente (puedes usar uno de los
  `admin_*` manuales existentes en `sistemas_usuarios`, o completar dos
  registros seguidos con el mismo correo) y confirma que `IniciarRegistro`
  rechaza con el mensaje "Ya existe una cuenta con este correo..." antes de
  mandar el OTP.
- Corre `php -l` sobre los 3 archivos tocados (o el equivalente de lint que
  ya use el proyecto).
