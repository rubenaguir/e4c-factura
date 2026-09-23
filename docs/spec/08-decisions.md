# §11 Decisiones de Diseño Registradas

| # | Decisión | Alternativa descartada | Razón |
|---|---|---|---|
| 1 | Proyecto React separado | Integrar en el mismo WAMP con ExtJS | Deploy independiente, stacks desacoplados |
| 2 | `fetch` nativo | Axios, TanStack Query | Sin dependencias extra, control total |
| 3 | React Context para caché | Redux, Zustand | Suficiente a esta escala |
| 4 | `HashRouter` | `BrowserRouter` | Sin configuración Apache adicional |
| 5 | JWT en body (`session`) | Header `Authorization: Bearer` | Paridad con el resto del stack PHP |
| 6 | Impuestos calculados en el cliente | Recalcular en backend | El backend recibe `importe` por línea; la UI ExtJS permite editar impuestos por concepto (paridad requerida) |
| 7 | Mutaciones siempre online (sin Background Sync) | Cola offline | CFDI es síncrono contra SAT; diferir genera inconsistencias fiscales |
| 8 | shadcn/ui | MUI, Ant Design | Sin runtime, Tailwind-native |
| 9 | Alta inline de cliente/producto en Facturación | Navegar a pantalla de alta | Reduce fricción del flujo principal |
| 10 | Virtualización solo en Productos | Virtualizar todos los listados | Solo productos justifica >10k filas |
| 11 | PWA con VitePWA / Workbox | PWA manual o Next.js | Menor config, HMR intacto |
| 12 | Sin cache offline de mutaciones | Persistencia optimista | Facturación es operación fiscal: no se tolera divergencia |
| 13 | Registro self-service con verificación ligera (RFC + email) | Alta con pago obligatorio desde el registro / cola de aprobación manual total | Bajo friction para la campaña de marketing; el riesgo de abuso se mitiga validando el RFC contra el SAT y verificando el email |
| 14 | CSD opcional en el registro, con recordatorio persistente | CSD bloqueante en el registro | Reduce la fricción de alta; solo el timbrado queda bloqueado hasta subir el CSD, no el resto de la app |
| 15 | Orquestación de alta (instancia + BD + PAC + usuario) vive en InstanceManager | Backend de onboarding nuevo y separado / orquestar desde e4c-factura | InstanceManager ya es dueño del ciclo de vida de instancias y ya ejecuta los scripts de BD; evita duplicar esa responsabilidad |
| 16 | e4c-factura llama a InstanceManager a través de un proxy delgado en el backend PHP de SisnetV3 (servicio-a-servicio) | Llamada directa desde el navegador a InstanceManager con `api_key` en el bundle | El `api_key` no puede protegerse en una SPA sin backend propio; SisnetV3 ya es el único sistema al que `e4c-factura` habla incluso pre-sesión (mismo patrón que `Login`/`SearchSucursalesUsuario`) |
| 17 | Alta de cuenta PAC automatizada vía su API, dentro del flujo de InstanceManager | Alta manual con el PAC / paso asíncrono con cola | El PAC expone API de alta de clientes — se puede automatizar sin intervención manual |
| 18 | Login post-registro reutiliza `LoginPage`/`AuthContext` existentes sin cambios (con `usuario` prellenado) | Auto-login con credenciales emitidas por InstanceManager | InstanceManager no emite JWT ni contraseña — solo `usuario_id`; reusar el login ya probado es más simple y no requiere tocar `AuthContext` |
| 19 | El `api_key` de InstanceManager vive únicamente en el `conf.php` de SisnetV3, nunca en el navegador | Tratarlo como identificador de consumidor público, aceptando su exposición en el bundle | Con el proxy en SisnetV3 (#16) el `api_key` sí puede ser un secreto real — no hay razón para resignarse a exponerlo. Requiere que SisnetV3 reenvíe el IP real del usuario a InstanceManager (ver prompt de SisnetV3), porque de lo contrario el rate limiting por IP de InstanceManager vería siempre la IP del servidor de SisnetV3, no la del usuario |
| 20 | SisnetV3 se modifica solo vía prompts independientes ejecutados en su propio repositorio (nunca editado directo desde aquí) | Congelar SisnetV3 por completo, sin excepción | Se requieren cambios puntuales que solo tienen sentido ahí (proxy de registro, flag `csd_cargado`); se acotan a prompts que respetan los guardrails propios de ese proyecto |
| 21 | Domicilio fiscal (`calle`/`no_exterior`/`no_interior`/`colonia`/`municipio`/`estado`) agrupado bajo un toggle colapsable "Domicilio fiscal (opcional)", cerrado por defecto, en el Paso 1 del registro | Mostrar los 6 campos siempre visibles / quitarlos del alta y capturarlos solo después en Perfil | Son opcionales en schema y BD; mostrarlos siempre añade 6 campos sin marcar como opcionales a un formulario que solo tiene 5 obligatorios. Quitarlos del alta hubiera requerido confirmar que Perfil ya permite completarlos después (fuera de alcance); colapsarlos es reversible y no cambia el contrato con el backend |
