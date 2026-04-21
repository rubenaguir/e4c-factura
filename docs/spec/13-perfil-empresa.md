# §13 Perfil y Configuración de Empresa

## Contexto

Pantalla de configuración accesible desde el avatar/menú de usuario en el AppShell. Agrupa tres áreas: datos de la empresa, cambio de contraseña del usuario, y carga del certificado fiscal (CSD) para timbrado CFDI 4.0.

> **Estado:** pendiente de implementación.

---

## Ruta

```
/ (AppShell — protegidas)
  /perfil                              → PerfilPage
```

Acceso desde el sidebar (desktop) y desde el `MobileDrawer` (mobile), en la sección inferior junto al nombre de usuario.

---

## Estructura visual

Layout de secciones apiladas tipo "settings page". Cada sección es una tarjeta `<Card>` de shadcn/ui con encabezado y cuerpo. Mobile: columna única. Desktop (`≥ md`): columna única centrada con `max-w-2xl`.

```
┌───────────────────────────────────────┐
│ ←  Perfil y Configuración             │  TopBar con back
├───────────────────────────────────────┤
│                                       │
│  ╔══ INFORMACIÓN DE LA EMPRESA ══════╗ │
│  ║ Razón social     [____________]  ║ │  solo lectura (nombre)
│  ║ RFC              [____________]  ║ │  solo lectura (rfc)
│  ║ Nombre comercial [____________]  ║ │  editable (nombre_comercial)
│  ║ Régimen fiscal   [____________]  ║ │  editable (regimen_fiscal_id)
│  ║ Calle            [____________]  ║ │
│  ║ No. ext / int    [______][____]  ║ │
│  ║ Colonia          [____________]  ║ │
│  ║ Localidad        [____________]  ║ │
│  ║ Municipio        [____________]  ║ │
│  ║ Estado / País    [______][____]  ║ │
│  ║ Código postal    [____________]  ║ │
│  ║                  [Guardar datos] ║ │
│  ╚════════════════════════════════════╝ │
│                                       │
│  ╔══ CAMBIO DE CONTRASEÑA ═══════════╗ │
│  ║ Contraseña actual  [___________] ║ │  contrasena_anterior
│  ║ Nueva contraseña   [___________] ║ │  contrasena
│  ║ Confirmar nueva    [___________] ║ │  contrasena_confirm
│  ║                  [Actualizar]    ║ │
│  ╚════════════════════════════════════╝ │
│                                       │
│  ╔══ CERTIFICADO DE SELLO DIGITAL ═══╗ │
│  ║ Certificado (.cer)                ║ │
│  ║  [📎 Seleccionar archivo]         ║ │  archivo_certificado
│  ║  nombre-archivo.cer ✓             ║ │  nombre del archivo seleccionado
│  ║                                   ║ │
│  ║ Llave privada (.key)              ║ │
│  ║  [📎 Seleccionar archivo]         ║ │  archivo_llave_privada
│  ║  nombre-archivo.key ✓             ║ │
│  ║                                   ║ │
│  ║ Contraseña de la llave privada    ║ │
│  ║  [___________________________]   ║ │  contrasena · type="password"
│  ║                                  ║ │
│  ║                  [Subir CSD]      ║ │
│  ╚════════════════════════════════════╝ │
│                                       │
└───────────────────────────────────────┘
```

---

## Secciones y comportamiento

### 1. Información de la empresa

- Se carga al montar la página con `LoadBasicData`.
- Campos **solo lectura**: `nombre` (razón social) y `rfc`. No se envían en el payload de update.
- Campos **editables**: `nombre_comercial`, `regimen_fiscal_id`, `calle`, `no_exterior`, `no_interior`, `colonia`, `localidad`, `municipio`, `estado`, `pais`, `codigo_postal`.
- `empresa_id` se envía en el body de `UpdateBasicData` (excepción a la regla 7 — este endpoint lo requiere explícitamente).
- Al presionar **Guardar datos** se llama `UpdateBasicData`. La respuesta devuelve `record` con los datos actualizados; actualizar el estado del formulario con esos valores.
- Toast de éxito con `response.msg`.

### 2. Cambio de contraseña

- Formulario independiente al de datos de empresa.
- Validación local: `nueva contraseña === confirmar nueva`.
- Si no coinciden, error inline antes de llamar al backend.
- Al presionar **Actualizar** se llama `Update` (cambio de contraseña).
- Los tres campos se limpian tras éxito.
- Toast de éxito con `response.msg`.

### 3. Certificado de Sello Digital (CSD)

- Tres inputs independientes: archivo `.cer` (`archivo_certificado`), archivo `.key` (`archivo_llave_privada`), contraseña de llave (`contrasena`).
- Los inputs de archivo muestran el nombre del archivo seleccionado como confirmación visual.
- `LoadBasicData` no devuelve información del CSD; no hay badge de vigencia en esta versión.
- Al presionar **Subir CSD** se llama `UploadCertForFolios` con `multipart/form-data` (ver nota en endpoint).
- `empresa_id` **no** se envía — el backend lo toma del JWT.
- La contraseña de la llave privada **nunca** se almacena en estado persistente; solo existe en el estado del formulario durante la sesión.
- Toast de éxito con `response.msg`.

---

## Componentes

```
src/
  pages/
    PerfilPage.tsx               ← orquesta las tres secciones, llama LoadBasicData
  hooks/
    useEmpresaForm.ts            ← estado y submit de datos de empresa
    useCambioContrasenaForm.ts   ← estado y submit de cambio de contraseña
    useCsdForm.ts                ← estado y submit de carga CSD
  components/perfil/
    EmpresaInfoCard.tsx          ← <Card> datos de empresa
    CambioContrasenaCard.tsx     ← <Card> cambio de contraseña
    CsdUploadCard.tsx            ← <Card> carga de certificado CSD
```

`PerfilPage` solo orquesta renders (regla SOLID §10-d). Cada `<Card>` recibe su hook correspondiente como props.

---

## Gestión de estado

- No hay estado global. Cada sección usa su propio hook.
- `useEmpresaForm` inicializa con los datos que devuelve `LoadBasicData`. Tras un `UpdateBasicData` exitoso, actualiza el estado con el objeto `response.record`.
- `LoadBasicData` no tiene envelope `{ success }` — la respuesta **es** el objeto directamente. Tratar un objeto válido como éxito; ausencia o error HTTP como fallo.
- Los formularios de contraseña y CSD inician vacíos.
- Errores de backend: `response.msg ?? response.Message ?? "Error desconocido"`.

---

## Endpoints

### `LoadBasicData`

**opReq:** `sistema:empresas:empresas:LoadBasicData`  
**Cuándo:** al montar `PerfilPage`.  
**Parámetros adicionales:** ninguno (empresa del JWT).

**Request:**
```
POST /SisnetV3Desarrollo/php/interfase_jwt.php?opReq=sistema:empresas:empresas:LoadBasicData&session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiYWRtaW4iLCJjb250cmFzZW5hIjoiIiwic3VjdXJzYWwiOiJERU1PfE1BVFJJWnw0MyIsImluc3RhbmNpYSI6IjQzIiwiZW1wcmVzYSI6IkRFTU8iLCJzdWIiOiJhZG1pbiIsInN0YXJ0IjoiMjAyNi0wNC0yMSAxMjo0NDoxOSIsImVuZCI6IjIwMjYtMDQtMjEgMTY6NDQ6MTkiLCJ0aW1lc3RhbXAiOjE3NzY3OTM0NTksImlhdCI6MTc3Njc5MzQ1OSwiZXhwIjoxNzc2ODA3ODU5LCJleHBpcmVzSW4iOiI0IGhvdXIifQ.kBr8MpLwX0Kchgzg05I6ChQEIq67Urj3jPYYx3p87IY&empresa_id=DEMO HTTP/1.1
Host: localhost
```

**Response:**
```json
{
    "empresa_id": "DEMO",
    "corporativo_id": "DEMO",
    "esquema_facturacion": "CFDI",
    "rfc": "EKU9003173C9",
    "curp": null,
    "nombre": "ESCUELA KEMPER URGATE SA DE CV",
    "nombre_comercial": "ESCUELA KEMPER URGATE",
    "calle": "ALVARO OBREGON",
    "no_exterior": "96",
    "no_interior": null,
    "colonia": "1765",
    "localidad": "DISTRITO FEDERAL",
    "referencia": null,
    "municipio": "016",
    "estado": "DIF",
    "pais": "MEX",
    "codigo_postal": "42501",
    "regimen_fiscal_id": "601"
}
```

---

### `UpdateBasicData`

**opReq:** `sistema:empresas:empresas:UpdateBasicData`  
**Cuándo:** submit de la sección "Información de la empresa".

**Request:**
```
POST /SisnetV3Desarrollo/php/interfase_jwt.php?opReq=sistema:empresas:empresas:UpdateBasicData&session=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiYWRtaW4iLCJjb250cmFzZW5hIjoiIiwic3VjdXJzYWwiOiJERU1PfE1BVFJJWnw0MyIsImluc3RhbmNpYSI6IjQzIiwiZW1wcmVzYSI6IkRFTU8iLCJzdWIiOiJhZG1pbiIsInN0YXJ0IjoiMjAyNi0wNC0yMSAxMjo0NDoxOSIsImVuZCI6IjIwMjYtMDQtMjEgMTY6NDQ6MTkiLCJ0aW1lc3RhbXAiOjE3NzY3OTM0NTksImlhdCI6MTc3Njc5MzQ1OSwiZXhwIjoxNzc2ODA3ODU5LCJleHBpcmVzSW4iOiI0IGhvdXIifQ.kBr8MpLwX0Kchgzg05I6ChQEIq67Urj3jPYYx3p87IY&empresa_id=DEMO&regimen_fiscal_id=601&codigo_postal=42501&nombre_comercial=ESCUELA KEMPER URGATE&calle=ALVARO OBREGON&no_exterior=96&no_interior=null&colonia=San Juan&localidad=DISTRITO FEDERAL&municipio=016&estado=DIF&pais=MEX HTTP/1.1
Host: localhost
```

**Response:**
```json
{
    "success": true,
    "msg": "El registro se actualizó correctamente.\n",
    "record": {
        "empresa_id": "DEMO",
        "corporativo_id": "DEMO",
        "esquema_facturacion": "CFDI",
        "rfc": "EKU9003173C9",
        "curp": null,
        "nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "nombre_comercial": "ESCUELA KEMPER URGATE",
        "calle": "ALVARO OBREGON",
        "no_exterior": "96",
        "no_interior": null,
        "colonia": "San Juan",
        "localidad": "DISTRITO FEDERAL",
        "referencia": null,
        "municipio": "016",
        "estado": "DIF",
        "pais": "MEX",
        "codigo_postal": "42501",
        "regimen_fiscal_id": "601"
    }
}
```

---

### `Update` (cambio de contraseña)

**opReq:** `sistema:cambio_contrasena:cambio_contrasena:Update`  
**Cuándo:** submit de la sección "Cambio de contraseña".  
**Implementación:** `apiCall` estándar (`application/x-www-form-urlencoded`, JWT en body).

**Request:**
```
POST /SisnetV3Desarrollo/php/interfase_jwt.php HTTP/1.1
Host: localhost
Content-Type: application/x-www-form-urlencoded

opReq=sistema%3Acambio_contrasena%3Acambio_contrasena%3AUpdate
&session=<JWT>
&contrasena_anterior=DscorpDevelop2025
&contrasena=DscorpDevelop2026
&contrasena_confirm=DscorpDevelop2026
```

**Response:**
```json
{"success":true,"msg":"La contraseña se actualizó correctamente"}
```

---

### `UploadCertForFolios`

**opReq:** `sistema:empresas:empresas:UploadCertForFolios`  
**Cuándo:** submit de la sección "Certificado de Sello Digital".  
**Implementación:** `fetch` directo con `FormData` — no puede usar `apiCall` porque el backend espera `multipart/form-data`. El JWT va como campo `session` dentro del `FormData`. Campos: `archivo_certificado` (File, `.cer`), `archivo_llave_privada` (File, `.key`), `contrasena` (string), `opReq` (string), `session` (JWT string). El `empresa_id` lo toma el backend del JWT.

**Request:**
```
POST /SisnetV3Desarrollo/php/interfase_jwt.php HTTP/1.1
Host: localhost
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="opReq"

sistema:empresas:empresas:UploadCertForFolios
------WebKitFormBoundary
Content-Disposition: form-data; name="session"

<JWT>
------WebKitFormBoundary
Content-Disposition: form-data; name="archivo_certificado"; filename="eku9003173c9.cer"
Content-Type: application/x-x509-ca-cert

<binary>
------WebKitFormBoundary
Content-Disposition: form-data; name="archivo_llave_privada"; filename="Claveprivada_FIEL_EKU9003173C9_20230517_223532.key"
Content-Type: application/octet-stream

<binary>
------WebKitFormBoundary
Content-Disposition: form-data; name="contrasena"

12345678a
------WebKitFormBoundary--
```

**Response:**
```json
{"success":true,"msg":"El certificado se actualiz\u00f3 correctamente"}
```

---

## UX / accesibilidad

- Cada `<Card>` tiene su propio botón de submit; los formularios son independientes.
- Los botones muestran estado de carga (spinner, disabled) mientras el request está en vuelo.
- Errores de validación inline bajo cada campo (`<p className="text-sm text-destructive">`).
- Los inputs de archivo usan `<input type="file" accept=".cer">` / `accept=".key"` con un botón visual encima (patrón shadcn/ui).
- En mobile los botones de acción son `w-full`.

---

## Colores y tokens

Se usan los tokens CSS de shadcn/ui ya configurados en el proyecto:

| Elemento | Token |
|---|---|
| Fondo de página | `background` |
| Tarjetas | `card` / `card-foreground` |
| Bordes de sección | `border` |
| Botón principal | `primary` / `primary-foreground` |
| Errores inline | `destructive` |
| Texto secundario | `muted-foreground` |
