# Corrección — no existe el bug de `administrador_pass`

> Ejecutar en la sesión de Claude Code del repo `empresa4cero-instance-manager`.

## Qué está mal en la documentación actual

`docs/specs/alta-self-service-cuentas.md`, §10 y §12, describen un "bug (resuelto
2026-09-01)": que `Instancia::add()` insertaría `administrador_pass` en
`sis_instancias`, columna que ahí no existiría, y que el fix sería quitarlo de ahí y
agregarlo al `INSERT` de `sistemas_usuarios`.

**Eso no es correcto.** Leyendo `php/classes/Instancia.class.php` (método `add()`) y su
gemela `modules/instancias/instancias/instancias.php` (función `Add()`) directamente:
ninguna de las dos inserta jamás `administrador_pass` en `sis_instancias` — ese
`INSERT` nunca tuvo esa columna. Lo que **ya hacían las dos, desde antes de este
trabajo**, es escribir el mismo `md5($administrador_contrasena)` en dos columnas de
`sistemas_usuarios`: `contrasena` y `administrador_pass`. Esto ya está en producción y
ya ha creado varios cientos de instancias sin incidentes — no había nada roto que
arreglar en el código.

El parche `Databases/patches/2026-09_registros_self_service.sql` (§6.3) ya tiene el
comentario correcto ("la BD real ya tiene `sis_instancias.administrador_pass`, pero a
`sistemas_usuarios` le falta la columna gemela") — es decir, en algún momento se
corrigió el entendimiento, pero no se propagó de vuelta a §10/§12 del documento
principal, que sigue describiendo un bug que nunca existió en el código.

## Qué corregir

1. En §10 (tabla "Cambios en archivos existentes"): quitar la fila que describe el
   supuesto bug de `Instancia.class.php:157,181,198-214` y su fix. No hay cambio de
   código que hacer ahí — `Instancia::add()` se usa tal cual para el worker de
   self-service.
2. En §12 (checklist): quitar o reformular el ítem `[x] administrador_pass` — no fue
   un bug resuelto, es comportamiento preexistente sin relación con este feature.
3. Dejar una nota breve (si se considera útil) señalando que `sistemas_usuarios.
   administrador_pass` duplica `contrasena` sin que se haya encontrado, en este repo,
   ningún lugar que lo lea — deuda técnica preexistente, fuera del alcance de este
   trabajo, no tocar como parte de esta feature.
4. El `ALTER TABLE ... ADD COLUMN IF NOT EXISTS administrador_pass` en el patch SQL
   (§6.3) **se queda igual** — sigue siendo correcto y necesario para que una base de
   datos nueva creada desde el dump (que está desfasado) quede como la real; en una
   base ya existente es un no-op seguro.

## Qué NO cambiar

- Ningún código — `Instancia::add()` y su gemela quedan exactamente como están.
- El resto de la spec (contrato de los 4 endpoints, `ip_origen`/`confia_ip_origen`,
  worker, etc.) no se toca — esto es puramente una corrección de documentación.
