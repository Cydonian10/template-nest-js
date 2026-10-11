# Compras, comprobantes y recepción en inventario

El modelo distingue **la compra** (lo que se acordó con el proveedor) de **la recepción** (lo que realmente llegó a un almacén). Todas las entidades están en `src/features/inventory/entities/`, incluidas las compras y sus comprobantes. Todavía no hay endpoints, lógica de recepción, almacenamiento de archivos ni migración para estas tablas.

## Tablas de compras

### `compras`

| Columna            | Tipo                         | Significado                                                                                                                       |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | `uuid`                       | Identificador de la compra.                                                                                                       |
| `proveedor_id`     | `uuid`, obligatorio          | Proveedor de la compra.                                                                                                           |
| `usuario_id`       | `uuid`, obligatorio          | Usuario que la registró.                                                                                                          |
| `fecha`            | `date`, obligatorio          | Fecha del documento del proveedor; puede ser distinta de la recepción.                                                            |
| `numero_documento` | `varchar(100) NULL`          | Número de factura o referencia, si existe.                                                                                        |
| `total_documento`  | `numeric(38,6) NULL`, `>= 0` | Total indicado en el documento; puede incluir impuestos u otros conceptos. No se presupone que sea igual a la suma de las líneas. |
| `observaciones`    | `text NULL`                  | Notas opcionales.                                                                                                                 |
| `fecha_registro`   | `timestamptz`                | Fecha en que se registró la compra en el sistema.                                                                                 |

### `detalles_compra`

| Columna           | Tipo                    | Significado                                                                |
| ----------------- | ----------------------- | -------------------------------------------------------------------------- |
| `id`              | `uuid`                  | Identificador del renglón.                                                 |
| `compra_id`       | `uuid`, obligatorio     | Compra a la que pertenece.                                                 |
| `variante_id`     | `uuid`, obligatorio     | Variante comprada.                                                         |
| `unidad_id`       | `uuid`, obligatorio     | Unidad acordada con el proveedor (p. ej., caja).                           |
| `cantidad`        | `numeric(20,6)`, `> 0`  | Cantidad comprada en la unidad acordada.                                   |
| `factor_a_base`   | `numeric(20,8)`, `> 0`  | Copia de cuántas unidades base contiene esa unidad al registrar la compra. |
| `precio_unitario` | `numeric(20,6)`, `>= 0` | Precio pagado por unidad acordada; no es el precio de venta.               |

Las cantidades y precios `numeric` se representan como cadenas en TypeORM. El factor guardado permite comparar las unidades compradas y recibidas aunque se modifique después la conversión del catálogo. Los conceptos como descuentos, impuestos y gastos adicionales aún no están desglosados en este modelo sencillo; `total_documento` conserva el total de la factura y **no** sustituye al costo aplicado al stock.

### `comprobantes_compra`

| Columna                | Tipo                  | Significado                                                                                                 |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`                   | `uuid`                | Identificador del comprobante.                                                                              |
| `compra_id`            | `uuid`, obligatorio   | Compra a la que pertenece. Puede tener varios comprobantes.                                                 |
| `nombre_original`      | `varchar(255)`        | Nombre visible del PDF o la foto.                                                                           |
| `tipo_mime`            | `varchar(100)`        | Tipo declarado y validado del archivo.                                                                      |
| `tamano_bytes`         | `integer`, `> 0`      | Tamaño del archivo.                                                                                         |
| `clave_almacenamiento` | `varchar(500)`, único | Referencia interna al archivo en almacenamiento privado. **No es una URL pública ni el contenido binario.** |
| `fecha_subida`         | `timestamptz`         | Fecha en que se añadió el comprobante.                                                                      |

Esta tabla **solo prepara el lugar donde registrar el archivo**. Para permitir subir PDF/JPG/PNG harán falta un endpoint autorizado, validación de tipo real y tamaño, almacenamiento privado y descarga controlada. No se debe confiar únicamente en la extensión o en el MIME enviado por el cliente. Los archivos no se guardan como binarios en PostgreSQL.

## Relación con los movimientos

- `movimientos_inventario.compra_id` es opcional: solo los movimientos `ingreso` pueden vincular una compra. Un ingreso manual que no sea compra puede dejarla vacía. Una compra puede tener **varios** ingresos para entregas parciales.
- `detalle_movimiento.detalle_compra_id` es opcional: relaciona lo recibido con el renglón comprado. Una línea puede recibirse en varios movimientos; otros movimientos no tienen que referenciar una compra.
- `detalles_compra.precio_unitario` conserva el precio pactado; `detalle_movimiento.costo_total` conserva el costo realmente aplicado a cada recepción, que podría incluir costos capitalizables. `existencias.valor_costo` es el valor del saldo. El costo aplicado por unidad base se obtiene dividiendo `costo_total` por `abs(cantidad_base)`. Véase [Costos del inventario](02-inventario-costos.md).

**Flujo previsto, todavía no implementado:** registrar compra y detalles → asociar comprobantes → registrar un ingreso con sus detalles vinculados → confirmar la recepción en una transacción → actualizar cantidad y valor de `existencias`. Registrar o adjuntar una compra **no aumenta el stock**. Por ejemplo, comprar 10 cajas y recibir 6 hoy y 4 mañana produce dos ingresos de la misma compra, no dos compras.

La aplicación futura debe comprobar que el proveedor del ingreso coincida con el de la compra; que cada detalle recibido pertenezca a esa compra y corresponda a la misma variante y unidad; que lo recibido acumulado no exceda lo comprado (también tras convertir a unidades base); y que no se confirme dos veces el mismo ingreso. Estas reglas entre tablas no quedan garantizadas solo por las claves foráneas. Una corrección tras confirmar debe registrarse mediante un movimiento compensatorio, sin cambiar silenciosamente el historial.

La lógica para registrar compras, los pagos al proveedor, los descuentos/impuestos desglosados, la subida/descarga real de archivos y la confirmación de movimientos quedan fuera de este cambio de modelo. Antes de usar las entidades en PostgreSQL se debe generar y revisar la migración correspondiente: la migración inicial actual solo contiene control de acceso.
