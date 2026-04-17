## Ejemplos de interaccion con el backend para modulo de ingresos

Algunos endpoints se mandan con GET y otros con POST, pero el backend recupera desde la variable global _REQUEST (de php), de modo que es indistinto el metodo para efectos practicos. Utilizar el metodo mas adecuado para cada caso.

En los ejemplos de Request se omiten los headers para evitar consumo excesivo de contexto.

#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:Search

Consulta de Ingreso

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "fecha_inicial=&fecha_final=&fecha_inicial_pago=01%2F01%2F2026&fecha_final_pago=&rfc=&nombre=&serie=&folio=&fact_serie_folio=&descripcion=&no_autorizacion=&referencia=&banco_id=&estatus=&opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ASearch",
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
            "start": "0",
            "empresa_id": "DEMO",
            "sucursal_id": "MATRIZ",
            "fecha": "02\/01\/2026",
            "fecha_hora_registro": "02\/01\/2026 11:48",
            "fecha_pago": "02\/01\/2026",
            "fecha_registro": "02\/01\/2026",
            "serie": "IN",
            "folio": "428",
            "fact_serie_folio": "F1356,F1360,F1361,F1372,F1373",
            "comprobante_fisico": null,
            "cliente_id": "6",
            "rfc": "RAVM810219IW0",
            "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
            "descripcion": "PAGO DE FACTURA DE VENTA F1356, F1360, F1361, F1372, F1373",
            "moneda_id": "MXN",
            "tipo_cambio": "1.000000",
            "importe": "19399.330000",
            "metodo_pago_id": "03",
            "metodo_pago_descr": "Transferencia electr\u00f3nica de fondos",
            "banco_id": "002",
            "banco_descr": "BANAMEX",
            "no_autorizacion": null,
            "referencia": null,
            "estatus": "R",
            "actualizacion_usuario_id": "salvadorhernandez",
            "cancelacion_estatus": null,
            "actualizacion_fecha": "02\/01\/2026 11:48:51",
            "fecha_timbrado": null,
            "uuid": null,
            "timbrado_posterior": "N",
            "num_poliza": "1017"
        },
        {
            "start": "0",
            "empresa_id": "DEMO",
            "sucursal_id": "MATRIZ",
            "fecha": "02\/01\/2026",
            "fecha_hora_registro": "02\/01\/2026 11:50",
            "fecha_pago": "02\/01\/2026",
            "fecha_registro": "02\/01\/2026",
            "serie": "IN",
            "folio": "429",
            "fact_serie_folio": "F1383,F1386,F1387,F1388,F1389,F1394,F1395,F1396,F1406,F1408,F1409,F1412,F1414,F1417",
            "comprobante_fisico": null,
            "cliente_id": "6",
            "rfc": "RAVM810219IW0",
            "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
            "descripcion": "PAGO DE FACTURA DE VENTA F1383, F1386, F1387, F1388, F1389, F1394, F1395, F1396, F1406, F1408, F1409, F1412, F1414, F1417",
            "moneda_id": "MXN",
            "tipo_cambio": "1.000000",
            "importe": "208311.490000",
            "metodo_pago_id": "03",
            "metodo_pago_descr": "Transferencia electr\u00f3nica de fondos",
            "banco_id": "002",
            "banco_descr": "BANAMEX",
            "no_autorizacion": null,
            "referencia": null,
            "estatus": "R",
            "actualizacion_usuario_id": "salvadorhernandez",
            "cancelacion_estatus": null,
            "actualizacion_fecha": "02\/01\/2026 11:50:10",
            "fecha_timbrado": "02\/01\/2026",
            "uuid": "55b8d405-a302-4708-a8a1-074c0d3d1d3c",
            "timbrado_posterior": "N",
            "num_poliza": "1018"
        }
    ]
}
```


#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:Load

Recupera una ingreso a la pantalla

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php?opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ALoad&serie=IN&folio=440", {
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "empresa_id": "DEMO",
    "serie": "IN",
    "folio": "440",
    "sucursal_id": "MATRIZ",
    "cliente_id": "7",
    "fecha": "18\/02\/2026 12:13:50",
    "fecha_pago": "18\/02\/2026 12:11:48",
    "metodo_pago_id": "03",
    "forma_pago": "03",
    "forma_pago_descr": "Transferencia electr\u00f3nica de fondos",
    "metodo_pago_descr": "Transferencia electr\u00f3nica de fondos",
    "sat_cta_ori": "0184220811",
    "sat_banco_ori": "012",
    "sat_cta_dest": "1284373462",
    "sat_banco_dest": "012",
    "sat_banco_dest_descr": "BBVA",
    "importe": "591.500000",
    "tipo_cambio": "17.175300",
    "moneda_id": "USD",
    "rfc": "COO0804246R4",
    "nombre": "LOGIFLEKK SA DE CV",
    "banco_id": "012",
    "banco_descr": "BBVA",
    "uuid": "88ed8ec2-c32c-47b0-81b3-58a4373c5ce0",
    "estatus": "R",
    "actualizacion_usuario_id": "salvadorhernandez",
    "actualizacion_fecha": "18\/02\/2026 12:13",
    "cuentas_cobrar": {
        "totalCount": 3,
        "records": [
            {
                "num_cta_cobrar": "1328",
                "importe": "163.250000",
                "descripcion": "Factura de Venta",
                "fecha": "17\/12\/2025",
                "fecha_creacion": "17\/12\/2025",
                "fecha_vencimiento": "17\/12\/2025",
                "moneda_id": "MXN",
                "tipo_cambio": "1.000000",
                "subtotal": "2417.210000",
                "impuestos_ret": "0.000000",
                "impuestos_tras": "386.750000",
                "total": "2803.960000",
                "total_moneda_base": "2803.960000",
                "saldo": "0.000000",
                "saldo_moneda_base": "0.000000",
                "cliente_id": "7",
                "rfc": "COO0804246R4",
                "nombre": "LOGIFLEKK",
                "documento": "FACTURA_VENTA",
                "documento_serie": "F",
                "documento_folio": "1442",
                "documento_descr": "FACTURA DE VENTA",
                "estatus": "R",
                "tipo_cambio_pago": "17.175300"
            },
            {
                "num_cta_cobrar": "1329",
                "importe": "214.140000",
                "descripcion": "Factura de Venta",
                "fecha": "18\/12\/2025",
                "fecha_creacion": "18\/12\/2025",
                "fecha_vencimiento": "18\/12\/2025",
                "moneda_id": "MXN",
                "tipo_cambio": "1.000000",
                "subtotal": "3170.610000",
                "impuestos_ret": "0.000000",
                "impuestos_tras": "507.300000",
                "total": "3677.910000",
                "total_moneda_base": "3677.910000",
                "saldo": "0.000000",
                "saldo_moneda_base": "0.000000",
                "cliente_id": "7",
                "rfc": "COO0804246R4",
                "nombre": "LOGIFLEKK",
                "documento": "FACTURA_VENTA",
                "documento_serie": "F",
                "documento_folio": "1443",
                "documento_descr": "FACTURA DE VENTA",
                "estatus": "R",
                "tipo_cambio_pago": "17.175300"
            },
            {
                "num_cta_cobrar": "1330",
                "importe": "214.110000",
                "descripcion": "Factura de Venta",
                "fecha": "18\/12\/2025",
                "fecha_creacion": "18\/12\/2025",
                "fecha_vencimiento": "18\/12\/2025",
                "moneda_id": "MXN",
                "tipo_cambio": "1.000000",
                "subtotal": "3170.200000",
                "impuestos_ret": "0.000000",
                "impuestos_tras": "507.230000",
                "total": "3677.430000",
                "total_moneda_base": "3677.430000",
                "saldo": "0.000000",
                "saldo_moneda_base": "0.000000",
                "cliente_id": "7",
                "rfc": "COO0804246R4",
                "nombre": "LOGIFLEKK",
                "documento": "FACTURA_VENTA",
                "documento_serie": "F",
                "documento_folio": "1444",
                "documento_descr": "FACTURA DE VENTA",
                "estatus": "R",
                "tipo_cambio_pago": "17.175300"
            }
        ]
    },
    "sat_estatus": "NA"
}
```


#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:LoadLovFieldClientes

Consulta clientes para selección en la pantalla de ingresos

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ALoadLovFieldClientes&pageSize=500",
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
            "cliente_id": "102",
            "rfc": "XEXX010101000",
            "nombre": "ABEL MORENO BALTAZAR",
            "codigo_postal": "39460",
            "regimen_fiscal_id": "612",
            "banco_id": null,
            "banco_descr": null,
            "sat_cta_ori": null,
            "sat_banco_dest": null,
            "sat_banco_dest_descr": null,
            "sat_cta_dest": null
        },
        {
            "cliente_id": "111",
            "rfc": "ZAZA750214DV8",
            "nombre": "ABEL ZARAZUA ZUIGA",
            "codigo_postal": "31134",
            "regimen_fiscal_id": "612",
            "banco_id": null,
            "banco_descr": null,
            "sat_cta_ori": null,
            "sat_banco_dest": null,
            "sat_banco_dest_descr": null,
            "sat_cta_dest": null
        }
    ]
}
```

#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:ValidateLovFieldClientes

Valida el cliente indicado en la pantalla de ingresos (En el campo de cliente, si escribes el numero de cliente, se dispara esta consulta y recupera los datos del cliente)

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php?opReq=tesoreria:registro_ingresos_33:registro_ingresos:ValidateLovFieldClientes&cliente_id=6", {
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "cliente_id": "6",
    "rfc": "RAVM810219IW0",
    "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
    "codigo_postal": "57150",
    "regimen_fiscal_id": "612",
    "banco_id": "002",
    "banco_descr": "BANAMEX",
    "sat_cta_ori": "123456789",
    "sat_banco_dest": "002",
    "sat_banco_dest_descr": "BANAMEX",
    "sat_cta_dest": "343434343"
}
```

#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:SearchCuentasBancariasCliente

Al seleccionar el cliente en la pantalla de ingreso, carga un listado de cuentas bancarias utilizadas previamente para el cliente

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "cliente_id=6&opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ASearchCuentasBancariasCliente",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{{
    "records": [
        {
            "banco_id": "002",
            "banco_descr": "BANAMEX",
            "sat_cta_ori": "123456789"
        }
    ]
}
```


#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:SearchCuentasCobrar

Al seleccionar el cliente en la pantalla de ingreso, se carga el listado de cuentas por cobrar pendientes de pago.
Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "cliente_id=6&opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ASearchCuentasCobrar",
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
            "num_cta_cobrar": "704",
            "descripcion": "Factura de Venta",
            "fecha": "29\/03\/2023",
            "fecha_creacion": "29\/03\/2023",
            "fecha_vencimiento": "28\/04\/2023",
            "moneda_id": "USD",
            "tipo_cambio": "18.252300",
            "subtotal": "575.000000",
            "impuestos_ret": "0.000000",
            "impuestos_tras": "92.000000",
            "total": "667.000000",
            "total_moneda_base": "12174.280000",
            "saldo": "0.000013",
            "saldo_moneda_base": "0.00",
            "cliente_id": "6",
            "rfc": "RAVM810219IW0",
            "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
            "documento": "FACTURA_VENTA",
            "documento_serie": "F",
            "documento_folio": "800",
            "documento_descr": "FACTURA DE VENTA",
            "estatus": "R",
            "metodo_pago_sat33": "PPD"
        },
        {
            "num_cta_cobrar": "739",
            "descripcion": "Factura de Venta",
            "fecha": "19\/06\/2023",
            "fecha_creacion": "19\/06\/2023",
            "fecha_vencimiento": "19\/07\/2023",
            "moneda_id": "USD",
            "tipo_cambio": "17.653200",
            "subtotal": "95.430000",
            "impuestos_ret": "0.000000",
            "impuestos_tras": "15.270000",
            "total": "110.700000",
            "total_moneda_base": "1954.210000",
            "saldo": "0.001262",
            "saldo_moneda_base": "0.02",
            "cliente_id": "6",
            "rfc": "RAVM810219IW0",
            "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
            "documento": "FACTURA_VENTA",
            "documento_serie": "F",
            "documento_folio": "841",
            "documento_descr": "FACTURA DE VENTA",
            "estatus": "R",
            "metodo_pago_sat33": "PUE"
        }
    ]
}
```



#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:Add
Crea un registro de ingreso. En caso de tener 
Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body":  "serie=
            &folio=
            &observaciones=
            &estatus_sat=
            &fecha_pago=16%2F04%2F2026+17%3A06%3A40
            &cliente_id=6
            &nombre=JOSE+MIGUEL+RAMIREZ+VALENCIA
            &rfc=RAVM810219IW0
            &receptor_regimen_fiscal_id=612
            &codigo_postal=57150
            &descripcion=PAGO+DE+FACTURA+DE+VENTA+F1532
            &moneda_id=MXN
            &tipo_cambio=1
            &forma_pago=03
            &forma_pago_descr=Transferencia+electr%C3%B3nica+de+fondos
            &importe=3190
            &no_autorizacion=
            &referencia=REF+PAGO
            &fecha=
            &banco_id=002
            &banco_descr=BANAMEX
            &sat_cta_ori=123456789
            &sat_banco_dest=002
            &sat_banco_dest_descr=BANAMEX
            &sat_cta_dest=343434343
            &opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3AAdd
            &cuentas_cobrar%5B0%5D%5Bnum_cta_cobrar%5D=704
            &cuentas_cobrar%5B0%5D%5Bimporte%5D=0
            &cuentas_cobrar%5B0%5D%5Bmoneda_id%5D=USD
            &cuentas_cobrar%5B0%5D%5Btipo_cambio%5D=18.2523
            &cuentas_cobrar%5B0%5D%5Bdocumento%5D=FACTURA_VENTA
            &cuentas_cobrar%5B0%5D%5Bdocumento_serie%5D=F
            &cuentas_cobrar%5B0%5D%5Bdocumento_folio%5D=800
            &cuentas_cobrar%5B0%5D%5Btipo_cambio_pago%5D=
            &cuentas_cobrar%5B22%5D%5Bnum_cta_cobrar%5D=1409
            &cuentas_cobrar%5B22%5D%5Bimporte%5D=3190
            &cuentas_cobrar%5B22%5D%5Bmoneda_id%5D=MXN
            &cuentas_cobrar%5B22%5D%5Btipo_cambio%5D=1
            &cuentas_cobrar%5B22%5D%5Bdocumento%5D=FACTURA_VENTA
            &cuentas_cobrar%5B22%5D%5Bdocumento_serie%5D=F
            &cuentas_cobrar%5B22%5D%5Bdocumento_folio%5D=1532
            &cuentas_cobrar%5B22%5D%5Btipo_cambio_pago%5D=",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{
    "msg": "El registro se agreg\u00f3 correctamente.\n",
    "record": {
        "empresa_id": "DEMO",
        "serie": "IN",
        "folio": "443",
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "16\/04\/2026 17:17:09",
        "fecha_pago": "16\/04\/2026 17:06:40",
        "metodo_pago_id": "03",
        "forma_pago": "03",
        "forma_pago_descr": "Transferencia electr\u00f3nica de fondos",
        "metodo_pago_descr": "Transferencia electr\u00f3nica de fondos",
        "sat_cta_ori": "123456789",
        "sat_banco_ori": "002",
        "sat_cta_dest": "343434343",
        "sat_banco_dest": "002",
        "sat_banco_dest_descr": "BANAMEX",
        "importe": "3190.000000",
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "rfc": "RAVM810219IW0",
        "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "banco_id": "002",
        "banco_descr": "BANAMEX",
        "uuid": null,
        "estatus": "R",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "16\/04\/2026 17:17",
        "cuentas_cobrar": {
            "totalCount": 1,
            "records": [
                {
                    "num_cta_cobrar": "1409",
                    "importe": "3190.000000",
                    "descripcion": "Factura de Venta",
                    "fecha": "16\/04\/2026",
                    "fecha_creacion": "16\/04\/2026",
                    "fecha_vencimiento": "16\/05\/2026",
                    "moneda_id": "MXN",
                    "tipo_cambio": "1.000000",
                    "subtotal": "2750.000000",
                    "impuestos_ret": "0.000000",
                    "impuestos_tras": "440.000000",
                    "total": "3190.000000",
                    "total_moneda_base": "3190.000000",
                    "saldo": "0.000000",
                    "saldo_moneda_base": "0.000000",
                    "cliente_id": "6",
                    "rfc": "RAVM810219IW0",
                    "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
                    "documento": "FACTURA_VENTA",
                    "documento_serie": "F",
                    "documento_folio": "1532",
                    "documento_descr": "FACTURA DE VENTA",
                    "estatus": "R",
                    "tipo_cambio_pago": "1.000000"
                }
            ]
        }
    }
}
```

#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:Stamp

Los ingresos para facturas PUE no se timbran por defecto. Por eso existe este endpoint para timbrar posteriormente de manera opcional

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "http://localhost/SisnetV3Desarrollo/index.php?o=0af14be387686ef24a05c507914481e8",
  "body": "opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3AStamp&serie=IN&folio=443",
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
        "serie": "IN",
        "folio": "443",
        "sucursal_id": "MATRIZ",
        "cliente_id": "6",
        "fecha": "16\/04\/2026 17:17:09",
        "fecha_pago": "16\/04\/2026 17:06:40",
        "metodo_pago_id": "03",
        "forma_pago": "03",
        "forma_pago_descr": "Transferencia electr\u00f3nica de fondos",
        "metodo_pago_descr": "Transferencia electr\u00f3nica de fondos",
        "sat_cta_ori": "123456789",
        "sat_banco_ori": "002",
        "sat_cta_dest": "343434343",
        "sat_banco_dest": "002",
        "sat_banco_dest_descr": "BANAMEX",
        "importe": "3190.000000",
        "tipo_cambio": "1.000000",
        "moneda_id": "MXN",
        "rfc": "RAVM810219IW0",
        "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
        "banco_id": "002",
        "banco_descr": "BANAMEX",
        "uuid": "9fbdc7e8-f3a0-40e4-87ad-71ae5d675ee2",
        "estatus": "R",
        "actualizacion_usuario_id": "admin",
        "actualizacion_fecha": "16\/04\/2026 17:17",
        "cuentas_cobrar": {
            "totalCount": 1,
            "records": [
                {
                    "num_cta_cobrar": "1409",
                    "importe": "3190.000000",
                    "descripcion": "Factura de Venta",
                    "fecha": "16\/04\/2026",
                    "fecha_creacion": "16\/04\/2026",
                    "fecha_vencimiento": "16\/05\/2026",
                    "moneda_id": "MXN",
                    "tipo_cambio": "1.000000",
                    "subtotal": "2750.000000",
                    "impuestos_ret": "0.000000",
                    "impuestos_tras": "440.000000",
                    "total": "3190.000000",
                    "total_moneda_base": "3190.000000",
                    "saldo": "0.000000",
                    "saldo_moneda_base": "0.000000",
                    "cliente_id": "6",
                    "rfc": "RAVM810219IW0",
                    "nombre": "JOSE MIGUEL RAMIREZ VALENCIA",
                    "documento": "FACTURA_VENTA",
                    "documento_serie": "F",
                    "documento_folio": "1532",
                    "documento_descr": "FACTURA DE VENTA",
                    "estatus": "R",
                    "tipo_cambio_pago": "1.000000"
                }
            ]
        }
    }
}
```


#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:SendMail

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php", {
  "body": "opReq=tesoreria%3Aregistro_ingresos_33%3Aregistro_ingresos%3ASendMail&serie=IN&folio=443&nombre=Ruben&correo=ruben.aguir%40gmail.com",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
  
Response:
```json
{"msg":"El comprobante se agreg\u00f3 a la bandeja de salida.\n","log":""}
```

#### Endpoint : opReq=tesoreria:registro_ingresos_33:registro_ingresos:PrintPdf

Devuelve el PDF en formato binario

Request:
```
fetch("http://localhost/SisnetV3Desarrollo/php/interfase.php?opReq=tesoreria:registro_ingresos_33:registro_ingresos:PrintPdf&serie=IN&folio=443", {
  "headers": {
    "sec-ch-ua": "\"Google Chrome\";v=\"147\", \"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"147\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "upgrade-insecure-requests": "1"
  },
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "omit"
});
```
  
Response:
```
binaryData
```

