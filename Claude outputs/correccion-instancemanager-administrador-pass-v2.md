# Corrección v2 — documentar `administrador_pass` como decisión intencional

> Ejecutar en la sesión de Claude Code del repo `empresa4cero-instance-manager`.
> Esto **reemplaza** la corrección anterior sobre este mismo tema — aquella asumía
> que no había cambio de código que hacer; desde entonces sí hubo un cambio real y
> **fue aprobado explícitamente por el owner**. Este prompt es solo de
> documentación — **no modificar ninguna consulta SQL ni lógica PHP**.

## La decisión final (confirmada por el owner, 2026-09-05)

`sis_instancias.administrador_pass` guarda la contraseña del administrador de cada
instancia **en texto plano**, escrita por ambas funciones gemelas de alta
(`Instancia::add()` e `instancias.php::Add()`). Es intencional, no un bug:

- InstanceManager solo lo opera personal de soporte interno con rol SuperAdmin sobre
  todas las instancias — no hay acceso de usuarios finales ni de terceros.
- El propósito es que soporte pueda ver la contraseña real del admin de una instancia
  para hacer ajustes que el cliente no sabe hacer, o para darle soporte sin forzar un
  reset (que dejaría al cliente sin conocer su nueva contraseña).
- El owner reconoce que no es la práctica a mantener indefinidamente y ya quedó
  registrado como deuda técnica a resolver más adelante (posible reemplazo por
  cifrado reversible con auditoría, o un mecanismo de sesión de soporte que no
  requiera conocer la contraseña real) — **no es parte del alcance de este prompt**,
  solo se menciona para que la documentación lo refleje correctamente.

## Qué está desactualizado / inconsistente ahora mismo

1. `Databases/patches/2026-09_registros_self_service.sql` (línea ~103): el
   comentario junto al `ALTER TABLE public.sis_instancias ADD COLUMN
   administrador_pass varchar(255)` dice `-- md5 de la contraseña del admin`, pero el
   valor que de hecho se guarda ahí **no** pasa por `md5()` — es la contraseña en
   claro. El comentario contradice el código.
2. `docs/specs/alta-self-service-cuentas.md`, pseudocódigo del worker (paso 4, cerca
   de la línea 740-742): todavía describe el diseño anterior —
   `INSERT sistemas_usuarios (contrasena = md5(pass), administrador_pass = md5(pass))`
   — sin mencionar `sis_instancias` en absoluto. Ya no corresponde a lo que el código
   realmente hace.
3. Las secciones que antes describían esto como "bug (resuelto)" deben quedar
   reformuladas como lo que es: una decisión de producto/seguridad aceptada por el
   owner, con su justificación, no un defecto corregido.

## Qué hacer

1. Corregir el comentario del DDL (§6.3 del documento y el archivo `.sql` real) para
   que diga lo que realmente pasa — texto plano, intencional, por qué — en vez de
   "md5".
2. Actualizar el pseudocódigo del worker en la spec principal para reflejar el
   `INSERT` real: `sis_instancias` incluye `administrador_pass` en claro;
   `sistemas_usuarios` solo tiene `contrasena = md5(pass)` (ya no duplica
   `administrador_pass`).
3. Agregar una nota breve y explícita (en la sección que corresponda, p. ej. donde
   antes estaba el ítem de "bug") con: qué se guarda, por qué (acceso de soporte
   interno, sin usuarios externos), y que es deuda técnica aceptada con intención de
   reemplazo futuro — sin necesidad de detallar el reemplazo, solo dejar constancia.
4. **Recomendado, opcional, sigue siendo solo-documentación:** un comentario de una
   línea directamente arriba de cada `INSERT` que escribe `administrador_pass` en
   `Instancia.class.php` e `instancias.php`, explicando en el propio código por qué
   se guarda en claro — para que alguien que lea el `.php` sin pasar por la spec
   entienda que es deliberado. Es un comentario, no un cambio de lógica.

## Qué NO hacer

- No cambiar ninguna columna, `INSERT`, validación, ni ningún otro comportamiento.
- No revertir a `md5()` ni a la versión anterior — el diseño actual ya fue aprobado.
- No inventar ni prometer un plan de reemplazo concreto — eso se decide después,
  fuera de este prompt.
