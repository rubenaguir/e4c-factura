# §11 Autenticación biométrica (huella / Face ID) ✅ Implementada

## Resumen

Autenticación sin contraseña en revisitas usando el autenticador de plataforma del dispositivo (huella digital en Android, Face ID/Touch ID en iOS). No requiere cambios en el backend PHP.

**Tecnología:** WebAuthn API (`navigator.credentials`) — estándar W3C, soportado en Chrome Android, Safari iOS, Edge Desktop.  
**Requisito de infraestructura:** HTTPS en producción (ya requerido por PWA/Service Worker).

---

## Contexto: identificador de sesión compuesto

El sistema es multi-tenant por empresa **y** por instancia de base de datos. El parámetro `sucursal` que se envía al endpoint `Login` es una cadena compuesta con el formato:

```
empresa_id|sucursal_id|instancia_id
```

Ejemplo: `DEMO|MATRIZ|43` donde `instancia_id=43` mapea a una base de datos específica en el servidor backend.

Este valor compuesto corresponde al campo `empresa_sucursal_id` del objeto `SucursalOption` devuelto por `SearchSucursalesUsuario`, y es lo que ya se envía hoy como `sucursal` en el payload del `Login`. El JWT resultante contiene este mismo valor en el atributo `sucursal` del payload.

**Para el login biométrico**, se almacena y reutiliza este valor compuesto completo — no sus partes por separado — garantizando que la re-autenticación apunte a la instancia correcta.

---

## Modelo de seguridad

Las credenciales (usuario + contraseña + empresa/sucursal) se almacenan cifradas en `localStorage`. El cifrado usa AES-GCM 256 con clave derivada via PBKDF2 del `credentialId` WebAuthn. La biometría actúa como **gate de aprobación**: sin pasar la verificación del dispositivo, las credenciales no se leen.

Esto equivale al modelo de keychain biométrico de apps nativas. El JWT ya vive en `localStorage` sin cifrar, por lo que el nivel de riesgo agregado es mínimo.

**Limitación conocida:** la clave de cifrado se deriva de datos locales, no del autenticador. Una mejora futura es usar la extensión `prf` de WebAuthn Level 3 (Chrome 116+) para derivar la clave directamente del hardware biométrico.

---

## Flujos de usuario

### Flujo A — Primera activación (post login manual)

```
Usuario ingresa usuario + contraseña
        │
        ▼
[Paso 1: credenciales] ──► getSucursales()
        │
        ▼ (éxito)
[Paso 2: selección de sucursal] ──► login()
        │
        ▼ (JWT obtenido, app lista)
┌─────────────────────────────────────────────┐
│  Banner en AppShell (solo si:               │
│  biometricSupported && !hasBiometric)       │
│                                             │
│  "¿Activar acceso con huella?"              │
│  [Activar]          [Ahora no]              │
└─────────────────────────────────────────────┘
        │ [Activar]
        ▼
navigator.credentials.create()
  → Prompt biométrico del dispositivo
        │
        ▼ (aprobado)
Cifrar credenciales + guardar en localStorage
  → "Huella activada" (snackbar)
        │
        ▼
Banner se oculta, no vuelve a aparecer
```

### Flujo B — Login con huella (visitas siguientes)

```
LoginPage carga
        │
        ├─ hasBiometric === false ──► formulario normal (sin cambios)
        │
        └─ hasBiometric === true
               │
               ▼
┌─────────────────────────────────┐
│  [campo usuario]                │
│  [campo contraseña]             │
│  [Continuar]                    │
│                                 │
│  ─────────── o ───────────      │
│                                 │
│  [◉ huella]  Entrar con huella  │
└─────────────────────────────────┘
               │ tap en "Entrar con huella"
               ▼
navigator.credentials.get()
  → Prompt biométrico del dispositivo
               │
      ┌────────┴────────┐
      │ aprobado        │ rechazado / cancelado
      ▼                 ▼
Descifrar creds    Mostrar error
  → apiLogin() directo   "Huella no reconocida,
    con sucursal compuesta  ingresa manualmente"
    "DEMO|MATRIZ|43"
    (sin paso de selección
     de sucursal)
  → applyToken()
  → navegar a /
```

### Flujo C — Fallo de credenciales almacenadas

Ocurre si el usuario cambió su contraseña en otra sesión.

```
loginWithBiometric()
  → getSucursales() ──► backend devuelve error (contraseña inválida)
        │
        ▼
Mostrar: "Sesión biométrica expirada. Ingresa
          tu contraseña para reactivarla."
Limpiar sesión biométrica (biometricStorage.clear())
  → flujo manual normal
        │
        ▼ (login exitoso)
Banner de activación aparece de nuevo
```

### Flujo D — Desactivar huella (desde perfil)

```
Menú perfil / Configuración
  → "Desactivar huella digital"
        │
        ▼
Confirmar (Alert Dialog)
  → biometricStorage.clear()
  → hasBiometric = false
  → "Huella desactivada" (snackbar)
```

---

## Arquitectura de archivos

```
src/
├── lib/
│   ├── biometric.ts          ← WebAuthn wrapper
│   └── biometricStorage.ts   ← Cifrado + localStorage
├── context/
│   └── AuthContext.tsx       ← Métodos biométricos integrados
├── pages/
│   └── LoginPage.tsx         ← Botón de huella en paso 1
└── components/
    └── BiometricBanner.tsx   ← Banner de activación post-login
```

---

## Implementación

### `src/lib/biometric.ts`

Wrapper de la WebAuthn API. Sin dependencias externas.

```typescript
// API pública
checkSupport(): Promise<boolean>
register(username: string): Promise<string>     // → credentialId base64url
verify(credentialId: string): Promise<boolean>
```

**Detalles:**
- `rp.id` = `window.location.hostname`
- `authenticatorAttachment: "platform"` — solo biometría del dispositivo, no llaves de seguridad externas
- `userVerification: "required"` — fuerza verificación biométrica (no solo presencia)
- Los challenges se generan con `crypto.getRandomValues` (no se validan en servidor, solo prueban presencia del autenticador local)

### `src/lib/biometricStorage.ts`

Cifrado y almacenamiento de credenciales.

```typescript
interface BiometricSession {
  credentialId: string;    // base64url — identifica el autenticador
  iv: string;              // base64 — vector de inicialización AES-GCM
  ciphertext: string;      // base64 — RawSession cifrado
}

interface RawSession {
  usuario: string;
  contrasena: string;
  workspace: string;
  empresa_id: string;
  sucursal: string;   // valor compuesto: "empresa_id|sucursal_id|instancia_id" (ej: "DEMO|MATRIZ|43")
                      // equivale a SucursalOption.empresa_sucursal_id
}

// API pública
save(credentialId: string, session: RawSession): Promise<void>
load(): Promise<{ credentialId: string; session: RawSession } | null>
clear(): void
```

**Cifrado:**
1. `derivedKey` = `PBKDF2(credentialId, salt="e4c-biometric", iterations=100_000, SHA-256)` → `AES-GCM 256`
2. `iv` = `crypto.getRandomValues(12 bytes)`
3. `ciphertext` = `AES-GCM.encrypt(JSON.stringify(session), derivedKey, iv)`
4. Guardar `{ credentialId, iv, ciphertext }` en `localStorage["e4c_biometric"]`

### `src/context/AuthContext.tsx`

`AuthContextValue` expone:

```typescript
// Estado
hasBiometric: boolean
biometricSupported: boolean

// Acciones
enableBiometric(): Promise<void>
  // 1. biometric.register(state.usuario)
  // 2. Obtener sucursal compuesta desde el JWT activo:
  //    parseTokenPayload(localStorage["sv3_session"]).sucursal → "DEMO|MATRIZ|43"
  // 3. biometricStorage.save(credentialId, { usuario, contrasena, workspace, empresa_id, sucursal })
  //    Las credenciales (usuario/contrasena) vienen de pendingData (aún disponible post-login)

loginWithBiometric(): Promise<void>
  // 1. biometricStorage.load() → obtiene { credentialId, session }
  // 2. biometric.verify(credentialId) → prompt biométrico del dispositivo
  // 3. Si aprobado: apiLogin(session.usuario, session.contrasena, session.workspace,
  //                          session.empresa_id, session.sucursal)
  //    → NO llama getSucursales(), va directo a Login con el sucursal compuesto guardado
  //    → applyToken(res.session) como en el login normal
  // 4. Si backend rechaza credenciales: biometricStorage.clear() + throw con mensaje específico

disableBiometric(): void
  // biometricStorage.clear()
```

### `src/pages/LoginPage.tsx`

En el Paso 1 del formulario, debajo del botón "Continuar":

```tsx
{hasBiometric && (
  <>
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-border" />
      <span className="mx-3 text-xs text-muted-foreground">o</span>
      <div className="flex-grow border-t border-border" />
    </div>
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleBiometricLogin}
      disabled={loading}
    >
      <Fingerprint className="h-4 w-4" />
      Entrar con huella
    </Button>
  </>
)}
```

`handleBiometricLogin` llama `loginWithBiometric()`, captura errores con `showError`, y en caso de credenciales expiradas muestra mensaje orientativo.

### `src/components/BiometricBanner.tsx`

Banner que aparece una vez después del primer login manual si la huella no está activada:

```tsx
// Condición de aparición:
biometricSupported && !hasBiometric && isAuthenticated

// Persiste el "Ahora no" en localStorage["e4c_biometric_dismissed"]
// para no volver a molestar hasta próxima sesión
```

UI: banner pegado al fondo del AppShell (sobre el BottomNav en mobile), con botones [Activar] y [×].

---

## Consideraciones de compatibilidad

| Plataforma | Soporte | Mecanismo |
|---|---|---|
| Android Chrome 67+ | ✅ | Huella digital / desbloqueo de pantalla |
| iOS Safari 16+ | ✅ | Face ID / Touch ID |
| Edge Desktop | ✅ | Windows Hello |
| Chrome Desktop | ✅ | Windows Hello / PIN |
| Firefox | ⚠️ parcial | Sin `platform` authenticator en algunas versiones |

`checkSupport()` evalúa en runtime — si no está soportado, la funcionalidad simplemente no aparece.

---

## Cambio de sucursal / instancia

El login biométrico siempre re-autentica contra la misma empresa, sucursal e instancia de la última sesión. Si el usuario necesita cambiar de sucursal, debe usar el flujo manual (usuario + contraseña), que muestra el selector de sucursal normalmente. Al completar ese login, puede reactivar la huella para la nueva sucursal seleccionada.

---

## Mejora futura: extensión `prf`

Con la extensión `prf` (WebAuthn Level 3, Chrome 116+, Safari 17.4+), la clave AES se puede derivar directamente del autenticador de hardware:

```typescript
// Durante verify():
const assertion = await navigator.credentials.get({
  publicKey: {
    extensions: { prf: { eval: { first: salt } } }
  }
});
const prfOutput = assertion.getClientExtensionResults().prf?.results?.first;
// prfOutput es el material de clave — nunca sale del dispositivo
```

Esto elimina la necesidad de almacenar cualquier material de clave localmente. La migración es backward-compatible: detectar soporte en runtime y usar `prf` cuando esté disponible.
