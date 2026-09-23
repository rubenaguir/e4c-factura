# Prompt — Cambiar "País" de texto libre a selector fijo (México)

## Contexto

En la prueba real de `/registro` confirmamos (código y comportamiento, no
solo reporte) el bug: `useRegistroForm.ts:43` trae `pais: "México"` como
default, y `registroSchemas.ts:29` valida con `.max(255)`, así que un
usuario que no toque el campo manda "México" (6 caracteres) al backend, que
espera un código de 3 (`MEX`) y rechaza `IniciarRegistro` con:

```
El campo 'País' excede la longitud requerida (3)
```

Como e4c-factura solo factura en México por ahora, no tiene sentido dejarlo
como texto libre. Cámbialo a un selector con un único valor fijo — mismo
patrón que ya usa este mismo archivo para "Régimen fiscal" (`Select` /
`SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem`, ya
importado en `DatosFiscalesStep.tsx`).

## Dónde tocar

1. **`src/hooks/useRegistroForm.ts:43`** — cambia el default:
   ```ts
   // antes:
   pais: "México",
   // después:
   pais: "MEX",
   ```

2. **`src/lib/registroSchemas.ts:29`** — ya no es texto libre con tope de
   longitud, es un valor fijo. Cámbialo a:
   ```ts
   // antes:
   pais: z.string().trim().max(255, "Máximo 255 caracteres"),
   // después:
   pais: z.literal("MEX"),
   ```

3. **`src/components/registro/DatosFiscalesStep.tsx` (bloque `id="pais"`,
   ~línea 186-194)** — reemplaza el `<Input>` de texto libre por un
   `<Select>` de una sola opción, siguiendo exactamente el mismo patrón que
   el bloque de `regimen_fiscal` unas líneas arriba en este mismo archivo
   (mismos imports, ya están puestos):
   ```tsx
   <div>
     <Label htmlFor="pais">País</Label>
     <Select
       value={datos.pais}
       disabled={loading}
       onValueChange={(v) => onChange("pais", v)}
     >
       <SelectTrigger id="pais">
         <SelectValue />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="MEX">México</SelectItem>
       </SelectContent>
     </Select>
   </div>
   ```
   El valor que viaja al backend es `"MEX"` (el código), el texto visible es
   `"México"` — mismo patrón que `regimen_fiscal_id` vs. la descripción del
   régimen en el select de arriba.

## Qué NO hacer

- No agregues una lista de países ni un componente nuevo — es un solo valor
  fijo, no una lista real. Si algún día se factura fuera de México, eso es
  un cambio de alcance aparte.
- No toques el resto de `DatosFiscalesStep.tsx` ni el orden de los campos.
- No es necesario agregar `<CampoError mensaje={errores.pais} />` — con el
  selector de un solo valor, ya no hay forma de que el usuario dispare ese
  error desde la UI.

## Al terminar

- Cita las 3 líneas/bloques exactos que cambiaste (archivo:línea).
- Confirma que corriste un registro de prueba (aunque sea hasta Paso 1,
  Continuar) y que `IniciarRegistro` ya no rechaza por el campo País, sin
  necesidad de capturar nada a mano.
- Confirma que no rompiste el `onChange`/estado de `datos.pais` para el
  resto del wizard (Paso 2/3/4 siguen recibiendo `"MEX"` sin cambios).
