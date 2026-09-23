# Prompt — Corregir tope de 50 caracteres en el correo sintético del PAC

## Contexto

Corriendo la prueba real de `/registro`, el worker
(`cron_proccess/procesa_registros_self_service.php`) falló al crear el
usuario en SmartWeb con:

```
Error al crear el usuario en el proveedor de certificación: El Email no puede exceder los 50 caracteres.
```

Causa confirmada: el correo sintético actual (`administrador_usuario_id`
crudo + `@pac.empresa4cero.mx`) puede llegar a 55 caracteres
(`admin_<rfc>_<subfijo>` ya son hasta 35, más 20 del dominio) — SmartWeb
tiene un tope de 50 en el campo `Email`.

`docs/specs/alta-self-service-cuentas.md` ya está actualizado — sección
**"Correo del usuario en el PAC (sintético, no el del cliente)"**, problema 3
("Tope de 50 caracteres en `Email`"), y el pseudocódigo del paso 2. **Léela
primero, no repitas su contenido.**

Resumen de una línea: la fórmula pasa de
`administrador_usuario_id . "@pac.empresa4cero.mx"` a
`substr(sha1(administrador_usuario_id), 0, 16) . "@pac.empresa4cero.mx"` —
16 hex + 20 del dominio = 36 caracteres, con margen amplio bajo el tope de
50, sin importar el largo del RFC o del timestamp.

## Dónde tocar

Un solo lugar: `cron_proccess/procesa_registros_self_service.php`, la línea
donde se deriva `$correoPacSintetico` (dentro del bloque que determina
`$administradorUsuarioId`/`$correoPacSintetico` antes del dup-check —
buscala por el texto `@pac.empresa4cero.mx`, debería ser la única
ocurrencia en el archivo):

```php
// antes:
$correoPacSintetico = $administradorUsuarioId . "@pac.empresa4cero.mx";

// después:
$correoPacSintetico = substr(sha1($administradorUsuarioId), 0, 16) . "@pac.empresa4cero.mx";
```

**No toques nada más** — el dup-check (`getUsers`), `createUser()` y la
llamada a `GuardaConfigPac()` ya usan la variable `$correoPacSintetico`, así
que heredan el cambio automáticamente sin tocarlos.

## Verificación

1. Confirma que sigue siendo **estable entre reintentos**: como
   `$administradorUsuarioId` se relee igual de la BD en un reintento
   (`$esReintentoConInstancia`), `sha1()` de ese mismo valor da siempre el
   mismo hash — no hace falta ningún cambio ahí.
2. Verifica manualmente la longitud con un caso real: toma un
   `administrador_usuario_id` de ejemplo (p. ej.
   `admin_xaxx010101000_20260921_223822`), calcula
   `substr(sha1(...), 0, 16) . "@pac.empresa4cero.mx"` y confirma que da 36
   caracteres.
3. Corre `php -l` sobre el archivo.

## Al terminar

Cita la línea exacta que cambiaste (archivo:línea, antes/después) y el
resultado del cálculo de longitud del punto 2.
