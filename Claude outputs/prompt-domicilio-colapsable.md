# Prompt — Colapsar los campos opcionales de domicilio en Paso 1 de /registro

## Contexto

`docs/spec/14-alta-self-service.md` (§Paso 1) y `docs/spec/08-decisions.md`
(#21) ya tienen la decisión. **Léelas primero, no repitas su contenido.**

Resumen de una línea: `calle`, `no_exterior`, `no_interior`, `colonia`,
`municipio` y `estado` son opcionales (schema y BD), pero hoy se muestran
siempre en `DatosFiscalesStep.tsx` igual que los 5 campos obligatorios
(`rfc`, `razon_social`, `regimen_fiscal`, `codigo_postal`, `pais`). Van a
agruparse bajo un toggle colapsable, cerrado por defecto.

## Dónde tocar

Solo **`src/components/registro/DatosFiscalesStep.tsx`**.

1. Agrega estado local para el toggle:
   ```tsx
   const [mostrarDomicilio, setMostrarDomicilio] = useState(
     () => Boolean(datos.calle || datos.no_exterior || datos.no_interior ||
                   datos.colonia || datos.municipio || datos.estado)
   );
   ```
   El inicializador con función evita recalcularlo en cada render, y arranca
   **abierto** si el usuario ya había capturado algo (por ejemplo, regresó
   al paso 1 desde el paso 2) — no le escondas datos que ya escribió.

2. Envuelve el bloque de `calle`/`no_exterior`/`no_interior` (el
   `<div className="grid grid-cols-[1fr_auto_auto] ...">` actual) y los
   bloques de `colonia` y `municipio` (los dos `<div>` sueltos que siguen)
   en un contenedor, precedido por un botón toggle:
   ```tsx
   <div>
     <button
       type="button"
       className="text-sm text-primary hover:underline flex items-center gap-1"
       onClick={() => setMostrarDomicilio((v) => !v)}
     >
       {mostrarDomicilio ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
       Domicilio fiscal (opcional)
     </button>
     {mostrarDomicilio && (
       <div className="mt-3 space-y-4">
         {/* aquí van, sin cambios internos: el grid de calle/no_ext/no_int,
             el bloque de colonia, el de municipio */}
       </div>
     )}
   </div>
   ```
   Importa `ChevronDown`/`ChevronUp` de `lucide-react` (ya es dependencia
   del proyecto, no agregues nada nuevo).

3. **`estado` se queda donde está** — hoy vive en el mismo `grid grid-cols-2`
   que `codigo_postal` (que es obligatorio y siempre visible). Sepáralos:
   `codigo_postal` se queda visible siempre (ponlo en su propio `<div>`,
   fuera del grid de 2 columnas ya que pierde su pareja), y `estado` se
   mueve dentro del bloque colapsable, agrupado con `colonia`/`municipio`
   (mismo estilo de input suelto que ellos, no hace falta que comparta grid
   con nada).

## Qué NO hacer

- No cambies el schema (`registroSchemas.ts`) ni nada del payload que se
  manda a `IniciarRegistro` — sigue siendo el mismo objeto `datos`, solo
  cambia qué tan visible es cada campo.
- No agregues `Collapsible` de Radix ni ninguna librería — es un
  `useState` + render condicional, nada más.
- No toques el orden relativo de campos dentro del bloque colapsable
  (calle/no_ext/no_int, luego colonia, luego municipio, luego estado) ni
  los campos obligatorios (`rfc`, `razon_social`, `regimen_fiscal`,
  `codigo_postal`, `pais`).

## Al terminar

- Cita el diff exacto (archivo:línea).
- Confirma que corriste un registro de prueba: Paso 1 sin tocar el toggle
  (el registro debe completarse igual, con los campos de domicilio vacíos)
  y otro abriendo el toggle y llenándolos, para confirmar que ambos casos
  llegan bien a `IniciarRegistro`.
- Corre `npx tsc --noEmit`.
