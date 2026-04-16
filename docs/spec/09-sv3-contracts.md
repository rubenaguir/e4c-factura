## Ejemplos de interaccion con el backend para modulo de facturación

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Search

Consulta de factura

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "fecha_inicial=01%2F04%2F2026&fecha_final=&rfc=&nombre=&serie=&folio=&pedido_serie=&pedido_folio=&estatus=&disable_sucursal_filter=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ASearch",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "totalCount": 1,
    "records": [
        {
            "start": "0",
            "empresa_id": "DEMO",
            "sucursal_id": "MATRIZ",
            "fecha": "07\/04\/2026",
            "serie": "F",
            "folio": "1524",
            "receptor_rfc": "RAVM810219IW0",
            "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
            "moneda_id": "MXN",
            "tipo_cambio": "1.000",
            "fecha_vencimiento": "07\/05\/2026",
            "sub_total_conceptos": "2750.000000",
            "descuento": "0.000000",
            "sub_total": "2750.000000",
            "total_impuestos_retenidos": "0.000000",
            "total_impuestos_trasladados": "440.000000",
            "total": "3080.000000",
            "estatus": "R",
            "cancelacion_estatus": null,
            "estatus_sat": null,
            "fecha_timbrado": "07\/04\/2026",
            "uuid": "7187c798-9cf7-456d-9299-843db6cb6d25",
            "deducible_importe": null,
            "pedidos_venta": "",
            "num_poliza": null,
            "saldo": "3080.000000",
            "num_cta_cobrar": "1404",
            "estatus_cxc": "R"
        }
    ]
}
```


#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Load

Recupera una factura a la pantalla

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ALoad&empresa_id=DEMO&serie=F&folio=1524",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "empresa_id": "DEMO",
    "version": "4.0",
    "serie": "F",
    "folio": "1524",
    "uso_id": "G03",
    "uso_descr": "Gastos en general",
    "confirmacion_pac": null,
    "uuid": "7187c798-9cf7-456d-9299-843db6cb6d25",
    "sucursal_id": "MATRIZ",
    "cliente_id": "6",
    "fecha": "07\/04\/2026 14:10:39",
    "forma_pago": "99",
    "forma_pago_descr": "Por definir",
    "condiciones_de_pago": null,
    "sub_total_conceptos": "2750.000000",
    "descuento": "0.000000",
    "sub_total": "2750.000000",
    "total_impuestos_retenidos": "0.000000",
    "total_impuestos_trasladados": "440.000000",
    "sub_total_imp_locales": "3190.000000",
    "total_imp_local_retenciones": "110.000000",
    "total_imp_local_traslados": "0.000000",
    "total": "3080.000000",
    "motivo_descuento": null,
    "tipo_cambio": "1.000000",
    "moneda_id": "MXN",
    "metodo_de_pago": "99",
    "metodo_pago": "PPD",
    "metodo_pago_descr": "Pago en parcialidades o diferido",
    "num_reg_id_trib": null,
    "num_cta_pago": null,
    "emisor_rfc": "EKU9003173C9",
    "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
    "receptor_rfc": "RAVM810219IW0",
    "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
    "fecha_vencimiento": "07\/05\/2026",
    "observaciones": null,
    "notas_impresion": null,
    "estatus": "R",
    "actualizacion_usuario_id": "salvadorhernandez",
    "actualizacion_fecha": "07\/04\/2026 14:10",
    "calle": "Monterrey",
    "no_exterior": "22",
    "no_interior": null,
    "colonia": "Vergel de Guadalupe",
    "localidad": "Ciudad Nezahualcoyotl",
    "referencia": null,
    "municipio": "Nezahualcoyotl",
    "estado": "Mexico",
    "pais": "MEX",
    "codigo_postal": "57150",
    "vendedor_id": null,
    "vendedor_nombre": null,
    "centro_utilidad_id": null,
    "centro_costo_id": null,
    "regimen_fiscal_id": "601",
    "cancelacion_estatus": null,
    "estatus_sat": null,
    "info_seguros": [],
    "compl_serv_parc_construc": [],
    "impuestos_locales": [
        {
            "impuesto": "ISR",
            "importe": "110.00",
            "tasa": "4.00",
            "aplicacion": "R"
        }
    ],
    "conceptos": [
        {
            "sku": "04470030000",
            "clave_prod_ser_sat": "25172504",
            "cantidad": "1.0",
            "no_identificacion": "04470030000",
            "descripcion": "10 R15 EUZKADY ALL TERRAIN",
            "cuenta_predial_numero": null,
            "lista_precios_id": null,
            "precio_lista": "2750.00",
            "precio_unitario": "2750.00",
            "descuento": ".00",
            "deducible_integrado": ".00",
            "factor_descuento": ".0",
            "tipo_descuento": "F",
            "importe": "2750.00",
            "importe_precio_lista": "2750.00",
            "observaciones": null,
            "unidad_id": "PZ",
            "usa_lotes": "N",
            "usa_series": "N",
            "es_paquete": "N",
            "almacenable": "S",
            "item": "1",
            "objeto_impuesto_sat": "02",
            "impuestos_traslados": [
                {
                    "impuesto": "IVA",
                    "aplicacion": "T",
                    "tasa": "16.0",
                    "importe": "440.00"
                }
            ],
            "impuestos_retenciones": [],
            "info_aduanera": []
        }
    ],
    "pedidos": {
        "totalCount": 0,
        "records": []
    },
    "salidas": {
        "totalCount": 0,
        "records": []
    },
    "reportes_consigna": {
        "totalCount": 0,
        "records": []
    },
    "documentos": [],
    "comercio_exterior": {
        "mercancias": []
    }
}
```


#### Endpoint : opReq=Lov:Lov:Lov:LoadLovFieldClientes

Consulta clientes para selección en la pantalla de facturación

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=Lov%3ALov%3ALov%3ALoadLovFieldClientes&pageSize=500",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "totalCount": 2,
    "records": [
        {
            "empresa_id": "DEMO",
            "cliente_id": "102",
            "corporativo_id": "102",
            "rfc": "XEXX010101000",
            "nombre": "ABEL MORENO BALTAZAR",
            "calle": "Calz. Pie de la Cuesta",
            "no_interior": "Local 2",
            "no_exterior": "LT 1 MZ 6",
            "colonia": "Mozimba",
            "localidad": "Acapulco de Jurez",
            "referencia": null,
            "municipio": "Acapulco de Jurez",
            "estado": "Guerrero",
            "pais": "MEX",
            "codigo_postal": "39460",
            "metodo_de_pago": null,
            "metodo_de_pago_descr": null,
            "lista_precios_id": "",
            "vendedor_id": null,
            "vendedor_nombre": null,
            "num_cta_pago": null,
            "dias_credito": "0",
            "limite_credito": "0.000000",
            "fecha_vencimiento": "14\/04\/2026",
            "estatus": "A",
            "regimen_fiscal_id": "612"
        },
        {
            "empresa_id": "DEMO",
            "cliente_id": "111",
            "corporativo_id": "111",
            "rfc": "ZAZA750214DV8",
            "nombre": "ABEL ZARAZUA ZUIGA",
            "calle": "16 DE SEPTIEMBRE",
            "no_interior": null,
            "no_exterior": "383",
            "colonia": "2 de Junio",
            "localidad": "Chihuahua",
            "referencia": null,
            "municipio": "Chihuahua",
            "estado": "Chihuahua",
            "pais": "MEX",
            "codigo_postal": "31134",
            "metodo_de_pago": null,
            "metodo_de_pago_descr": null,
            "lista_precios_id": "",
            "vendedor_id": null,
            "vendedor_nombre": null,
            "num_cta_pago": null,
            "dias_credito": "0",
            "limite_credito": "0.000000",
            "fecha_vencimiento": "14\/04\/2026",
            "estatus": "I",
            "regimen_fiscal_id": "612"
        }
    ]
}
```

#### Endpoint : opReq=Lov:Lov:Lov:ValidateLovFieldClientes

Valida el cliente indicado en la pantalla de facturación (En el campo de cliente, si escribes el numero de cliente, se dispara esta consulta y recupera los datos del cliente)

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=Lov:Lov:Lov:ValidateLovFieldClientes&cliente_id=6",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "cliente_id": "6",
    "corporativo_id": "6",
    "rfc": "RAVM810219IW0",
    "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
    "calle": "Monterrey",
    "no_interior": null,
    "no_exterior": "22",
    "colonia": "Vergel de Guadalupe",
    "localidad": "Ciudad Nezahualcoyotl",
    "referencia": null,
    "municipio": "Nezahualcoyotl",
    "estado": "Mexico",
    "pais": "MEX",
    "codigo_postal": "57150",
    "metodo_de_pago": null,
    "metodo_de_pago_descr": null,
    "lista_precios_id": "",
    "vendedor_id": null,
    "vendedor_nombre": null,
    "num_cta_pago": "1234",
    "dias_credito": "30",
    "limite_credito": "100000.000000",
    "fecha_vencimiento": "14\/05\/2026",
    "estatus": "A",
    "regimen_fiscal_id": "612"
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:LoadPresetClientData

Al seleccionar el cliente en la pantalla de factura, carga la información de la ultima factura (de ese cliente) para precargar informacion de metodo de pago, moneda, forma de pago, uso del comprobante, regimen fiscal, etc. (para evitar seleccionar nuevamente esos datos)

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ALoadPresetClientData&cliente_id=6",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "empresa_id": "DEMO",
    "version": "4.0",
    "serie": "F",
    "folio": "1524",
    "uso_id": "G03",
    "uso_descr": "Gastos en general",
    "confirmacion_pac": null,
    "uuid": "7187c798-9cf7-456d-9299-843db6cb6d25",
    "sucursal_id": "MATRIZ",
    "cliente_id": "6",
    "fecha": "07\/04\/2026 14:10:39",
    "forma_pago": "99",
    "forma_pago_descr": "Por definir",
    "condiciones_de_pago": null,
    "sub_total_conceptos": "2750.000000",
    "descuento": "0.000000",
    "sub_total": "2750.000000",
    "total_impuestos_retenidos": "0.000000",
    "total_impuestos_trasladados": "440.000000",
    "sub_total_imp_locales": "3190.000000",
    "total_imp_local_retenciones": "110.000000",
    "total_imp_local_traslados": "0.000000",
    "total": "3080.000000",
    "motivo_descuento": null,
    "tipo_cambio": "1.000000",
    "moneda_id": "MXN",
    "metodo_de_pago": "99",
    "metodo_pago": "PPD",
    "metodo_pago_descr": "Pago en parcialidades o diferido",
    "num_reg_id_trib": null,
    "num_cta_pago": null,
    "emisor_rfc": "EKU9003173C9",
    "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
    "receptor_rfc": "RAVM810219IW0",
    "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
    "fecha_vencimiento": "07\/05\/2026",
    "observaciones": null,
    "notas_impresion": null,
    "estatus": "R",
    "actualizacion_usuario_id": "salvadorhernandez",
    "actualizacion_fecha": "07\/04\/2026 14:10",
    "calle": "Monterrey",
    "no_exterior": "22",
    "no_interior": null,
    "colonia": "Vergel de Guadalupe",
    "localidad": "Ciudad Nezahualcoyotl",
    "referencia": null,
    "municipio": "Nezahualcoyotl",
    "estado": "Mexico",
    "pais": "MEX",
    "codigo_postal": "57150",
    "vendedor_id": null,
    "vendedor_nombre": null,
    "centro_utilidad_id": null,
    "centro_costo_id": null,
    "regimen_fiscal_id": "601",
    "cancelacion_estatus": null,
    "estatus_sat": null,
    "info_seguros": [],
    "compl_serv_parc_construc": [],
    "impuestos_locales": [
        {
            "impuesto": "ISR",
            "importe": "110.00",
            "tasa": "4.00",
            "aplicacion": "R"
        }
    ],
    "conceptos": [
        {
            "sku": "04470030000",
            "clave_prod_ser_sat": "25172504",
            "cantidad": "1.0",
            "no_identificacion": "04470030000",
            "descripcion": "10 R15 EUZKADY ALL TERRAIN",
            "cuenta_predial_numero": null,
            "lista_precios_id": null,
            "precio_lista": "2750.00",
            "precio_unitario": "2750.00",
            "descuento": ".00",
            "deducible_integrado": ".00",
            "factor_descuento": ".0",
            "tipo_descuento": "F",
            "importe": "2750.00",
            "importe_precio_lista": "2750.00",
            "observaciones": null,
            "unidad_id": "PZ",
            "usa_lotes": "N",
            "usa_series": "N",
            "es_paquete": "N",
            "almacenable": "S",
            "item": "1",
            "objeto_impuesto_sat": "02",
            "impuestos_traslados": [
                {
                    "impuesto": "IVA",
                    "aplicacion": "T",
                    "tasa": "16.0",
                    "importe": "440.00"
                }
            ],
            "impuestos_retenciones": [],
            "info_aduanera": []
        }
    ],
    "pedidos": {
        "totalCount": 0,
        "records": []
    },
    "salidas": {
        "totalCount": 0,
        "records": []
    },
    "reportes_consigna": {
        "totalCount": 0,
        "records": []
    },
    "documentos": [],
    "comercio_exterior": {
        "mercancias": []
    }
}
```


#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta_conceptos:LoadLovFieldSku
Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "start=0&limit=500&lista_precios_id=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta_conceptos%3ALoadLovFieldSku&pageSize=500",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "totalCount": 2,
    "records": [
        {
            "sku": "04470030000",
            "descripcion": "10 R15 EUZKADY ALL TERRAIN",
            "clave_prod_ser_sat": "25172504",
            "marca": "EUZKADY",
            "modelo": "ALL TERRAIN",
            "submodelo": null,
            "unidad_id": "PZ",
            "fraccion_arancelaria": null,
            "clave_unidad_sat": "H87",
            "unidad_aduana": null,
            "precio": "2750.0000",
            "lista_precios_id": null,
            "esquema_impuestos_id": "GENERAL",
            "usa_series": "N",
            "usa_lotes": "N",
            "almacenable": "S",
            "precios": [
                [
                    "LISTA4",
                    "2750.0000",
                    "MXN",
                    "1.000000"
                ],
                [
                    "LISTA2",
                    "1250.0000",
                    "MXN",
                    "1.000000"
                ],
                [
                    "LISTA1",
                    "1000.0000",
                    "MXN",
                    "1.000000"
                ],
                [
                    "USD",
                    "55.0000",
                    "USD",
                    "17.253200"
                ]
            ],
            "moneda_id": "MXN",
            "tipo_cambio": "1.000000",
            "impuestos_traslados": [
                {
                    "esquema_impuestos_id": "GENERAL",
                    "impuesto": "IVA",
                    "aplicacion": "T",
                    "tasa": "16.0000",
                    "tipo_factor": "",
                    "num_impuesto": "1",
                    "importe": "0"
                }
            ]
        },
        {
            "sku": "080294",
            "descripcion": "ROLLO ETIQUETA THERMOFIT THERMOMARK 9MM",
            "clave_prod_ser_sat": "01010101",
            "marca": null,
            "modelo": null,
            "submodelo": null,
            "unidad_id": "Uno",
            "fraccion_arancelaria": null,
            "clave_unidad_sat": "C62",
            "unidad_aduana": null,
            "precio": "5.8200",
            "lista_precios_id": null,
            "esquema_impuestos_id": "GENERAL",
            "usa_series": "N",
            "usa_lotes": "N",
            "almacenable": "S",
            "precios": [
                [
                    "USD",
                    "5.8200",
                    "USD",
                    "17.253200"
                ]
            ],
            "moneda_id": "USD",
            "tipo_cambio": "17.253200",
            "impuestos_traslados": [
                {
                    "esquema_impuestos_id": "GENERAL",
                    "impuesto": "IVA",
                    "aplicacion": "T",
                    "tasa": "16.0000",
                    "tipo_factor": "",
                    "num_impuesto": "1",
                    "importe": "0"
                }
            ]
        }
    ]
}
```



#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta_conceptos:ValidateSku
Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta_conceptos%3AValidateSku&sku=04470030000&lista_precios_id=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "sku": "04470030000",
    "descripcion": "10 R15 EUZKADY ALL TERRAIN",
    "clave_prod_ser_sat": "25172504",
    "fraccion_arancelaria": null,
    "marca": "EUZKADY",
    "modelo": "ALL TERRAIN",
    "submodelo": null,
    "unidad_id": "PZ",
    "clave_unidad_sat": "H87",
    "unidad_aduana": null,
    "estatus": "A",
    "precio": "2750.0000",
    "lista_precios_id": "LISTA4",
    "esquema_impuestos_id": "GENERAL",
    "usa_series": "N",
    "usa_lotes": "N",
    "almacenable": "S",
    "precios": [
        [
            "LISTA4",
            "2750.0000",
            "MXN",
            "1.000000"
        ],
        [
            "LISTA2",
            "1250.0000",
            "MXN",
            "1.000000"
        ],
        [
            "LISTA1",
            "1000.0000",
            "MXN",
            "1.000000"
        ],
        [
            "USD",
            "55.0000",
            "USD",
            "17.253200"
        ]
    ],
    "moneda_id": "MXN",
    "tipo_cambio": "1.000000",
    "impuestos_traslados": [
        {
            "esquema_impuestos_id": "GENERAL",
            "impuesto": "IVA",
            "aplicacion": "T",
            "tasa": "16.0000",
            "tipo_factor": "",
            "num_impuesto": "1",
            "importe": "0"
        }
    ],
    "impuestos_retenciones": []
}
```


#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:AddPrefactura
Crea un registro de factura sin timbrar
Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "serie=&folio=&estatus_sat=&empresa_id=&notas_impresion=&observaciones=&estatus=&fecha=&cliente_id=6&receptor_nombre=JOSE+MIGUEL+RAMIREZ+VALENCIA&receptor_rfc=RAVM810219IW0&lista_precios_id=&calle=Monterrey&no_exterior=22&no_interior=&colonia=Vergel+de+Guadalupe&municipio=Nezahualcoyotl&codigo_postal=57150&localidad=Ciudad+Nezahualcoyotl&estado=Mexico&pais=MEX&vendedor_id=&vendedor_nombre=&centro_costo_id=&centro_utilidad_id=&condiciones_de_pago=&confirmacion_sat=&receptor_regimen_fiscal_id=612&uso_id=G03&uso_descr=Gastos+en+general&metodo_pago=PPD&metodo_pago_descr=Pago+en+parcialidades+o+diferido&moneda_id=MXN&tipo_cambio=1&decimales_sat=2&forma_pago=99&forma_pago_descr=Por+definir&fecha_vencimiento=14%2F05%2F2026&a_credito=N&NumRegIdTrib=&orden_compra_cliente=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3AAddPrefactura&conceptos%5B0%5D%5Bsku%5D=04470030000&conceptos%5B0%5D%5Bclave_prod_ser_sat%5D=25172504&conceptos%5B0%5D%5Bcantidad%5D=1&conceptos%5B0%5D%5Bno_identificacion%5D=&conceptos%5B0%5D%5Bcuenta_predial_numero%5D=&conceptos%5B0%5D%5Bprecio_unitario%5D=2750&conceptos%5B0%5D%5Bprecio_lista%5D=2750.0000&conceptos%5B0%5D%5Bdescuento%5D=0&conceptos%5B0%5D%5Btipo_descuento%5D=F&conceptos%5B0%5D%5Bfactor_descuento%5D=0&conceptos%5B0%5D%5Bimporte_precio_lista%5D=2750&conceptos%5B0%5D%5Bimporte%5D=2750&conceptos%5B0%5D%5Bimporte_ieps%5D=0&conceptos%5B0%5D%5Bobservaciones%5D=&conceptos%5B0%5D%5Bunidad_id%5D=PZ&conceptos%5B0%5D%5Busa_lotes%5D=N&conceptos%5B0%5D%5Busa_series%5D=N&conceptos%5B0%5D%5Bes_paquete%5D=N&conceptos%5B0%5D%5Balmacenable%5D=S&conceptos%5B0%5D%5Bcosto%5D=0&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Besquema_impuestos_id%5D=GENERAL&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimpuesto%5D=IVA&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Baplicacion%5D=T&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btasa%5D=16.0000&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btipo_factor%5D=&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bnum_impuesto%5D=1&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimporte%5D=440&conceptos%5B0%5D%5Bpedido_serie%5D=&conceptos%5B0%5D%5Bpedido_folio%5D=&conceptos%5B0%5D%5Bpedido_item%5D=&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=LISTA4&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=2750.0000&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=LISTA2&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1250.0000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=LISTA1&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1000.0000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=55.0000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=17.253200&conceptos%5B0%5D%5Blista_precios_id%5D=LISTA4&conceptos%5B0%5D%5Bes_consigna%5D=&conceptos%5B0%5D%5Bobjeto_impuesto_sat%5D=02&conceptos%5B0%5D%5Bdeducible_integrado%5D=0&conceptos%5B0%5D%5Bfraccion_arancelaria%5D=&conceptos%5B0%5D%5Bmarca%5D=EUZKADY&conceptos%5B0%5D%5Bmodelo%5D=ALL+TERRAIN&conceptos%5B0%5D%5Bsubmodelo%5D=&conceptos%5B0%5D%5Bdescripcion%5D=10+R15+EUZKADY+ALL+TERRAIN&conceptos%5B0%5D%5Bunidad_aduana%5D=&conceptos%5B0%5D%5Bmoneda_id%5D=MXN&conceptos%5B0%5D%5Btipo_cambio%5D=1.000000&compl_serv_par_construc%5Bnum_per_lico_aut%5D=&compl_serv_par_construc%5Bcalle%5D=&compl_serv_par_construc%5Bno_exterior%5D=&compl_serv_par_construc%5Bno_interior%5D=&compl_serv_par_construc%5Bcolonia%5D=&compl_serv_par_construc%5Blocalidad%5D=&compl_serv_par_construc%5Breferencia%5D=&compl_serv_par_construc%5Bmunicipio%5D=&compl_serv_par_construc%5Bestado%5D=&compl_serv_par_construc%5Bcodigo_postal%5D=&compl_serv_par_construc%5Bleyenda_impresa%5D=&info_seguros%5Baseguradora_id%5D=ABA&info_seguros%5Baseguradora_nombre%5D=&info_seguros%5Borden_servicio%5D=&info_seguros%5Basegurado_nombre%5D=&info_seguros%5Bpoliza%5D=&info_seguros%5Bvehiculo_serie%5D=&info_seguros%5Bno_siniestro%5D=&info_seguros%5Bvehiculo_modelo%5D=&info_seguros%5Bvehiculo_tarjeta_circulacion%5D=&info_seguros%5Basegurado_id_oficial%5D=&info_seguros%5Bvehiculo_tipo%5D=&info_seguros%5Bautorizo_nombre%5D=&info_seguros%5Binciso%5D=&info_seguros%5Bnum_reporte%5D=&info_seguros%5Bnum_folio%5D=&info_seguros%5Bnum_cotizacion%5D=&info_seguros%5Bvehiculo_marca%5D=&info_seguros%5Bvehiculo_submarca%5D=&info_seguros%5Bvehiculo_color%5D=&info_seguros%5Bvehiculo_placa%5D=&info_seguros%5Btipo_servicio%5D=&info_seguros%5Bdeducible_porcentaje%5D=0&info_seguros%5Bdeducible_importe%5D=0&info_seguros%5Bintegra_deducible%5D=N&info_seguros%5Bdescuento_aseguradora_porcent%5D=&info_seguros%5Bdescuento_aseguradora_importe%5D=&info_seguros%5Bfecha_instalacion%5D=&info_seguros%5Bfecha_digitaliza_expediente%5D=&comercio_exterior%5Btipo_operacion%5D=2&comercio_exterior%5Bclave_de_pedimento%5D=A1&comercio_exterior%5Bnum_certificado_origen%5D=&comercio_exterior%5Bincoterm%5D=&comercio_exterior%5Bcertificado_origen%5D=&comercio_exterior%5Bnumero_exportador_confiable%5D=&comercio_exterior%5Bsubdivision%5D=0&comercio_exterior%5Btipo_cambio_usd%5D=&comercio_exterior%5Btotal_usd%5D=&comercio_exterior%5Bobservaciones%5D=&detallista%5Bdocument_status%5D=&detallista%5BrequestForPaymentIdentification%5D=&detallista%5Bbuyer%5D%5Bgln%5D=&detallista%5Bbuyer%5D%5BpersonOrDepartmentName%5D=&detallista%5Bseller%5D%5Bgln%5D=&detallista%5Bseller%5D%5Btype%5D=&detallista%5Bseller%5D%5Bseller_alt_party_identification%5D=&detallista%5Bdelivery_note_reference_date%5D=&detallista%5Border_identification_reference_date%5D=&detallista%5Bspecial_instruction_code%5D=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1525",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": null,
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 15:59:53",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "2750.000000",
        "descuento": "0.000000",
        "sub_total": "2750.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "440.000000",
        "sub_total_imp_locales": "3190.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "3190.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "P",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 15:59",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": null,
        "cancelacion_motivo": null,
        "cancelacion_motivo_descr": null,
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "1.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": "LISTA4",
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "2750.00",
                "importe_precio_lista": "2750.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "440.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:UpdatePrefactura

Actualiza un registro de pre factura. Se puede actualizar múltiples veces hasta que se timbre. Una vez timbrada, solamente se puede cancelar.

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "serie=F&folio=1529&estatus_sat=+PREFACTURA+&empresa_id=DEMO&notas_impresion=&observaciones=&estatus=P&fecha=14%2F04%2F2026+16%3A34%3A14&cliente_id=6&receptor_nombre=JOSE+MIGUEL+RAMIREZ+VALENCIA&receptor_rfc=RAVM810219IW0&lista_precios_id=&calle=Monterrey&no_exterior=22&no_interior=&colonia=Vergel+de+Guadalupe&municipio=Nezahualcoyotl&codigo_postal=57150&localidad=Ciudad+Nezahualcoyotl&estado=Mexico&pais=MEX&vendedor_id=&vendedor_nombre=&centro_costo_id=&centro_utilidad_id=&condiciones_de_pago=&confirmacion_sat=&receptor_regimen_fiscal_id=612&uso_id=G03&uso_descr=Gastos+en+general&metodo_pago=PPD&metodo_pago_descr=Pago+en+parcialidades+o+diferido&moneda_id=MXN&tipo_cambio=1&decimales_sat=2&forma_pago=99&forma_pago_descr=Por+definir&fecha_vencimiento=14%2F05%2F2026&a_credito=N&NumRegIdTrib=&orden_compra_cliente=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3AUpdatePrefactura&conceptos%5B0%5D%5Bsku%5D=04470030000&conceptos%5B0%5D%5Bclave_prod_ser_sat%5D=25172504&conceptos%5B0%5D%5Bcantidad%5D=3.0&conceptos%5B0%5D%5Bdescripcion%5D=10+R15+EUZKADY+ALL+TERRAIN&conceptos%5B0%5D%5Bno_identificacion%5D=04470030000&conceptos%5B0%5D%5Bcuenta_predial_numero%5D=&conceptos%5B0%5D%5Bprecio_unitario%5D=2750&conceptos%5B0%5D%5Blista_precios_id%5D=&conceptos%5B0%5D%5Bprecio_lista%5D=2750.00&conceptos%5B0%5D%5Bdescuento%5D=0&conceptos%5B0%5D%5Bdeducible_integrado%5D=0&conceptos%5B0%5D%5Btipo_descuento%5D=F&conceptos%5B0%5D%5Bfactor_descuento%5D=.0&conceptos%5B0%5D%5Bimporte_precio_lista%5D=8250&conceptos%5B0%5D%5Bimporte%5D=8250&conceptos%5B0%5D%5Bobservaciones%5D=&conceptos%5B0%5D%5Bunidad_id%5D=PZ&conceptos%5B0%5D%5Busa_lotes%5D=N&conceptos%5B0%5D%5Busa_series%5D=N&conceptos%5B0%5D%5Bes_paquete%5D=N&conceptos%5B0%5D%5Balmacenable%5D=S&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimpuesto%5D=IVA&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Baplicacion%5D=T&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btasa%5D=16.0&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimporte%5D=1320&conceptos%5B0%5D%5Bmoneda_id%5D=MXN&conceptos%5B0%5D%5Btipo_cambio%5D=1&conceptos%5B0%5D%5Bobjeto_impuesto_sat%5D=02&compl_serv_par_construc%5Bnum_per_lico_aut%5D=&compl_serv_par_construc%5Bcalle%5D=&compl_serv_par_construc%5Bno_exterior%5D=&compl_serv_par_construc%5Bno_interior%5D=&compl_serv_par_construc%5Bcolonia%5D=&compl_serv_par_construc%5Blocalidad%5D=&compl_serv_par_construc%5Breferencia%5D=&compl_serv_par_construc%5Bmunicipio%5D=&compl_serv_par_construc%5Bestado%5D=&compl_serv_par_construc%5Bcodigo_postal%5D=&compl_serv_par_construc%5Bleyenda_impresa%5D=&info_seguros%5Baseguradora_id%5D=&info_seguros%5Baseguradora_nombre%5D=&info_seguros%5Borden_servicio%5D=&info_seguros%5Basegurado_nombre%5D=&info_seguros%5Bpoliza%5D=&info_seguros%5Bvehiculo_serie%5D=&info_seguros%5Bno_siniestro%5D=&info_seguros%5Bvehiculo_modelo%5D=&info_seguros%5Bvehiculo_tarjeta_circulacion%5D=&info_seguros%5Basegurado_id_oficial%5D=&info_seguros%5Bvehiculo_tipo%5D=&info_seguros%5Bautorizo_nombre%5D=&info_seguros%5Binciso%5D=&info_seguros%5Bnum_reporte%5D=&info_seguros%5Bnum_folio%5D=&info_seguros%5Bnum_cotizacion%5D=&info_seguros%5Bvehiculo_marca%5D=&info_seguros%5Bvehiculo_submarca%5D=&info_seguros%5Bvehiculo_color%5D=&info_seguros%5Bvehiculo_placa%5D=&info_seguros%5Btipo_servicio%5D=&info_seguros%5Bdeducible_porcentaje%5D=0&info_seguros%5Bdeducible_importe%5D=0&info_seguros%5Bintegra_deducible%5D=&info_seguros%5Bdescuento_aseguradora_porcent%5D=&info_seguros%5Bdescuento_aseguradora_importe%5D=&info_seguros%5Bfecha_instalacion%5D=&info_seguros%5Bfecha_digitaliza_expediente%5D=&comercio_exterior%5Btipo_operacion%5D=2&comercio_exterior%5Bclave_de_pedimento%5D=A1&comercio_exterior%5Bnum_certificado_origen%5D=&comercio_exterior%5Bincoterm%5D=&comercio_exterior%5Bcertificado_origen%5D=&comercio_exterior%5Bnumero_exportador_confiable%5D=&comercio_exterior%5Bsubdivision%5D=0&comercio_exterior%5Btipo_cambio_usd%5D=&comercio_exterior%5Btotal_usd%5D=&comercio_exterior%5Bobservaciones%5D=&detallista%5Bdocument_status%5D=&detallista%5BrequestForPaymentIdentification%5D=&detallista%5Bbuyer%5D%5Bgln%5D=&detallista%5Bbuyer%5D%5BpersonOrDepartmentName%5D=&detallista%5Bseller%5D%5Bgln%5D=&detallista%5Bseller%5D%5Btype%5D=&detallista%5Bseller%5D%5Bseller_alt_party_identification%5D=&detallista%5Bdelivery_note_reference_date%5D=&detallista%5Border_identification_reference_date%5D=&detallista%5Bspecial_instruction_code%5D=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "msg": "El registro se actualiz\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1529",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": null,
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 16:34:14",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "8250.000000",
        "descuento": "0.000000",
        "sub_total": "8250.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "1320.000000",
        "sub_total_imp_locales": "9570.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "9570.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "P",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 16:34",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": null,
        "cancelacion_motivo": null,
        "cancelacion_motivo_descr": null,
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "3.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": null,
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "8250.00",
                "importe_precio_lista": "8250.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "1320.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```


#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Stamp

Timbra una pre factura en el SAT

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "serie=F&folio=1525&estatus_sat=+PREFACTURA+&empresa_id=DEMO&notas_impresion=&observaciones=&estatus=&fecha=14%2F04%2F2026+15%3A59%3A53&cliente_id=6&receptor_nombre=JOSE+MIGUEL+RAMIREZ+VALENCIA&receptor_rfc=RAVM810219IW0&lista_precios_id=&calle=Monterrey&no_exterior=22&no_interior=&colonia=Vergel+de+Guadalupe&municipio=Nezahualcoyotl&codigo_postal=57150&localidad=Ciudad+Nezahualcoyotl&estado=Mexico&pais=MEX&vendedor_id=&vendedor_nombre=&centro_costo_id=&centro_utilidad_id=&condiciones_de_pago=&confirmacion_sat=&receptor_regimen_fiscal_id=612&uso_id=G03&uso_descr=Gastos+en+general&metodo_pago=PPD&metodo_pago_descr=Pago+en+parcialidades+o+diferido&moneda_id=MXN&tipo_cambio=1&decimales_sat=2&forma_pago=99&forma_pago_descr=Por+definir&fecha_vencimiento=14%2F05%2F2026&a_credito=N&NumRegIdTrib=&orden_compra_cliente=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3AStamp&conceptos%5B0%5D%5Bsku%5D=04470030000&conceptos%5B0%5D%5Bclave_prod_ser_sat%5D=25172504&conceptos%5B0%5D%5Bcantidad%5D=1&conceptos%5B0%5D%5Bno_identificacion%5D=&conceptos%5B0%5D%5Bcuenta_predial_numero%5D=&conceptos%5B0%5D%5Bprecio_unitario%5D=2750&conceptos%5B0%5D%5Bprecio_lista%5D=2750.0000&conceptos%5B0%5D%5Bdescuento%5D=0&conceptos%5B0%5D%5Btipo_descuento%5D=F&conceptos%5B0%5D%5Bfactor_descuento%5D=0&conceptos%5B0%5D%5Bimporte_precio_lista%5D=2750&conceptos%5B0%5D%5Bimporte%5D=2750&conceptos%5B0%5D%5Bimporte_ieps%5D=0&conceptos%5B0%5D%5Bobservaciones%5D=&conceptos%5B0%5D%5Bunidad_id%5D=PZ&conceptos%5B0%5D%5Busa_lotes%5D=N&conceptos%5B0%5D%5Busa_series%5D=N&conceptos%5B0%5D%5Bes_paquete%5D=N&conceptos%5B0%5D%5Balmacenable%5D=S&conceptos%5B0%5D%5Bcosto%5D=0&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Besquema_impuestos_id%5D=GENERAL&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimpuesto%5D=IVA&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Baplicacion%5D=T&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btasa%5D=16.0000&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btipo_factor%5D=&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bnum_impuesto%5D=1&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimporte%5D=440&conceptos%5B0%5D%5Bpedido_serie%5D=&conceptos%5B0%5D%5Bpedido_folio%5D=&conceptos%5B0%5D%5Bpedido_item%5D=&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=LISTA4&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=2750.0000&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=LISTA2&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1250.0000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=LISTA1&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1000.0000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=55.0000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=17.253200&conceptos%5B0%5D%5Blista_precios_id%5D=LISTA4&conceptos%5B0%5D%5Bes_consigna%5D=&conceptos%5B0%5D%5Bobjeto_impuesto_sat%5D=02&conceptos%5B0%5D%5Bdeducible_integrado%5D=0&conceptos%5B0%5D%5Bfraccion_arancelaria%5D=&conceptos%5B0%5D%5Bmarca%5D=EUZKADY&conceptos%5B0%5D%5Bmodelo%5D=ALL+TERRAIN&conceptos%5B0%5D%5Bsubmodelo%5D=&conceptos%5B0%5D%5Bdescripcion%5D=10+R15+EUZKADY+ALL+TERRAIN&conceptos%5B0%5D%5Bunidad_aduana%5D=&conceptos%5B0%5D%5Bmoneda_id%5D=MXN&conceptos%5B0%5D%5Btipo_cambio%5D=1.000000&compl_serv_par_construc%5Bnum_per_lico_aut%5D=&compl_serv_par_construc%5Bcalle%5D=&compl_serv_par_construc%5Bno_exterior%5D=&compl_serv_par_construc%5Bno_interior%5D=&compl_serv_par_construc%5Bcolonia%5D=&compl_serv_par_construc%5Blocalidad%5D=&compl_serv_par_construc%5Breferencia%5D=&compl_serv_par_construc%5Bmunicipio%5D=&compl_serv_par_construc%5Bestado%5D=&compl_serv_par_construc%5Bcodigo_postal%5D=&compl_serv_par_construc%5Bleyenda_impresa%5D=&info_seguros%5Baseguradora_id%5D=ABA&info_seguros%5Baseguradora_nombre%5D=&info_seguros%5Borden_servicio%5D=&info_seguros%5Basegurado_nombre%5D=&info_seguros%5Bpoliza%5D=&info_seguros%5Bvehiculo_serie%5D=&info_seguros%5Bno_siniestro%5D=&info_seguros%5Bvehiculo_modelo%5D=&info_seguros%5Bvehiculo_tarjeta_circulacion%5D=&info_seguros%5Basegurado_id_oficial%5D=&info_seguros%5Bvehiculo_tipo%5D=&info_seguros%5Bautorizo_nombre%5D=&info_seguros%5Binciso%5D=&info_seguros%5Bnum_reporte%5D=&info_seguros%5Bnum_folio%5D=&info_seguros%5Bnum_cotizacion%5D=&info_seguros%5Bvehiculo_marca%5D=&info_seguros%5Bvehiculo_submarca%5D=&info_seguros%5Bvehiculo_color%5D=&info_seguros%5Bvehiculo_placa%5D=&info_seguros%5Btipo_servicio%5D=&info_seguros%5Bdeducible_porcentaje%5D=0&info_seguros%5Bdeducible_importe%5D=0&info_seguros%5Bintegra_deducible%5D=N&info_seguros%5Bdescuento_aseguradora_porcent%5D=&info_seguros%5Bdescuento_aseguradora_importe%5D=&info_seguros%5Bfecha_instalacion%5D=&info_seguros%5Bfecha_digitaliza_expediente%5D=&comercio_exterior%5Btipo_operacion%5D=2&comercio_exterior%5Bclave_de_pedimento%5D=A1&comercio_exterior%5Bnum_certificado_origen%5D=&comercio_exterior%5Bincoterm%5D=&comercio_exterior%5Bcertificado_origen%5D=&comercio_exterior%5Bnumero_exportador_confiable%5D=&comercio_exterior%5Bsubdivision%5D=0&comercio_exterior%5Btipo_cambio_usd%5D=&comercio_exterior%5Btotal_usd%5D=&comercio_exterior%5Bobservaciones%5D=&detallista%5Bdocument_status%5D=&detallista%5BrequestForPaymentIdentification%5D=&detallista%5Bbuyer%5D%5Bgln%5D=&detallista%5Bbuyer%5D%5BpersonOrDepartmentName%5D=&detallista%5Bseller%5D%5Bgln%5D=&detallista%5Bseller%5D%5Btype%5D=&detallista%5Bseller%5D%5Bseller_alt_party_identification%5D=&detallista%5Bdelivery_note_reference_date%5D=&detallista%5Border_identification_reference_date%5D=&detallista%5Bspecial_instruction_code%5D=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1525",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": null,
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 15:59:53",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "2750.000000",
        "descuento": "0.000000",
        "sub_total": "2750.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "440.000000",
        "sub_total_imp_locales": "3190.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "3190.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "P",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 15:59",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": null,
        "cancelacion_motivo": null,
        "cancelacion_motivo_descr": null,
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "1.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": "LISTA4",
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "2750.00",
                "importe_precio_lista": "2750.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "440.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Add

Crea una factura nueva y la timbra en un solo paso

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "serie=&folio=&estatus_sat=&empresa_id=&notas_impresion=&observaciones=&estatus=&fecha=&cliente_id=6&receptor_nombre=JOSE+MIGUEL+RAMIREZ+VALENCIA&receptor_rfc=RAVM810219IW0&lista_precios_id=&calle=Monterrey&no_exterior=22&no_interior=&colonia=Vergel+de+Guadalupe&municipio=Nezahualcoyotl&codigo_postal=57150&localidad=Ciudad+Nezahualcoyotl&estado=Mexico&pais=MEX&vendedor_id=&vendedor_nombre=&centro_costo_id=&centro_utilidad_id=&condiciones_de_pago=&confirmacion_sat=&receptor_regimen_fiscal_id=612&uso_id=G03&uso_descr=Gastos+en+general&metodo_pago=PPD&metodo_pago_descr=Pago+en+parcialidades+o+diferido&moneda_id=MXN&tipo_cambio=1&decimales_sat=2&forma_pago=99&forma_pago_descr=Por+definir&fecha_vencimiento=14%2F05%2F2026&a_credito=N&NumRegIdTrib=&orden_compra_cliente=&opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3AAdd&conceptos%5B0%5D%5Bsku%5D=04470030000&conceptos%5B0%5D%5Bclave_prod_ser_sat%5D=25172504&conceptos%5B0%5D%5Bcantidad%5D=1&conceptos%5B0%5D%5Bno_identificacion%5D=&conceptos%5B0%5D%5Bcuenta_predial_numero%5D=&conceptos%5B0%5D%5Bprecio_unitario%5D=2750&conceptos%5B0%5D%5Bprecio_lista%5D=2750.0000&conceptos%5B0%5D%5Bdescuento%5D=0&conceptos%5B0%5D%5Btipo_descuento%5D=F&conceptos%5B0%5D%5Bfactor_descuento%5D=0&conceptos%5B0%5D%5Bimporte_precio_lista%5D=2750&conceptos%5B0%5D%5Bimporte%5D=2750&conceptos%5B0%5D%5Bimporte_ieps%5D=0&conceptos%5B0%5D%5Bobservaciones%5D=&conceptos%5B0%5D%5Bunidad_id%5D=PZ&conceptos%5B0%5D%5Busa_lotes%5D=N&conceptos%5B0%5D%5Busa_series%5D=N&conceptos%5B0%5D%5Bes_paquete%5D=N&conceptos%5B0%5D%5Balmacenable%5D=S&conceptos%5B0%5D%5Bcosto%5D=0&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Besquema_impuestos_id%5D=GENERAL&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimpuesto%5D=IVA&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Baplicacion%5D=T&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btasa%5D=16.0000&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Btipo_factor%5D=&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bnum_impuesto%5D=1&conceptos%5B0%5D%5Bimpuestos_traslados%5D%5B0%5D%5Bimporte%5D=440&conceptos%5B0%5D%5Bpedido_serie%5D=&conceptos%5B0%5D%5Bpedido_folio%5D=&conceptos%5B0%5D%5Bpedido_item%5D=&conceptos%5B0%5D%5Bimpuestos_retenciones%5D=&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=LISTA4&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=2750.0000&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B0%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=LISTA2&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1250.0000&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B1%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=LISTA1&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1000.0000&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=MXN&conceptos%5B0%5D%5Bprecios%5D%5B2%5D%5B%5D=1.000000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=55.0000&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=USD&conceptos%5B0%5D%5Bprecios%5D%5B3%5D%5B%5D=17.253200&conceptos%5B0%5D%5Blista_precios_id%5D=&conceptos%5B0%5D%5Bes_consigna%5D=&conceptos%5B0%5D%5Bobjeto_impuesto_sat%5D=02&conceptos%5B0%5D%5Bdeducible_integrado%5D=0&conceptos%5B0%5D%5Bfraccion_arancelaria%5D=&conceptos%5B0%5D%5Bmarca%5D=EUZKADY&conceptos%5B0%5D%5Bmodelo%5D=ALL+TERRAIN&conceptos%5B0%5D%5Bsubmodelo%5D=&conceptos%5B0%5D%5Bdescripcion%5D=10+R15+EUZKADY+ALL+TERRAIN&conceptos%5B0%5D%5Bunidad_aduana%5D=&conceptos%5B0%5D%5Bmoneda_id%5D=MXN&conceptos%5B0%5D%5Btipo_cambio%5D=1&compl_serv_par_construc%5Bnum_per_lico_aut%5D=&compl_serv_par_construc%5Bcalle%5D=&compl_serv_par_construc%5Bno_exterior%5D=&compl_serv_par_construc%5Bno_interior%5D=&compl_serv_par_construc%5Bcolonia%5D=&compl_serv_par_construc%5Blocalidad%5D=&compl_serv_par_construc%5Breferencia%5D=&compl_serv_par_construc%5Bmunicipio%5D=&compl_serv_par_construc%5Bestado%5D=&compl_serv_par_construc%5Bcodigo_postal%5D=&compl_serv_par_construc%5Bleyenda_impresa%5D=&info_seguros%5Baseguradora_id%5D=ABA&info_seguros%5Baseguradora_nombre%5D=&info_seguros%5Borden_servicio%5D=&info_seguros%5Basegurado_nombre%5D=&info_seguros%5Bpoliza%5D=&info_seguros%5Bvehiculo_serie%5D=&info_seguros%5Bno_siniestro%5D=&info_seguros%5Bvehiculo_modelo%5D=&info_seguros%5Bvehiculo_tarjeta_circulacion%5D=&info_seguros%5Basegurado_id_oficial%5D=&info_seguros%5Bvehiculo_tipo%5D=&info_seguros%5Bautorizo_nombre%5D=&info_seguros%5Binciso%5D=&info_seguros%5Bnum_reporte%5D=&info_seguros%5Bnum_folio%5D=&info_seguros%5Bnum_cotizacion%5D=&info_seguros%5Bvehiculo_marca%5D=&info_seguros%5Bvehiculo_submarca%5D=&info_seguros%5Bvehiculo_color%5D=&info_seguros%5Bvehiculo_placa%5D=&info_seguros%5Btipo_servicio%5D=&info_seguros%5Bdeducible_porcentaje%5D=0&info_seguros%5Bdeducible_importe%5D=0&info_seguros%5Bintegra_deducible%5D=N&info_seguros%5Bdescuento_aseguradora_porcent%5D=&info_seguros%5Bdescuento_aseguradora_importe%5D=&info_seguros%5Bfecha_instalacion%5D=&info_seguros%5Bfecha_digitaliza_expediente%5D=&comercio_exterior%5Btipo_operacion%5D=2&comercio_exterior%5Bclave_de_pedimento%5D=A1&comercio_exterior%5Bnum_certificado_origen%5D=&comercio_exterior%5Bincoterm%5D=&comercio_exterior%5Bcertificado_origen%5D=&comercio_exterior%5Bnumero_exportador_confiable%5D=&comercio_exterior%5Bsubdivision%5D=0&comercio_exterior%5Btipo_cambio_usd%5D=&comercio_exterior%5Btotal_usd%5D=&comercio_exterior%5Bobservaciones%5D=&detallista%5Bdocument_status%5D=&detallista%5BrequestForPaymentIdentification%5D=&detallista%5Bbuyer%5D%5Bgln%5D=&detallista%5Bbuyer%5D%5BpersonOrDepartmentName%5D=&detallista%5Bseller%5D%5Bgln%5D=&detallista%5Bseller%5D%5Btype%5D=&detallista%5Bseller%5D%5Bseller_alt_party_identification%5D=&detallista%5Bdelivery_note_reference_date%5D=&detallista%5Border_identification_reference_date%5D=&detallista%5Bspecial_instruction_code%5D=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1526",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": "47fe3735-b13e-440d-9e99-566cb7fe757c",
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 16:06:47",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "2750.000000",
        "descuento": "0.000000",
        "sub_total": "2750.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "440.000000",
        "sub_total_imp_locales": "3190.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "3190.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "R",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 16:06",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": null,
        "cancelacion_motivo": null,
        "cancelacion_motivo_descr": null,
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "1.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": null,
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "2750.00",
                "importe_precio_lista": "2750.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "440.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Cancel

Cancela el registro de pre factura,  la cancela (estatus=C) completamente (no se borra).

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ACancel&serie=F&folio=1527",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1526",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": "47fe3735-b13e-440d-9e99-566cb7fe757c",
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 16:06:47",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "2750.000000",
        "descuento": "0.000000",
        "sub_total": "2750.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "440.000000",
        "sub_total_imp_locales": "3190.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "3190.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "R",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 16:06",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": null,
        "cancelacion_motivo": null,
        "cancelacion_motivo_descr": null,
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "1.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": null,
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "2750.00",
                "importe_precio_lista": "2750.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "440.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:Cancel33

Solicita la cancelacion al SAT y se actualiza el cancelacion_estatus. Requiere un segundo envio de cancelacion (mismo endpoint) y si la solicitud al SAT ya procedió a cancelar, entonces se procesa la cancelación en el backend

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ACancel33&serie=F&folio=1526&motivo=02&folio_sustitucion=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "log": "",
    "record": {
        "empresa_id": "DEMO",
        "version": "4.0",
        "serie": "F",
        "folio": "1526",
        "uso_id": "G03",
        "uso_descr": "Gastos en general",
        "confirmacion_pac": null,
        "uuid": "47fe3735-b13e-440d-9e99-566cb7fe757c",
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "14\/04\/2026 16:06:47",
        "forma_pago": "99",
        "forma_pago_descr": "Por definir",
        "condiciones_de_pago": null,
        "sub_total_conceptos": "2750.000000",
        "descuento": "0.000000",
        "sub_total": "2750.000000",
        "total_impuestos_retenidos": "0.000000",
        "total_impuestos_trasladados": "440.000000",
        "sub_total_imp_locales": "3190.000000",
        "total_imp_local_retenciones": "0.000000",
        "total_imp_local_traslados": "0.000000",
        "total": "3190.000000",
        "motivo_descuento": null,
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "metodo_de_pago": "99",
        "orden_compra_cliente": null,
        "metodo_pago": "PPD",
        "metodo_pago_descr": "Pago en parcialidades o diferido",
        "num_reg_id_trib": null,
        "num_cta_pago": null,
        "emisor_rfc": "EKU9003173C9",
        "emisor_nombre": "ESCUELA KEMPER URGATE SA DE CV",
        "receptor_rfc": "RAVM810219IW0",
        "receptor_nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "fecha_vencimiento": "14\/05\/2026",
        "observaciones": null,
        "notas_impresion": null,
        "estatus": "R",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "14\/04\/2026 16:06",
        "calle": "Monterrey",
        "no_exterior": "22",
        "no_interior": null,
        "colonia": "Vergel de Guadalupe",
        "localidad": "Ciudad Nezahualcoyotl",
        "referencia": null,
        "municipio": "Nezahualcoyotl",
        "estado": "Mexico",
        "pais": "MEX",
        "codigo_postal": "57150",
        "vendedor_id": null,
        "vendedor_nombre": null,
        "centro_utilidad_id": null,
        "centro_costo_id": null,
        "regimen_fiscal_id": "601",
        "estatus_sat": "Vigente",
        "cancelacion_estatus": "En proceso",
        "cancelacion_motivo": "02",
        "cancelacion_motivo_descr": "Comprobante emitido con errores sin relación",
        "cancelacion_cfdi_reemplaza": null,
        "cancelacion_acuse": null,
        "info_seguros": [],
        "compl_serv_parc_construc": [],
        "impuestos_locales": [],
        "conceptos": [
            {
                "sku": "04470030000",
                "clave_prod_ser_sat": "25172504",
                "cantidad": "1.0",
                "no_identificacion": "04470030000",
                "descripcion": "10 R15 EUZKADY ALL TERRAIN",
                "cuenta_predial_numero": null,
                "lista_precios_id": null,
                "precio_lista": "2750.00",
                "precio_unitario": "2750.00",
                "descuento": ".00",
                "deducible_integrado": ".00",
                "factor_descuento": ".0",
                "tipo_descuento": "F",
                "importe": "2750.00",
                "importe_precio_lista": "2750.00",
                "observaciones": null,
                "unidad_id": "PZ",
                "usa_lotes": "N",
                "usa_series": "N",
                "es_paquete": "N",
                "almacenable": "S",
                "item": "1",
                "objeto_impuesto_sat": "02",
                "impuestos_traslados": [
                    {
                        "impuesto": "IVA",
                        "aplicacion": "T",
                        "tasa": "16.0",
                        "importe": "440.00"
                    }
                ],
                "impuestos_retenciones": [],
                "info_aduanera": []
            }
        ],
        "pedidos": {
            "totalCount": 0,
            "records": []
        },
        "salidas": {
            "totalCount": 0,
            "records": []
        },
        "reportes_consigna": {
            "totalCount": 0,
            "records": []
        },
        "documentos": [],
        "comercio_exterior": {
            "mercancias": []
        }
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:LoadEstatusSAT

Devuelve el registro completo de la factura agregando el atributo sat_estatus con la informacion actualizada del SAT. Como este end point consulta al SAT es tardado y debe llamarse de manera asyncrona cuando se visualiza el detalle de una factura.

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ALoadEstatusSAT&serie=A&folio=81",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "empresa_id": "raz",
    "version": "4.0",
    "serie": "A",
    "folio": "81",
    "uso_id": "G03",
    "uso_descr": "Gastos en general",
    "confirmacion_pac": null,
    "uuid": "e8e22cb3-4fef-4f13-83ca-805646a07eb7",
    "sucursal_id": "MATRIZ",
    "cliente_id": "5",
    "fecha": "07\/11\/2025 18:42:57",
    "forma_pago": "03",
    "forma_pago_descr": "Transferencia electr\u00f3nica de fondos",
    "condiciones_de_pago": null,
    "sub_total_conceptos": "10489.510000",
    "descuento": "0.000000",
    "sub_total": "10489.510000",
    "total_impuestos_retenidos": "2167.830000",
    "total_impuestos_trasladados": "1678.320000",
    "sub_total_imp_locales": "10000.000000",
    "total_imp_local_retenciones": "0.000000",
    "total_imp_local_traslados": "0.000000",
    "total": "10000.000000",
    "motivo_descuento": null,
    "tipo_cambio": "1.000000",
    "moneda_id": "MXN",
    "metodo_de_pago": "03",
    "metodo_pago": "PUE",
    "metodo_pago_descr": "Pago en una sola exhibici\u00f3n",
    "num_reg_id_trib": null,
    "num_cta_pago": null,
    "emisor_rfc": "AUZR760201JR1",
    "emisor_nombre": "RUBEN AGUIRRE ZURITA",
    "receptor_rfc": "JAS210723RM4",
    "receptor_nombre": "JMRA ASOCIADOS SC",
    "fecha_vencimiento": "06\/06\/2025",
    "observaciones": null,
    "notas_impresion": null,
    "estatus": "R",
    "actualizacion_usuario_id": "rubenaguir",
    "actualizacion_fecha": "07\/11\/2025 18:42",
    "calle": null,
    "no_exterior": null,
    "no_interior": null,
    "colonia": null,
    "localidad": null,
    "referencia": null,
    "municipio": null,
    "estado": null,
    "pais": "MEX",
    "codigo_postal": "04100",
    "vendedor_id": null,
    "vendedor_nombre": null,
    "centro_utilidad_id": null,
    "centro_costo_id": null,
    "regimen_fiscal_id": "612",
    "cancelacion_estatus": "",
    "estatus_sat": "Vigente",
    "info_seguros": [],
    "compl_serv_parc_construc": [],
    "impuestos_locales": [],
    "conceptos": [
        {
            "sku": "81111504",
            "clave_prod_ser_sat": "81111504",
            "cantidad": "1.0",
            "no_identificacion": "81111504",
            "descripcion": "Servicios de programaci\u00f3n de aplicaciones",
            "cuenta_predial_numero": null,
            "lista_precios_id": null,
            "precio_lista": "10489.51",
            "precio_unitario": "10489.51",
            "descuento": ".00",
            "deducible_integrado": ".00",
            "factor_descuento": ".0",
            "tipo_descuento": "F",
            "importe": "10489.51",
            "importe_precio_lista": "10489.51",
            "observaciones": null,
            "unidad_id": "SERVICIO",
            "usa_lotes": "N",
            "usa_series": "N",
            "es_paquete": "N",
            "almacenable": "N",
            "item": "1",
            "objeto_impuesto_sat": "02",
            "impuestos_traslados": [
                {
                    "impuesto": "IVA",
                    "aplicacion": "T",
                    "tasa": "16.0",
                    "importe": "1678.3216"
                }
            ],
            "impuestos_retenciones": [
                {
                    "impuesto": "IVA",
                    "aplicacion": "R",
                    "tasa": "10.6667",
                    "importe": "1118.884563"
                },
                {
                    "impuesto": "ISR",
                    "aplicacion": "R",
                    "tasa": "10.0",
                    "importe": "1048.951"
                }
            ],
            "info_aduanera": []
        }
    ],
    "pedidos": {
        "totalCount": 0,
        "records": []
    },
    "salidas": {
        "totalCount": 0,
        "records": []
    },
    "reportes_consigna": {
        "totalCount": 0,
        "records": []
    },
    "documentos": [],
    "comercio_exterior": {
        "mercancias": []
    },
    "sat_estatus": {
        "CodigoEstatus": "S - Comprobante obtenido satisfactoriamente.",
        "EsCancelable": "Cancelable con aceptaci\u00f3n",
        "Estado": "Vigente",
        "EstatusCancelacion": "",
        "ValidacionEFOS": "200",
        "statusSat": "Vigente",
        "isCancelable": "Cancelable con aceptaci\u00f3n",
        "statusCancelation": ""
    }
}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:SendMail

Devuelve el registro completo de la factura agregando el atributo sat_estatus con la informacion actualizada del SAT. Como este end point consulta al SAT es tardado y debe llamarse de manera asyncrona cuando se visualiza el detalle de una factura.

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php", {
  "body": "opReq=ventas%3Afacturas_venta_33%3Afacturas_venta%3ASendMail&serie=A&folio=81&nombre=Ruben&correo=ruagir%40gmail.com&asunto=Su+factura%3A+A81%2C+Fecha%3A+7+NOV+2025%2C+Cliente%3A+JMRA+ASOCIADOS+SC%2C+Proveedor%3A+RUBEN+AGUIRRE+ZURITA",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{"msg":"El comprobante se agreg\u00f3 a la bandeja de salida.\n","log":""}
```

#### Endpoint : opReq=ventas:facturas_venta_33:facturas_venta:PrintPdf

Devuelve el PDF en formato Base64 (Se abre en otra ventana del navegador)

Request:
```
fetch("https://sisnetv3-2.dscorp.com.mx/php/interfase_jwt.php?opReq=ventas:facturas_venta_33:facturas_venta:PrintPdf&empresa_id=raz&serie=A&folio=87&printMetodoPago=[object%20Object]", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrer": "https://sisnetv3-2.dscorp.com.mx/index.php?o=084b59a1eeacb9dde96e1c30db2bba9a",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```
data:application/pdf;base64,PCFkb2N0eXBlIGh0bWw+CjxodG1sPgogIDxoZWFkPgog ...
```

## Ejemplos de interaccion con el backend para modulo de login


#### Endpoint : opReq=seguri:acceso:acceso_jwt:ValidateSession

Devuelve el PDF en formato Base64 (Se abre en otra ventana del navegador)

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase_jwt.php?opReq=seguri:acceso:acceso_jwt:ValidateSession&XDEBUG_SESSION_START=XDEBUG_ECLIPSE", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiZGVtbyIsImNvbnRyYXNlbmEiOiIiLCJzdWN1cnNhbCI6IkRFTU98TUFUUklafDQzIiwiaW5zdGFuY2lhIjoiNDMiLCJlbXByZXNhIjoiREVNTyIsInN1YiI6ImRlbW8iLCJzdGFydCI6IjIwMjYtMDQtMTYgMDA6NDg6NTAiLCJlbmQiOiIyMDI2LTA0LTE2IDA0OjQ4OjUwIiwidGltZXN0YW1wIjoxNzc2MzE4NTMwLCJpYXQiOjE3NzYzMTg1MzAsImV4cCI6MTc3NjMzMjkzMCwiZXhwaXJlc0luIjoiNCBob3VyIn0.qja5j7mxJzwu8glsN3FZ0lt7WgzWCggO49KNc9GrcWU",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache"
  },
  "referrer": "http://localhost:3000/",
  "body": "{\"session\":\"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiZGVtbyIsImNvbnRyYXNlbmEiOiIiLCJzdWN1cnNhbCI6IkRFTU98TUFUUklafDQzIiwiaW5zdGFuY2lhIjoiNDMiLCJlbXByZXNhIjoiREVNTyIsInN1YiI6ImRlbW8iLCJzdGFydCI6IjIwMjYtMDQtMTYgMDA6NDg6NTAiLCJlbmQiOiIyMDI2LTA0LTE2IDA0OjQ4OjUwIiwidGltZXN0YW1wIjoxNzc2MzE4NTMwLCJpYXQiOjE3NzYzMTg1MzAsImV4cCI6MTc3NjMzMjkzMCwiZXhwaXJlc0luIjoiNCBob3VyIn0.qja5j7mxJzwu8glsN3FZ0lt7WgzWCggO49KNc9GrcWU\",\"MyApp\":\"SisnetV3\"}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```
{
    "success": true,
    "session": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiZGVtbyIsImNvbnRyYXNlbmEiOiIiLCJzdWN1cnNhbCI6IkRFTU98TUFUUklafDQzIiwiaW5zdGFuY2lhIjoiNDMiLCJlbXByZXNhIjoiREVNTyIsInN1YiI6ImRlbW8iLCJzdGFydCI6IjIwMjYtMDQtMTYgMDA6NDk6MzEiLCJlbmQiOiIyMDI2LTA0LTE2IDA0OjQ5OjMxIiwidGltZXN0YW1wIjoxNzc2MzE4NTcxLCJpYXQiOjE3NzYzMTg1NzEsImV4cCI6MTc3NjMzMjk3MSwiZXhwaXJlc0luIjoiNCBob3VyIn0.8tCwMT_nl9s5sTixp5TY5qKWacX2DNocHUlAqgoPork",
    "usuario": "Demo",
    "empresa": "ESCUELA KEMPER URGATE SA DE CV",
    "sucursal": "ACCEM SERVICIOS EMPRESARIALES SC",
    "serviceToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c3VhcmlvIjoiZGVtbyIsImNvbnRyYXNlbmEiOiIiLCJzdWN1cnNhbCI6IkRFTU98TUFUUklafDQzIiwiaW5zdGFuY2lhIjoiNDMiLCJlbXByZXNhIjoiREVNTyIsInN1YiI6ImRlbW8iLCJzdGFydCI6IjIwMjYtMDQtMTYgMDA6NDk6MzEiLCJlbmQiOiIyMDI2LTA0LTE2IDA0OjQ5OjMxIiwidGltZXN0YW1wIjoxNzc2MzE4NTcxLCJpYXQiOjE3NzYzMTg1NzEsImV4cCI6MTc3NjMzMjk3MSwiZXhwaXJlc0luIjoiNCBob3VyIn0.8tCwMT_nl9s5sTixp5TY5qKWacX2DNocHUlAqgoPork",
    "expiresAt": "2026-04-16 04:49:31",
    "user": {
        "id": "demo",
        "email": "demo@demo.com",
        "name": "Demo",
        "company": "ESCUELA KEMPER URGATE SA DE CV",
        "office": "ACCEM SERVICIOS EMPRESARIALES SC",
        "permissionMatrix": [
            {
                "programa_id": "CRM_CUSTOMERS",
                "descripcion": "CRM Clientes",
                "accion": "create"
            },
            {
                "programa_id": "CRM_CUSTOMERS",
                "descripcion": "CRM Clientes",
                "accion": "export"
            },
            {
                "programa_id": "CRM_CUSTOMERS",
                "descripcion": "CRM Clientes",
                "accion": "import"
            },
            {
                "programa_id": "CRM_CUSTOMERS",
                "descripcion": "CRM Clientes",
                "accion": "read"
            },
            {
                "programa_id": "CRM_CUSTOMERS",
                "descripcion": "CRM Clientes",
                "accion": "segmentation"
            },
            {
                "programa_id": "CRM_DASHBOARD",
                "descripcion": "CRM Dashboard",
                "accion": "read"
            },
            {
                "programa_id": "CRM_KNOWLEDGE_BASE",
                "descripcion": "CRM Knowledge",
                "accion": "manage"
            },
            {
                "programa_id": "CRM_LEADS",
                "descripcion": "CRM Leads",
                "accion": "convert"
            },
            {
                "programa_id": "CRM_LEADS",
                "descripcion": "CRM Leads",
                "accion": "create"
            },
            {
                "programa_id": "CRM_LEADS",
                "descripcion": "CRM Leads",
                "accion": "delete"
            },
            {
                "programa_id": "CRM_LEADS",
                "descripcion": "CRM Leads",
                "accion": "read"
            },
            {
                "programa_id": "CRM_LEADS",
                "descripcion": "CRM Leads",
                "accion": "update"
            },
            {
                "programa_id": "CRM_OPPORTUNITIES",
                "descripcion": "CRM Opportunities",
                "accion": "create"
            },
            {
                "programa_id": "CRM_OPPORTUNITIES",
                "descripcion": "CRM Opportunities",
                "accion": "delete"
            },
            {
                "programa_id": "CRM_OPPORTUNITIES",
                "descripcion": "CRM Opportunities",
                "accion": "read"
            },
            {
                "programa_id": "CRM_OPPORTUNITIES",
                "descripcion": "CRM Opportunities",
                "accion": "share"
            },
            {
                "programa_id": "CRM_OPPORTUNITIES",
                "descripcion": "CRM Opportunities",
                "accion": "update"
            },
            {
                "programa_id": "CRM_QUOTES",
                "descripcion": "CRM Quotes",
                "accion": "create"
            },
            {
                "programa_id": "CRM_QUOTES",
                "descripcion": "CRM Quotes",
                "accion": "delete"
            },
            {
                "programa_id": "CRM_QUOTES",
                "descripcion": "CRM Quotes",
                "accion": "read"
            },
            {
                "programa_id": "CRM_QUOTES",
                "descripcion": "CRM Quotes",
                "accion": "update"
            },
            {
                "programa_id": "CRM_REPORTS",
                "descripcion": "CRM Reports",
                "accion": "create"
            },
            {
                "programa_id": "CRM_REPORTS",
                "descripcion": "CRM Reports",
                "accion": "export"
            },
            {
                "programa_id": "CRM_REPORTS",
                "descripcion": "CRM Reports",
                "accion": "read"
            },
            {
                "programa_id": "CRM_REPORTS",
                "descripcion": "CRM Reports",
                "accion": "view_all"
            },
            {
                "programa_id": "CRM_SALES_FLOWS",
                "descripcion": "CRM Config Flujos",
                "accion": "convert"
            },
            {
                "programa_id": "CRM_SALES_FLOWS",
                "descripcion": "CRM Config Flujos",
                "accion": "create"
            },
            {
                "programa_id": "CRM_SALES_FLOWS",
                "descripcion": "CRM Config Flujos",
                "accion": "delete"
            },
            {
                "programa_id": "CRM_SALES_FLOWS",
                "descripcion": "CRM Config Flujos",
                "accion": "read"
            },
            {
                "programa_id": "CRM_SALES_FLOWS",
                "descripcion": "CRM Config Flujos",
                "accion": "update"
            }
        ],
        "roles": [
            {
                "rol_id": "crm_sales"
            }
        ]
    }
}
```

## Ejemplos de interaccion con el backend para modulo de productos


#### Endpoint : opReq=Lov:Lov:Lov:LoadLovFieldUnidades

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "referrer": "http://localhost/SisnetV3Desarrollo/index.php?o=de2b9efd142fbdbf9d6c427227364bc6",
  "body": "opReq=Lov%3ALov%3ALov%3ALoadLovFieldUnidades&pageSize=500",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```
{
    "totalCount": 2,
    "records": [
        {
            "unidad_id": "ACT",
            "descripcion": "ACTIVIDAD",
            "simbolo": "ACT",
            "magnitud_fisica": "NA"
        },
        {
            "unidad_id": "Kilogramo",
            "descripcion": "El kilogramo es la masa de un cilindro de aleaci\u00f3n de Platino-Iridio depositado en la Oficina Internacional de Pesas y Medidas.",
            "simbolo": "kg",
            "magnitud_fisica": "Masa"
        }
    ]
}
```

#### Endpoint : opReq=Lov:Lov:Lov:LoadLovFieldEsquemaImpuestos

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "opReq=Lov%3ALov%3ALov%3ALoadLovFieldEsquemaImpuestos&pageSize=500",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```
{
    "totalCount": 4,
    "records": [
        {
            "esquema_impuestos_id": "EXENTO",
            "descripcion": "EXENTO"
        },
        {
            "esquema_impuestos_id": "GENERAL",
            "descripcion": "IVA trasladado al 16"
        },
        {
            "esquema_impuestos_id": "IVA_CERO",
            "descripcion": "IVA TASA 0"
        },
        {
            "esquema_impuestos_id": "RESICO",
            "descripcion": "RETENCION 1.25%"
        }
    ]
}
```
