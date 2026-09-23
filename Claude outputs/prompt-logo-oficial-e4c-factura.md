# Prompt — Usar el logo oficial de Empresa4Cero en vez del badge "E4" de texto

## Contexto

Hoy el badge de marca en varias pantallas es un `<div>` con `brand-gradient`
y un `<span>E4</span>` de texto, no un logo real. Ya coloqué el logo
oficial (vectorial) en `src/assets/empresa4cero-logo.svg` — vino de
`Branding 2026/empresa4cero_2026_logo.svg`, es el ícono con el gradiente de
marca y el fondo blanco redondeado ya incluidos en el propio archivo (no es
solo un glifo, es un logo completo con su propio contenedor).

**Por eso, donde lo uses, quita el `<div>` contenedor con `brand-gradient`
que lo envuelve hoy** — el logo ya trae su propio fondo/redondeo, ponerlo
dentro de otro contenedor de color se vería doble.

## Dónde tocar (4 lugares, mismo patrón "E4" de texto)

1. **`src/pages/LoginPage.tsx`** (~línea 150-152):
   ```tsx
   // antes:
   <div className="h-9 w-9 rounded-lg brand-gradient flex items-center justify-center shadow-md">
     <span className="text-white font-bold text-sm">E4</span>
   </div>
   // después:
   <img src={logoEmpresa4Cero} alt="Empresa4Cero" className="h-9 w-9" />
   ```

2. **`src/pages/RegistroPage.tsx`** (~línea 25-27) — mismo cambio, mismo
   tamaño (`h-9 w-9`).

3. **`src/components/layout/TopBar.tsx`** (~línea 99-101) — el badge aquí es
   más chico (`h-7 w-7`) y vive sobre el header con gradiente
   (`brand-gradient`). Usa el mismo logo a `h-7 w-7`; si se ve muy apretado
   o el fondo blanco del logo choca visualmente con el header de color,
   dime qué observaste en vez de improvisar una versión distinta del logo.

4. **`src/components/layout/MobileDrawer.tsx`** (~línea 33-35) — mismo
   cambio, `h-7 w-7`, contenedor hoy es `bg-primary` (quítalo igual).

En los 4 casos, importa el asset como cualquier otro de `src/assets/`
(mismo patrón que ya se usa para `hero.png`, etc. — revisa cómo importan
imágenes en el proyecto y sigue ese patrón, no inventes uno nuevo).

## Qué NO hacer

- No toques el texto adyacente ("E4C Facturación", "Crear cuenta", etc.) —
  es el nombre del producto, distinto del logo de la empresa; ambos
  coexisten (patrón normal: logo de la compañía + nombre del producto).
- No regeneres ni edites el SVG — úsalo tal cual está en `src/assets/`.
- No lo uses en ningún otro lado que no esté listado arriba — si ves más
  badges "E4" de texto en otros componentes que no mencioné, repórtalos,
  no los cambies sin que te lo pida.

## Al terminar

- Cita los 4 cambios (archivo:línea, antes/después).
- Corre `npx tsc --noEmit`.
- Toma capturas (o descríbelas con precisión) de las 4 pantallas para
  confirmar que el logo se ve bien a esos tamaños (`h-9 w-9` y `h-7 w-7`) —
  especialmente el de `TopBar.tsx`, que es el único sobre fondo de color en
  vez de blanco.
