# Entidades de ventas y caja

Este documento describe los campos del modelo conceptual de ventas y caja. Los ejemplos son ilustrativos: no definen tipos de datos, valores permitidos, obligatoriedad ni identificadores definitivos. Los importes se muestran en soles (S/). Los campos que representan otras entidades o colecciones indican relaciones, no necesariamente columnas de base de datos.

Para consultar las relaciones entre entidades, ver [diagrama de relaciones](relaciones-entidades.md). Las reglas y decisiones pendientes se encuentran en [Ventas y promociones](ventas-y-promociones.md) y [Caja y cuadre](caja.md).

## Caja

Representa una caja física en la que se abren turnos.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1` | Identificador de la caja. |
| `codigo` | `CAJA-01` | Código que identifica la caja. |
| `nombre` | `Caja principal` | Nombre descriptivo de la caja. |
| `activo` | `true` | Indica si la caja está activa. |
| `turnos` | `[Turno 101, Turno 102]` | Colección de turnos asociados a la caja. |

## Configuración Descuentos

Conserva la configuración general del límite de descuentos manuales de la tienda.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1` | Identificador de la configuración. |
| `limiteManual` | `50.00` | Importe máximo de descuentos manuales para una venta completa, sumando los descuentos por línea y por total. |
| `actualizadoEn` | `2026-10-28T10:00:00` | Fecha y hora de la última actualización de la configuración. |

## Descuento Venta

Registra un descuento aplicado a una venta, ya sea sobre una línea o sobre el total.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `301` | Identificador del descuento. |
| `venta` | `Venta 501` | Venta a la que pertenece el descuento. |
| `detalle` | `Detalle 601` | Línea afectada, si el descuento se aplica a una línea; puede no estar presente para un descuento sobre el total. |
| `promocion` | `Promoción 201` | Promoción que originó el descuento, cuando corresponde. |
| `usuario` | `Usuario 12` | Usuario asociado a la aplicación del descuento. Su obligatoriedad según el origen está pendiente de definir. |
| `origen` | `manual` | Identifica si el descuento proviene de una promoción o de una aplicación manual. Los valores definitivos están pendientes. |
| `importe` | `10.00` | Importe descontado en esta aplicación. |

## Detalle Devolución Venta

Identifica las cantidades e importes devueltos de una línea original de venta.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `801` | Identificador del detalle de devolución. |
| `devolucion` | `Devolución 701` | Devolución a la que pertenece el detalle. |
| `detalleVenta` | `Detalle 601` | Línea de venta original cuya mercancía se devuelve. |
| `cantidad` | `1` | Cantidad devuelta, expresada en la unidad de la línea original. |
| `cantidadBase` | `12` | Cantidad devuelta expresada en la unidad base de la variante. |
| `importe` | `108.00` | Importe correspondiente a la cantidad devuelta, teniendo en cuenta los descuentos aplicables. |

## Detalle Venta

Representa una línea vendida de una variante en una unidad determinada. La misma variante puede aparecer en distintas líneas si se vende en distintas unidades.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `601` | Identificador de la línea de venta. |
| `venta` | `Venta 501` | Venta a la que pertenece la línea. |
| `ventaId` | `501` | Identificador de la venta asociada; corresponde a la relación `venta`. |
| `variante` | `Variante 31` | Variante del producto vendida. |
| `unidad` | `Caja` | Unidad de venta utilizada en la línea. |
| `cantidad` | `1` | Cantidad vendida en la unidad seleccionada. |
| `factorABase` | `12` | Número de unidades base equivalentes a una unidad de venta al momento de registrar la línea. |
| `cantidadBase` | `12` | Cantidad expresada en unidades base: cantidad multiplicada por el factor. |
| `precioUnitario` | `120.00` | Precio de una unidad de venta antes de descuentos; en el ejemplo, el precio de una caja. |
| `descuentoPromocional` | `12.00` | Importe promocional descontado de la línea. |
| `descuentoManual` | `0.00` | Importe manual descontado de la línea. |
| `descuentos` | `[Descuento 301]` | Descuentos asociados a esta línea. |
| `devoluciones` | `[Detalle devolución 801]` | Detalles de devolución relacionados con esta línea original. |

## Devolución Venta

Registra la devolución de mercancía o la anulación de una venta, incluyendo sus importes y el turno que la procesa.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `701` | Identificador de la devolución. |
| `venta` | `Venta 501` | Venta original a la que corresponde. |
| `ventaId` | `501` | Identificador de la venta original; corresponde a la relación `venta`. |
| `turno` | `Turno 102` | Turno en el que se registra la devolución; puede ser posterior al turno de la venta. |
| `usuario` | `Usuario 12` | Usuario asociado al registro de la devolución. |
| `movimientoInventario` | `Movimiento inventario 901` | Movimiento asociado al regreso de la mercancía al almacén original. Su vinculación exacta está pendiente de diseño. |
| `tipo` | `devolución parcial` | Identifica la clase de operación, por ejemplo, devolución parcial o anulación. Los valores definitivos están pendientes. |
| `motivo` | `Producto defectuoso` | Razón registrada para la devolución o anulación; su obligatoriedad está pendiente de definir. |
| `baseImponible` | `91.53` | Parte del importe devuelto correspondiente a la base imponible, según el desglose aplicado. |
| `igv` | `16.47` | Parte del importe devuelto correspondiente al IGV incluido. |
| `importe` | `108.00` | Importe total de la devolución, considerando descuentos e IGV incluido. |
| `fecha` | `2026-10-29T11:00:00` | Fecha y hora de registro de la devolución. |
| `detalles` | `[Detalle devolución 801]` | Líneas y cantidades de la venta que se devuelven. |
| `reintegros` | `[Reintegro 1001]` | Importes devueltos al cliente y sus medios de pago. |

La extracción y el redondeo del IGV, así como el reparto de descuentos para las devoluciones, están pendientes de validar.

## Movimiento Caja

Registra un ingreso o egreso manual de efectivo dentro de un turno.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `401` | Identificador del movimiento de caja. |
| `turno` | `Turno 101` | Turno en el que se registra el movimiento. |
| `turnoId` | `101` | Identificador del turno; corresponde a la relación `turno`. |
| `usuario` | `Usuario 12` | Usuario responsable del registro. |
| `tipo` | `INGRESO` | Tipo de movimiento: `INGRESO` o `EGRESO`. |
| `importe` | `20.00` | Importe de efectivo ingresado o retirado. |
| `motivo` | `Fondo adicional para cambio` | Razón del movimiento. |
| `fecha` | `2026-10-28T09:00:00` | Fecha y hora del movimiento. |

## Pago Venta

Registra el dinero recibido para cobrar una venta. Puede haber pagos en más de un medio.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1101` | Identificador del pago. |
| `venta` | `Venta 501` | Venta a la que corresponde el pago. |
| `medio` | `efectivo` | Medio utilizado, por ejemplo efectivo o Yape. |
| `importe` | `110.00` | Importe recibido mediante ese medio. |
| `fecha` | `2026-10-28T10:30:00` | Fecha y hora del pago. |

## Promoción

Configura una regla de descuento por cantidad para una unidad de venta de un producto y sus variantes.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `201` | Identificador de la promoción. |
| `producto` | `Producto 21` | Producto al que se aplica la promoción. |
| `productoId` | `21` | Identificador del producto; corresponde a la relación `producto`. |
| `unidad` | `Caja` | Unidad de venta a la que aplica la promoción. |
| `cantidadMinima` | `1` | Cantidad mínima de esa unidad para activar la promoción, sumando las variantes elegibles del producto. |
| `tipoDescuento` | `porcentaje` | Indica si el descuento es porcentual o de monto fijo; los valores definitivos están pendientes. |
| `valor` | `10` | Valor de la promoción según su tipo; en el ejemplo, 10 %. |
| `vigenteDesde` | `2026-10-01` | Inicio de la vigencia de la promoción. |
| `vigenteHasta` | `2026-10-31` | Fin de la vigencia de la promoción. |
| `activo` | `true` | Indica si la promoción está activa. |

## Reintegro

Registra un importe devuelto al cliente como consecuencia de una devolución o anulación.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1001` | Identificador del reintegro. |
| `devolucion` | `Devolución 701` | Devolución que origina el reintegro. |
| `medio` | `efectivo` | Medio por el que se devuelve el dinero, por ejemplo efectivo o Yape. |
| `importe` | `108.00` | Importe entregado por ese medio. |
| `fecha` | `2026-10-29T11:05:00` | Fecha y hora del reintegro. |

## Ticket Venta

Representa la constancia interna de una venta; no es un comprobante con valor tributario.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1201` | Identificador del ticket. |
| `venta` | `Venta 501` | Venta a la que corresponde el ticket. |
| `ventaId` | `501` | Identificador de la venta; corresponde a la relación `venta`. |
| `fecha` | `2026-10-28T10:30:00` | Fecha y hora asociadas al ticket. |

## Turno Caja

Representa un periodo de operación de una caja, desde su apertura hasta su cierre y cuadre.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `101` | Identificador del turno. |
| `caja` | `Caja 1` | Caja física a la que pertenece el turno. |
| `cajaId` | `1` | Identificador de la caja; corresponde a la relación `caja`. |
| `usuarioApertura` | `Usuario 12` | Usuario que abre el turno. |
| `usuarioCierre` | `Usuario 15` | Usuario que cierra el turno; puede no estar presente mientras sigue abierto. |
| `fechaOperativa` | `2026-10-28` | Fecha de operación a la que se asigna el turno. La zona horaria está pendiente de definir. |
| `fechaApertura` | `2026-10-28T08:00:00` | Fecha y hora de apertura. |
| `fechaCierre` | `2026-10-28T18:00:00` | Fecha y hora de cierre; puede estar pendiente mientras el turno está abierto. |
| `saldoInicial` | `50.00` | Efectivo disponible al abrir el turno. |
| `efectivoEsperado` | `160.00` | Efectivo calculado para el cuadre a partir del saldo inicial, cobros y vueltos en efectivo, movimientos y reintegros en efectivo. |
| `efectivoContado` | `155.00` | Efectivo físico contado al cerrar. La diferencia frente al esperado queda registrada; su representación está pendiente de diseño. |
| `tipoCierre` | `cierre de turno` | Indica si el cierre corresponde a turno o a día. Los valores definitivos están pendientes. |
| `ventas` | `[Venta 501, Venta 502]` | Ventas registradas durante el turno. |
| `movimientos` | `[Movimiento caja 401]` | Ingresos y egresos manuales registrados en el turno. |

## Venta

Representa la operación de venta, su cobro, sus importes y las relaciones necesarias para su seguimiento.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `turno` | `Turno 101` | Turno abierto en el que se registra la venta. |
| `turnoId` | `101` | Identificador del turno; corresponde a la relación `turno`. |
| `almacen` | `Almacén 2` | Almacén seleccionado del que sale la mercancía. |
| `almacenId` | `2` | Identificador del almacén; corresponde a la relación `almacen`. |
| `usuario` | `Usuario 12` | Usuario que registra la venta. |
| `movimientoInventario` | `Movimiento inventario 900` | Movimiento asociado a la salida de mercancía. Su vinculación exacta está pendiente de diseño. |
| `fecha` | `2026-10-28T10:30:00` | Fecha y hora de la venta. |
| `estado` | `confirmada` | Estado de la venta, por ejemplo confirmada o anulada. Los valores y transiciones definitivos están pendientes. |
| `subtotal` | `120.00` | Importe de los conceptos antes de descuentos, con IGV incluido según los precios de venta. |
| `descuentoPromocional` | `12.00` | Importe total descontado por promociones. |
| `descuentoManual` | `0.00` | Importe total descontado manualmente, incluyendo descuentos por línea y por venta. |
| `baseImponible` | `91.53` | Base imponible desglosada del total después de descuentos. La fórmula y el redondeo están pendientes de validar. |
| `igv` | `16.47` | IGV incluido en el total, desglosado sin sumarlo nuevamente al precio. |
| `total` | `108.00` | Importe total de la venta después de descuentos, con IGV incluido. |
| `detalles` | `[Detalle 601]` | Líneas de variantes y unidades vendidas. |
| `pagos` | `[Pago 1101]` | Pagos recibidos por la venta. |
| `vueltos` | `[Vuelto 1301]` | Importes entregados como vuelto al cliente, cuando corresponda. |
| `descuentos` | `[Descuento 301]` | Descuentos registrados para la venta y sus líneas. |
| `devoluciones` | `[Devolución 701]` | Devoluciones o anulaciones asociadas a la venta. |
| `ticket` | `Ticket 1201` | Ticket interno asociado a la venta. |

**Pendiente:** el listado original no incluye un campo `id` para Venta; se debe definir su identificador. Las referencias como `Venta 501` son únicamente ejemplos.

## Vuelto Venta

Registra un importe entregado al cliente como vuelto de una venta.

| Campo | Ejemplo | Descripción |
| --- | --- | --- |
| `id` | `1301` | Identificador del vuelto. |
| `venta` | `Venta 501` | Venta que origina el vuelto. |
| `medio` | `efectivo` | Medio utilizado para entregar el vuelto, por ejemplo efectivo o Yape. |
| `importe` | `2.00` | Importe entregado por ese medio. |
| `fecha` | `2026-10-28T10:30:00` | Fecha y hora de entrega del vuelto. |
