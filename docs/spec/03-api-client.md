# §4 Conectividad al Backend

## 4.1 Conexión

| Parámetro | Valor |
|---|---|
| Endpoint | `VITE_API_BASE_URL` (`.env.local`) |
| Método HTTP | `POST` siempre |
| Content-Type | `application/x-www-form-urlencoded` |
| Auth | Campo `session` en el body (JWT) |
| Enrutado | `opReq=Modulo:Vista:Controlador:Accion` |

## 4.2 `src/api/client.ts`

```typescript
export async function apiCall<T>(
  opReq: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T>
```

Reglas internas:
1. Leer JWT de `localStorage` key `sv3_session`.
2. Body `URLSearchParams` con `opReq`, `session`, y `params`.
3. Si `VITE_XDEBUG_ENABLED === "true"` → append `?XDEBUG_SESSION_START=XDEBUG_ECLIPSE`.
4. `POST` → parsear JSON.
5. Si `result.success === false && result.forceLogout === "S"` → logout global.
6. Si `result.success === false` → throw `result.msg ?? result.Message ?? "Error desconocido"`.
7. Retornar `result` tipado como `T`.

## 4.3 Formatos de respuesta

**Lista (Search):** `{ totalCount: number, records: T[] }`

**Registro único (Load):** `{ campo1: valor, ... }`

**Mutación:** `{ msg, log, record: T }` — mostrar `msg` como mensaje de éxito. `record` contiene el documento completo actualizado (`FacturaCompleta`, `ClienteDetalle`, etc.).

**Login:** `{ success, session, workspace, usuario }`

**Error:**
```json
{ "success": false, "Message": "...", "Code": 4, "forceLogout": "S" }
```
| Code | Acción |
|---|---|
| 0 | Mensaje genérico |
| 1 | Mensaje técnico (solo dev) |
| 2/3/4 | Mostrar `Message` al usuario |

## 4.4 Todos los valores numéricos se envían como string

Mantener consistencia con el serializador ExtJS del backend PHP.

## 4.5 Endpoints por módulo

### Autenticación
| opReq | Params |
|---|---|
| `seguri:acceso:acceso_jwt:Login` | `usuario`, `contrasena`, `workspace`, `empresa_id`, `sucursal_id` |
| `seguri:acceso:acceso_jwt:GetWorkspaces` | — |
| `seguri:acceso:acceso_jwt:SearchSucursalesUsuario` | `usuario`, `contrasena` |

### Facturas (`ventas:facturas_venta_33:facturas_venta:*`)

| Acción | Params clave |
|---|---|
| `Search` | `fecha_inicial`, `fecha_final`, `rfc`, `nombre`, `serie`, `folio`, `pedido_serie`, `pedido_folio`, `estatus`, `disable_sucursal_filter` |
| `Load` | `empresa_id`, `serie`, `folio` |
| `LoadPresetClientData` | `cliente_id` → devuelve `FacturaCompleta` de la última factura del cliente |
| `Add` | payload completo (ver `docs/spec/05-screens.md` §payload) — crea y timbra en un paso |
| `AddPrefactura` | mismo payload que `Add` — crea prefactura sin timbrar |
| `UpdatePrefactura` | `serie`, `folio` + mismo payload — actualiza prefactura existente |
| `Stamp` | `serie`, `folio` + mismo payload — timbra una prefactura |
| `Cancel33` | `serie`, `folio`, `motivo`, `folio_sustitucion` — ver notas de cancelación |
| `LoadEstatusSAT` | `serie`, `folio` — llamar **asíncrono** (consulta al SAT, tarda) |
| `PrintPdf` | GET directo (ver nota) — params: `serie`, `folio`, `printMetodoPago` |
| `DownloadFactura` | pendiente documentar |
| `SendMail` | `serie`, `folio`, `nombre`, `correo`, `asunto` |

#### Search — respuesta `FacturaRow`

```typescript
interface FacturaRow {
  start: string
  empresa_id: string
  sucursal_id: string
  fecha: string                    // "DD/MM/YYYY"
  serie: string
  folio: string
  receptor_rfc: string
  receptor_nombre: string
  moneda_id: string
  tipo_cambio: string
  fecha_vencimiento: string
  sub_total_conceptos: string
  descuento: string
  sub_total: string
  total_impuestos_retenidos: string
  total_impuestos_trasladados: string
  total: string
  estatus: string                  // "P" prefactura | "R" timbrada | "C" cancelada
  cancelacion_estatus: string | null
  estatus_sat: string | null
  fecha_timbrado: string | null
  uuid: string | null
  deducible_importe: string | null
  pedidos_venta: string
  num_poliza: string | null
  saldo: string
  num_cta_cobrar: string
  estatus_cxc: string
}
```

#### Load / AddPrefactura / Add / Stamp — respuesta `FacturaCompleta`

```typescript
interface FacturaCompleta {
  empresa_id: string
  version: string                  // "4.0"
  serie: string
  folio: string
  uso_id: string
  uso_descr: string
  confirmacion_pac: string | null
  uuid: string | null              // null en prefactura
  sucursal_id: string
  cliente_id: string
  fecha: string                    // "DD/MM/YYYY HH:mm:ss"
  forma_pago: string
  forma_pago_descr: string
  condiciones_de_pago: string | null
  sub_total_conceptos: string
  descuento: string
  sub_total: string
  total_impuestos_retenidos: string
  total_impuestos_trasladados: string
  sub_total_imp_locales: string
  total_imp_local_retenciones: string
  total_imp_local_traslados: string
  total: string
  motivo_descuento: string | null
  tipo_cambio: string
  moneda_id: string
  metodo_de_pago: string
  metodo_pago: string              // "PUE" | "PPD"
  metodo_pago_descr: string
  num_reg_id_trib: string | null
  num_cta_pago: string | null
  emisor_rfc: string
  emisor_nombre: string
  receptor_rfc: string
  receptor_nombre: string
  fecha_vencimiento: string
  observaciones: string | null
  notas_impresion: string | null
  estatus: string                  // "P" | "R" | "C"
  actualizacion_usuario_id: string
  actualizacion_fecha: string      // "DD/MM/YYYY HH:mm"
  calle: string
  no_exterior: string
  no_interior: string | null
  colonia: string
  localidad: string
  referencia: string | null
  municipio: string
  estado: string
  pais: string
  codigo_postal: string
  vendedor_id: string | null
  vendedor_nombre: string | null
  centro_utilidad_id: string | null
  centro_costo_id: string | null
  regimen_fiscal_id: string
  cancelacion_estatus: string | null
  estatus_sat: string | null
  // Sólo en respuestas de mutación:
  orden_compra_cliente?: string | null
  cancelacion_motivo?: string | null
  cancelacion_motivo_descr?: string | null
  cancelacion_cfdi_reemplaza?: string | null
  cancelacion_acuse?: string | null
  info_seguros: []
  compl_serv_parc_construc: []
  impuestos_locales: ImpuestoLocal[]
  conceptos: Concepto[]
  pedidos: { totalCount: number; records: [] }
  salidas: { totalCount: number; records: [] }
  reportes_consigna: { totalCount: number; records: [] }
  documentos: []
  comercio_exterior: { mercancias: [] }
}

interface ImpuestoLocal {
  impuesto: string                 // "ISR"
  importe: string
  tasa: string
  aplicacion: string               // "R" retención | "T" traslado
}

interface Concepto {
  sku: string
  clave_prod_ser_sat: string
  cantidad: string
  no_identificacion: string
  descripcion: string
  cuenta_predial_numero: string | null
  lista_precios_id: string | null
  precio_lista: string
  precio_unitario: string
  descuento: string
  deducible_integrado: string
  factor_descuento: string
  tipo_descuento: string           // "F" fijo | "P" porcentaje
  importe: string
  importe_precio_lista: string
  observaciones: string | null
  unidad_id: string
  usa_lotes: string                // "S" | "N"
  usa_series: string               // "S" | "N"
  es_paquete: string               // "S" | "N"
  almacenable: string              // "S" | "N"
  item: string
  objeto_impuesto_sat: string      // "02"
  impuestos_traslados: ImpuestoConcepto[]
  impuestos_retenciones: ImpuestoConcepto[]
  info_aduanera: []
}

interface ImpuestoConcepto {
  impuesto: string                 // "IVA"
  aplicacion: string               // "T" | "R"
  tasa: string
  importe: string                  // calculado por el frontend; llega "0" del catálogo
}
```

#### Cancel33 — notas de cancelación

Params: `serie`, `folio`, `motivo`, `folio_sustitucion` (vacío si no aplica)

Motivos SAT: `"01"` comprobante emitido con errores con relación · `"02"` sin relación · `"03"` no se llevó a cabo la operación · `"04"` operación nominativa relacionada en una factura global.

**Flujo de dos pasos:**
1. Primera llamada → envía solicitud al SAT. Respuesta: `FacturaCompleta` con `cancelacion_estatus: "En proceso"`, `estatus` sigue en `"R"`.
2. Segunda llamada (mismo endpoint) → si el SAT ya aprobó la cancelación, el backend la procesa internamente y el `estatus` cambia a `"C"`.

#### LoadEstatusSAT — respuesta `FacturaCompleta` + `sat_estatus`

Params: `serie`, `folio`

**Llamar de forma asíncrona** al mostrar el detalle de una factura timbrada — consulta al SAT y puede tardar varios segundos.

Devuelve `FacturaCompleta` más el campo adicional:

```typescript
interface SatEstatus {
  CodigoEstatus: string        // "S - Comprobante obtenido satisfactoriamente."
  EsCancelable: string         // "Cancelable con aceptación" | "No cancelable" | ...
  Estado: string               // "Vigente" | "Cancelado"
  EstatusCancelacion: string   // "" | "En proceso" | ...
  ValidacionEFOS: string       // "200"
  statusSat: string            // alias de Estado
  isCancelable: string         // alias de EsCancelable
  statusCancelation: string    // alias de EstatusCancelacion
}
// La respuesta incluye: { ...FacturaCompleta, sat_estatus: SatEstatus }
```

#### SendMail

Params: `serie`, `folio`, `nombre`, `correo`, `asunto`

Respuesta: `{ msg, log }` — sin campo `record`. El mensaje se agrega a la bandeja de salida del servidor.

#### PrintPdf

**Patrón diferente al estándar:** es una petición **GET** con los params en la query string, no un POST.

```
GET {VITE_API_BASE_URL}?opReq=ventas:facturas_venta_33:facturas_venta:PrintPdf
  &empresa_id=<id>
  &serie=<serie>
  &folio=<folio>
  &printMetodoPago=<valor>
```

Respuesta: string `data:application/pdf;base64,...` — abrir en nueva pestaña del navegador.

---

### Ingresos (`tesoreria:registro_ingresos_33:registro_ingresos:*`)
| Acción | Params clave |
|---|---|
| `Search` | `start`, `limit`, filtros |
| `Load` | `serie`, `folio` |
| `SearchCuentasCobrar` | `cliente_id` |
| `Add` | payload pago + array `aplicaciones` |
| `Stamp` | `serie`, `folio` |
| `Cancel33` | `serie`, `folio`, `motivo` |
| `PrintPdf` | `serie`, `folio` |

### Clientes (`ventas:clientes:clientes:*`)

#### Search
Params: `cliente_id`, `nombre`, `rfc`, `pais`, `tipo_cliente_deudor=CLIENTE`, `tipo_cliente_id`, `estatus=A`

Respuesta: `{ totalCount, records: ClienteRow[] }`

```typescript
interface ClienteRow {
  empresa_id: string
  cliente_id: string
  corporativo_id: string
  tipo_cliente_deudor: string        // "CLIENTE"
  rfc: string
  nombre: string
  calle: string | null
  no_exterior: string | null
  no_interior: string | null
  colonia: string | null
  localidad: string | null
  referencia: string | null
  municipio: string | null
  estado: string | null
  pais: string                       // "MEX"
  codigo_postal: string | null
  vendedor_id: string | null
  tipo_cliente_id: string | null
  regimen_fiscal_id: string | null
  cuenta_contable: string | null
  estatus: string                    // "A" | "I"
  c_estado: string | null
  c_municipio: string | null
  c_colonia: string | null
  c_localidad: string | null
  actualizacion_fecha: string        // "DD/MM/YYYY HH:mm"
}
```

#### Load
Params: `cliente_id`

Respuesta: `ClienteDetalle` — mismo shape que `ClienteRow` más los campos extendidos:

```typescript
interface ClienteDetalle extends ClienteRow {
  num_proveedor: string | null
  tax_id: string | null
  num_reg_id_trib: string | null
  metodo_de_pago: string | null
  metodo_de_pago_descr: string | null
  lista_precios_id: string
  vendedor_nombre: string | null
  tipo_cliente_descr: string | null
  num_cta_pago: string | null
  dias_credito: string              // numérico como string
  limite_credito: string            // decimal como string, ej. "0.000000"
  contactos: Contacto[]
}

interface Contacto {
  contacto_id: string
  area: string | null
  nombres: string
  apellidos: string
  telefono: string | null
  movil: string | null
  fax: string | null
  correo: string | null
}
```

#### Add
Alta rápida — solo campos mínimos requeridos:

| Param | Valor mínimo |
|---|---|
| `nombre` | razón social |
| `rfc` | RFC válido |
| `codigo_postal` | CP fiscal |
| `pais` | `"MEX"` |
| `regimen_fiscal_id` | clave SAT, ej. `"616"` |
| `tipo_cliente_deudor` | `"CLIENTE"` |
| `estatus` | `"A"` |

Params opcionales (enviar vacíos si no se capturan): `corporativo_id`, `corporativo_nombre`, `corporativo_rfc`, `calle`, `no_exterior`, `no_interior`, `c_colonia`, `colonia`, `c_municipio`, `municipio`, `c_localidad`, `localidad`, `c_estado`, `estado`, `referencia`, `tipo_cliente_id`, `tipo_cliente_descr`, `tax_id`, `num_reg_id_trib`, `dias_credito`, `limite_credito`, `metodo_de_pago`, `metodo_de_pago_descr`, `num_cta_pago`, `lista_precios_id`, `vendedor_id`, `vendedor_nombre`, `cuenta_contable`, `num_proveedor`

Respuesta: `{ msg, record: ClienteDetalle, corporativo: [] }`

> El backend crea automáticamente la dirección `FISCAL_1` al dar de alta el cliente.

#### Update
Params: `cliente_id` + todos los campos del payload de `Add` (sin `cliente_id` vacío).

Respuesta: `{ msg, record: ClienteDetalle }`

> **Inactivar cliente:** enviar `estatus=I`. No existe endpoint `Delete`.

#### SearchDirecciones
Params: `cliente_id`

Respuesta: `{ totalCount, records: Direccion[] }`

```typescript
interface Direccion {
  empresa_id: string
  cliente_id: string
  direccion_id: string              // ej. "FISCAL_1"
  descripcion: string
  calle: string | null
  no_interior: string | null
  no_exterior: string | null
  colonia: string | null
  localidad: string | null
  referencia: string | null
  municipio: string | null
  estado: string | null
  pais: string
  codigo_postal: string | null
  estatus: string
  c_estado: string | null
  c_municipio: string | null
  c_localidad: string | null
  c_colonia: string | null
  ruta_id: string | null
  actualizacion_usuario_id: string
  actualizacion_fecha: string
  creacion_usuario_id: string
  creacion_fecha: string
}
```

#### ValidateCodigoPostal
Params: `c_codigo_postal`

Respuesta:
```typescript
interface ValidateCPResponse {
  c_codigo_postal: string
  c_estado: string      // clave SAT, ej. "CMX"
  estado: string        // descripción, ej. "Ciudad de Mexico"
  c_municipio: string
  municipio: string
  c_localidad: string
  localidad: string
}
```

#### SaveDireccion
Params: `cliente_id`, `direccion_id`, `update` (`"S"` para actualizar, omitir para insertar), más campos de dirección:
`descripcion`, `calle`, `no_exterior`, `no_interior`, `codigo_postal`, `pais`, `c_colonia`, `colonia`, `c_municipio`, `municipio`, `c_localidad`, `localidad`, `c_estado`, `estado`, `referencia`, `estatus`, `ruta_id`

Respuesta: `{ msg, record: Direccion }`

### Productos — Catálogo (`inventarios:catalogo_inventarios:catalogo_inventarios:*`)

Estos endpoints son para el **CRUD del catálogo maestro de productos** (Fase 3).  
No confundir con los dos endpoints de facturación que se describen al final de esta sección.

#### Search
Params (todos opcionales, enviar vacíos si no aplican):

| Param | Descripción |
|---|---|
| `sku` | Código interno |
| `codigo_ean` | Código de barras |
| `clave_prod_ser_sat` | Clave SAT prod/serv |
| `descripcion` | Texto libre |
| `marca` | — |
| `modelo` | — |
| `unidad_id` | Ej. `"PZ"` |
| `clasificador_id` | — |
| `usa_lotes` | `"S"` / `"N"` / `""` |
| `usa_series` | `"S"` / `"N"` / `""` |
| `almacenable` | `"S"` / `"N"` / `""` |
| `estatus` | `"A"` (activo), `"I"` (inactivo), `""` (todos) |

Respuesta: `{ totalCount: number, records: ProductoRow[] }`

```typescript
interface ProductoRow {
  start: string
  empresa_id: string
  sku: string
  descripcion: string
  marca: string | null
  modelo: string | null
  caracteristicas: string | null
  especificaciones: string | null
  almacenable: string              // "S" | "N"
  codigo_ean: string | null
  composicion: string | null
  costeo: string                   // "PROMEDIO"
  unidad_id: string                // "PZ"
  usa_lotes: string                // "S" | "N"
  usa_series: string               // "S" | "N"
  es_paquete: string               // "S" | "N"
  estatus: string                  // "A" | "I"
  esquema_impuestos_id: string     // "GENERAL"
  actualizacion_usuario_id: string
  actualizacion_fecha: string      // "YYYY-MM-DD HH:mm:ss.xxxxxx"
  clave_prod_ser_sat: string | null
  sat_cporte_peso_en_kg: string | null
  mostrar_en_ecommerce: string     // "S" | "N"
  categoria: string | null
}
```

#### Load
Params: `sku`

Respuesta: `ProductoDetalle`

```typescript
interface ProductoDetalle {
  sku: string
  descripcion: string
  marca: string | null
  modelo: string | null
  caracteristicas: string | null
  especificaciones: string | null
  almacenable: string
  codigo_ean: string | null
  composicion: string | null
  clave_prod_ser_sat: string | null
  clave_prod_ser_sat_desc: string | null
  fraccion_arancelaria: string | null
  costeo: string
  unidad_id: string
  es_paquete: string
  es_perecedero: string
  usa_lotes: string
  usa_series: string
  estatus: string
  costo_promedio_mn: string        // decimal como string, ej. "670.820000"
  esquema_impuestos_id: string
  sat_cporte_peso_en_kg: string | null
  categoria: string | null
  mostrar_en_ecommerce: string
  actualizacion_usuario_id: string
  actualizacion_fecha: string      // "DD/MM/YYYY HH:mm"
  categoria_contable_id: string
  partes: []
  equivalentes: []
  unidades: []
  variantes: []
  grupo: []
  impuestos: ImpuestoEsquema[]
  clasificacion: []
  existencias: ExistenciaNode[]
  fotografia: string
}

interface ImpuestoEsquema {
  esquema_impuestos_id: string     // "GENERAL"
  region_id: string                // "GENERAL"
  aplicacion: string               // "T" (traslado) | "R" (retención)
  num_impuesto: string             // "1"
  impuesto: string                 // "IVA"
  tipo_factor: string | null
  tasa: string                     // "16.0000"
}

interface ExistenciaNode {
  almacen_id?: string
  descripcion: string | null
  existencia: number | string
  expanded: boolean | string
  leaf?: string                    // "true" en nodos hoja
  children?: ExistenciaNode[]
}
```

> El nodo raíz de `existencias` tiene `descripcion: "GLOBAL"` con la suma total.  
> Los nodos hijos tienen `almacen_id` con la existencia por almacén.

#### Add
Params requeridos:

| Param | Valor mínimo |
|---|---|
| `sku` | Código único del producto |
| `descripcion` | Descripción del artículo |
| `unidad_id` | Ej. `"PZ"` |
| `estatus` | `"A"` |
| `esquema_impuestos_id` | Ej. `"GENERAL"` |
| `almacenable` | `"S"` / `"N"` |
| `costeo` | `"PROMEDIO"` |
| `es_paquete` | `"S"` / `"N"` |
| `es_perecedero` | `"S"` / `"N"` |
| `usa_lotes` | `"S"` / `"N"` |
| `usa_series` | `"S"` / `"N"` |

Params opcionales (enviar vacíos si no aplican): `codigo_ean`, `marca`, `modelo`, `caracteristicas`, `especificaciones`, `composicion`, `costo_promedio_mn`, `categoria_contable_id`, `clave_prod_ser_sat`, `clave_prod_ser_sat_desc`, `clasificacion_abc`, `mostrar_en_ecommerce`, `categoria`, `fraccion_arancelaria`, `sat_cporte_peso_en_kg`, `fotografia`

Respuesta: `{ msg: string, record: ProductoDetalle }`

#### Update
Params: `sku` + todos los campos del payload de `Add`.

Respuesta: `{ msg: string, record: ProductoDetalle }`

> **Inactivar producto:** enviar `estatus=I`. No existe endpoint `Delete`.

---

### Productos — Búsqueda en Facturación (`ventas:facturas_venta_33:facturas_venta_conceptos:*`)

Estos dos endpoints se usan **exclusivamente en la pantalla de facturación** para buscar/validar un SKU al agregar conceptos. No son el CRUD del catálogo.

#### LoadLovFieldSku
Lista de productos para autocomplete (LOV).

Params: `start`, `limit`, `lista_precios_id`, `pageSize`

Respuesta: `{ totalCount, records: SkuLov[] }`

```typescript
interface SkuLov {
  sku: string
  descripcion: string
  clave_prod_ser_sat: string
  marca: string | null
  modelo: string | null
  submodelo: string | null
  unidad_id: string
  fraccion_arancelaria: string | null
  clave_unidad_sat: string
  unidad_aduana: string | null
  precio: string
  lista_precios_id: string | null
  esquema_impuestos_id: string
  usa_series: string               // "S" | "N"
  usa_lotes: string                // "S" | "N"
  almacenable: string              // "S" | "N"
  precios: [string, string, string, string][]  // [lista_id, precio, moneda, tipo_cambio]
  moneda_id: string
  tipo_cambio: string
  impuestos_traslados: ImpuestoConceptoLov[]
}

interface ImpuestoConceptoLov {
  esquema_impuestos_id: string
  impuesto: string                 // "IVA"
  aplicacion: string               // "T" | "R"
  tasa: string                     // "16.0000"
  tipo_factor: string
  num_impuesto: string
  importe: string                  // siempre "0" — la UI calcula
}
```

Notas:
- `precios[]` = tuplas `[lista_id, precio, moneda, tipo_cambio]`.
- `impuestos_traslados[].importe` llega `"0"` — **la UI calcula `base × tasa`**.
- `objeto_impuesto_sat`: `"01"` no objeto, `"02"` sí objeto, `"03"` sí no obligado, `"04"` sí no desglose.

#### ValidateSku
Valida un SKU exacto ingresado manualmente.

Params: `sku`, `lista_precios_id`

Respuesta: mismo shape que un registro de `LoadLovFieldSku` más `estatus`, `impuestos_retenciones: []`.

### LOVs SAT y Clientes (`Lov:Lov:Lov:*`)

| LOV | Acción |
|---|---|
| Clientes (lista) | `LoadLovFieldClientes` — params: `pageSize` |
| Cliente (validar) | `ValidateLovFieldClientes` — params: `cliente_id` |
| Uso CFDI | `LoadLovFieldUsoCfdi` |
| Forma de pago | `LoadLovFieldFormaPago` |
| Método de pago | `LoadLovFieldMetodoPago` |
| Régimen fiscal | `LoadLovFieldRegimenFiscal` |
| Moneda | `LoadLovFieldMoneda` |
| Unidad de medida | `LoadLovFieldUnidades` |
| Clave SAT prod/serv | `LoadLovFieldClaveProdServ` |
| Objeto impuesto | `LoadLovFieldObjetoImpuesto` |
| Tipo de cambio | `LoadLovFieldTipoCambio` |
| Datos preset cliente | `ventas:facturas_venta_33:facturas_venta:LoadPresetClientData` — params: `cliente_id` → `FacturaCompleta` |

`LoadLovFieldClientes` y `ValidateLovFieldClientes` devuelven `ClienteLov`:

```typescript
interface ClienteLov {
  empresa_id: string
  cliente_id: string
  corporativo_id: string
  rfc: string
  nombre: string
  calle: string | null
  no_interior: string | null
  no_exterior: string | null
  colonia: string | null
  localidad: string | null
  referencia: string | null
  municipio: string | null
  estado: string | null
  pais: string
  codigo_postal: string | null
  metodo_de_pago: string | null
  metodo_de_pago_descr: string | null
  lista_precios_id: string
  vendedor_id: string | null
  vendedor_nombre: string | null
  num_cta_pago: string | null
  dias_credito: string
  limite_credito: string
  fecha_vencimiento: string
  estatus: string                  // "A" | "I"
  regimen_fiscal_id: string
}
```

> `LoadLovFieldClientes` devuelve `{ totalCount, records: ClienteLov[] }`.  
> `ValidateLovFieldClientes` devuelve directamente el objeto `ClienteLov` del cliente validado.
