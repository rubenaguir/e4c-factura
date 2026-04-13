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

**Mutación:** `{ serie, folio, msg }` — mostrar `msg` como mensaje de éxito.

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
| `Search` | `start`, `limit`, filtros |
| `Load` | `serie`, `folio` |
| `LoadPresetClientData` | `cliente_id` |
| `CargaUltimaFactura` | `cliente_id` |
| `Add` | payload completo (ver `docs/spec/05-screens.md` §payload) |
| `AddPrefactura` | payload completo + `es_prefactura: "S"` |
| `UpdatePrefactura` | `serie`, `folio` + payload |
| `Stamp` | `serie`, `folio` |
| `Cancel33` | `serie`, `folio`, `motivo`, `uuid_sustituye` |
| `LoadEstatusSAT` | `serie`, `folio` |
| `PrintPdf` | `serie`, `folio` |
| `DownloadFactura` | `serie`, `folio` |
| `SendMail` | `serie`, `folio`, destinatarios |

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
| Acción | Params clave |
|---|---|
| `Search` | `start`, `limit`, `razon_social`, `rfc`, `cliente_id` |
| `Load` | `cliente_id` |
| `Add` | `rfc`, `razon_social`, `regimen_fiscal`, `cp` (mínimos) |
| `Update` | `cliente_id` + payload |
| `Delete` | `cliente_id` |
| `SearchDirecciones` | `cliente_id` |
| `SaveDireccion` | `cliente_id` + payload dirección |
| `ValidateCodigoPostal` | `cp` |

### Productos / Conceptos
| opReq | Params |
|---|---|
| `ventas:facturas_venta_33:facturas_venta_conceptos:LoadLovFieldSku` | `query`, `start`, `limit` |
| `ventas:facturas_venta_33:facturas_venta_conceptos:ValidateSku` | `sku` |
| `inventarios:catalogo_productos:catalogo_productos:*` | CRUD (pendiente confirmar con backend) |

**Forma de la respuesta del producto:**
```json
{
  "sku": "04470030000",
  "descripcion": "10 R15 EUZKADY ALL TERRAIN",
  "clave_prod_ser_sat": "25172504",
  "unidad_id": "PZ",
  "clave_unidad_sat": "H87",
  "precio": "2750.0000",
  "lista_precios_id": "LISTA4",
  "esquema_impuestos_id": "GENERAL",
  "moneda_id": "MXN",
  "tipo_cambio": "1.000000",
  "precios": [
    ["LISTA4", "2750.0000", "MXN", "1.000000"],
    ["LISTA2", "1250.0000", "MXN", "1.000000"]
  ],
  "impuestos_traslados": [
    { "esquema_impuestos_id": "GENERAL", "impuesto": "IVA", "aplicacion": "T",
      "tasa": "16.0000", "tipo_factor": "", "num_impuesto": "1", "importe": "0" }
  ],
  "impuestos_retenciones": []
}
```

Notas:
- `precios[]` = tuplas `[lista_id, precio, moneda, tipo_cambio]`.
- `impuestos_traslados[].importe` llega en `"0"` — **la UI lo calcula**.
- `objeto_impuesto_sat`: `"01"` no objeto, `"02"` sí objeto, `"03"` sí no obligado, `"04"` sí no desglose.

### LOVs SAT (`Sistem:Lov:Lov:*`)
| LOV | Acción |
|---|---|
| Uso CFDI | `LoadLovFieldUsoCfdi` |
| Forma de pago | `LoadLovFieldFormaPago` |
| Método de pago | `LoadLovFieldMetodoPago` |
| Régimen fiscal | `LoadLovFieldRegimenFiscal` |
| Moneda | `LoadLovFieldMoneda` |
| Unidad de medida | `LoadLovFieldUnidadMedida` |
| Clave SAT prod/serv | `LoadLovFieldClaveProdServ` |
| Objeto impuesto | `LoadLovFieldObjetoImpuesto` |
| Tipo de cambio | `LoadLovFieldTipoCambio` |

> Confirmar nombres exactos en `php/library/lov.php` al iniciar Fase 1.
