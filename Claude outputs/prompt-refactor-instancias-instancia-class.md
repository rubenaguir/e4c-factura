# Prompt — Refactor `instancias.php` a receptor delgado de `Instancia.class.php`

> Ejecutar en la sesión de Claude Code del repo `empresa4cero-instance-manager`.
> La especificación completa y aprobada ya vive en el repo:
> **`docs/specs/refactor-instancias-instancia-class.md`**. Este prompt no repite
> ese contenido — léela primero, completa, antes de tocar código. Todo lo que
> dice esa spec (inventario de funciones, diseño de cada método, restricciones
> de compatibilidad, checklist de aceptación) es la fuente de verdad; si algo
> aquí pareciera contradecirla, gana la spec.

## Qué implementar

Todo lo descrito en la spec bajo "Grupo CRUD de instancia" (§3) y "Grupo
PAC/SmartWeb" (§4):

1. `Add` → delega a `Instancia::add()` (ya existe, sin cambios en la clase).
2. `Load` → delega a `Instancia::getRecord()` vía el constructor (§3.2 de la
   spec) — antes de fijar la validación de `instancia_id`, revisa
   `Validation.class.php` para decidir entre `Text` y `Numeric` (la spec deja
   esto como punto abierto, no lo asume).
3. `Update` y `Delete` → nuevos métodos en `Instancia.class.php` que reciben
   `instancia_id` explícito (§3.3). Importante: **no** los implementes
   construyendo `new Instancia($Sistem, $instancia_id)` — eso dispararía
   `getRecord()` completo (conexión a la BD propia de la instancia) en cada
   actualización/baja, algo que hoy no ocurre. Sigue el patrón de la spec.
4. `SaveOpciones` → nuevo método en `Instancia.class.php` (§3.4). Es el más
   largo y con más ramas del archivo — impleméntalo al final del grupo CRUD y
   pruébalo manualmente contra una instancia de prueba (activar/desactivar
   varios programas) antes de darlo por bueno.
5. Grupo PAC/SmartWeb (§4): crear la clase nueva que propone la spec (el
   nombre es sugerencia, ajústalo si el codebase ya tiene una convención
   distinta) para `CreateUserSW`, `AddTimbresSW`, `GetSaldoTimbresSW`,
   `FindUserSW`, `CreateManiFestSW`, `GenerarPasswordSW`. Usa composición con
   `SWUserManagement` (cliente REST puro, no lo modifiques) y con `Instancia`
   para resolver conexión/datos de empresa, reemplazando `GetInstanceConn`
   (§4.2).

## Restricción dura de compatibilidad (no negociable)

`soap/instancias/wsInstancias.class.php` llama directamente, por nombre, a
`FindUserSW`, `Add`, `CreateUserSW`, `CreateManiFestSW`, `AddTimbresSW`,
`GetSaldoTimbresSW` y `GetFacturasPendientes` como funciones globales tras un
`include_once` de `instancias.php`. Los nombres de función, su firma
`(&$resultType, &$Sistem)` y el shape de su valor de retorno (JSON string) no
cambian bajo ninguna circunstancia, sin importar cuánta lógica se mueva hacia
las clases. Verifica el flujo SOAP después del cambio, no solo la UI del grid.

## Qué NO tocar

- Nada del grupo "fuera de alcance" de la spec (§5): `Search`, `BuildSearchQuery`,
  `ExportPdf`, `ExportExcel`, `LoadOpcionesSistema`, `GetFacturasPendientes`,
  `TestWebService`.
- Los dos hallazgos colaterales documentados en §4.3 de la spec (el orden de
  argumentos en `Instancia::getInstancia()`/`getPACAccountData()`, y la
  duplicación en `modules/instancias/instancias/api.php`). Quedan fuera de este
  trabajo — no los "arregles de paso" aunque los veas de cerca al tocar
  `GetInstanceConn`.
- `administrador_pass` y su comentario ya están correctos — no los toques.

## Al terminar

Repórtame contra el checklist de aceptación de la spec (§7), función por
función, citando archivo y línea de cada cambio real — no un resumen narrativo
de alto nivel. Incluye el resultado de `php -l` sobre cada archivo tocado y de
las pruebas manuales (alta/lectura/actualización/baja/guardado de opciones
desde la UI, y alta + funciones PAC vía el flujo SOAP).
