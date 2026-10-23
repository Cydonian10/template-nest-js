# Modelo propuesto de ventas, promociones y caja

**Estado:** entidades preliminares en `src/features/sales/entities/`; aún no hay migración, tablas ni flujos implementados de Ventas y Caja. Se basan en los requisitos de [Ventas y promociones](../requerimientos/modulos/ventas-y-promociones.md) y [Caja y cuadre](../requerimientos/modulos/caja.md). Antes de generar migraciones hay que revisar las reglas pendientes; los campos actuales no constituyen una política fiscal ni una implementación de cobros.

## Tablas nuevas propuestas

| Tabla | Datos principales propuestos | Relaciones y finalidad |
| --- | --- | --- |
| `cajas` | `id`, `codigo`, `nombre`, `activo` | Identifica una caja física; tiene muchos turnos. |
| `turnos_caja` | `id`, `caja_id`, usuario que abre y cierra, fecha operativa, horas de apertura y cierre, saldo inicial, efectivo esperado, efectivo contado, diferencia, tipo de cierre (`turno` o `dia`) | Cada venta y movimiento de efectivo pertenece a un turno. Un cierre de día marca el fin de operaciones de esa caja en esa fecha; el siguiente turno del mismo día, si lo hay tras un cierre de turno, comienza con el efectivo contado. |
| `movimientos_caja` | `id`, `turno_id`, tipo (`ingreso` o `egreso`), importe, motivo, usuario, fecha | Registra movimientos de efectivo ajenos a los cobros de venta. No elimina ni reemplaza diferencias de cuadre. |
| `ventas` | `id`, `turno_id`, `almacen_id`, usuario vendedor, fecha, subtotal, descuento promocional, descuento manual, base imponible, IGV, total final, estado | Encabezado de la venta cobrada. Referencia el almacén elegido antes de vender. Guarda importes históricos, no recalculados a partir del catálogo actual. El precio ya incluye IGV; el desglose no incrementa el total. Los estados ante anulaciones/devoluciones quedan por definir. |
| `detalles_venta` | `id`, `venta_id`, `variante_id`, `unidad_id`, cantidad, factor a unidad base, cantidad base, precio unitario aplicado, importes y descuentos aplicados | Una fila por variante y unidad vendida: 4 cajas y 2 unidades de una variante se representan por separado. Conserva una copia de precios y factores usados al vender. |
| `pagos_venta` | `id`, `venta_id`, medio (`efectivo` o `yape`), importe, fecha | Admite más de un medio en una venta. Yape se declara manualmente y no se verifica con una integración externa en esta versión. El vuelto puede entregarse en efectivo o Yape; es necesario distinguir cobros de importes entregados antes de cerrar el modelo de pagos. Solo el efectivo recibido menos el vuelto en efectivo aumenta el efectivo esperado. |
| `vueltos_venta` | `id`, `venta_id`, medio, importe, fecha | Guarda por separado el vuelto en efectivo o Yape para calcular el cobro neto y el efectivo físico de la caja. |
| `promociones` | `id`, `producto_id`, `unidad_id`, cantidad mínima, tipo de descuento (`porcentaje` o `monto_fijo`), valor, vigencia, estado | Regla por producto y unidad, heredada por sus variantes. En la promoción conversada se suman las cajas de todas las variantes del producto; un monto fijo se aplica por cada caja elegible. |
| `descuentos_venta` | `id`, `venta_id`, `detalle_venta_id` opcional, `promocion_id` opcional, tipo de origen (`promocion` o `manual`), importe aplicado, usuario autorizador si es manual | Registro histórico del descuento por línea o por venta. Permite distinguir descuentos automáticos de manuales y verificar que la suma de los manuales no supere el límite por venta. |
| `configuracion_descuentos` | `id`, monto máximo manual, vigencia o marcas de cambio | Propuesta para administrar un límite monetario único por venta para toda la tienda, junto con la configuración de descuentos; no depende del rol. Falta definir quién puede cambiarlo. |
| `tickets_venta` | Relación con venta, identificador y fecha | Constancia interna de la venta, distinta de un comprobante tributario y del archivo adjunto de una compra. No se presume emisión electrónica; su eventual numeración visible queda pendiente. |
| `devoluciones_venta` | `id`, `venta_id`, `turno_id`, usuario, tipo (`anulacion` o `devolucion`), motivo, base, IGV, importe, fecha, movimiento de inventario opcional | Operación posterior que no reescribe el cuadre del turno original; el turno asociado identifica el de reintegro. |
| `detalles_devolucion_venta` | `id`, `devolucion_id`, `detalle_venta_id`, cantidad, cantidad base, importe | Vincula cada cantidad devuelta a la línea de venta original; validar en la operación el límite acumulado de devoluciones. |
| `reintegros_venta` | `id`, `devolucion_id`, medio (`efectivo` o `yape`), importe, fecha | Registra el dinero devuelto sin duplicarlo en movimientos manuales de caja. |

Los importes monetarios y cantidades requieren tipos decimales exactos, coherentes con Inventario. El detalle de precisión, redondeo e índices se definirá antes de migrar.

## Relaciones con tablas existentes

- `ventas.almacen_id` referencia `almacenes`: el almacén se elige antes de vender y de allí se descuenta el stock. `detalles_venta` referencia `variantes_producto` y `unidades`; la unidad debe estar admitida para el producto de la variante. El precio vigente está en `variantes_producto.precio` y la conversión en `unidades_producto.factor_a_base`, pero la venta guarda los valores efectivamente usados.
- `promociones` referencia `productos` y `unidades`; su aplicabilidad debe validar que la unidad esté asociada al producto. No requiere una fila por variante.
- `turnos_caja`, `ventas`, `movimientos_caja` y los descuentos manuales relacionan sus responsables con `users`; los permisos aprovechan el control de acceso existente, sin crear tablas nuevas de permisos.
- La salida por venta debe reutilizar `movimientos_inventario`, `detalle_movimiento` y `existencias` por variante y almacén. Queda pendiente definir cómo vincular explícitamente la venta con su movimiento de inventario y validar la operación transaccional; no se propone una segunda tabla de existencias. La venta debe fallar completa si no alcanza el stock del almacén elegido.

## Anulaciones y devoluciones en la primera versión

Ambas capacidades están confirmadas, incluidas las devoluciones parciales y las anulaciones o devoluciones después de cerrar el turno de la venta. Anular revierte la venta entera; las unidades devueltas o anuladas vuelven al almacén original. El reintegro puede hacerse en efectivo o Yape y, si el turno de venta cerró, se registra en otro turno sin cambiar su cuadre. Una devolución parcial reintegra el importe efectivamente pagado por esas unidades, con sus descuentos e IGV incluidos. **Todavía no se definen las tablas ni los estados adicionales** necesarios para representarlas. Antes de crear sus entidades hay que decidir cómo vincularlas a la venta y a sus detalles originales, cómo impedir devolver más unidades de las vendidas entre varias operaciones, cómo distribuir los descuentos generales y redondear el reintegro, y cómo se registran responsable, motivo y fecha sin alterar el historial. El vuelto puede ser en efectivo o Yape; aún falta decidir cómo representarlo junto con los pagos y el cuadre.

## Impuestos y comprobantes en la primera versión

El precio vigente **ya incluye IGV al 18 %**, y en la primera versión se emite únicamente un **ticket interno de venta** que separa descuentos e IGV; no tiene validez tributaria y no sustituye una boleta o factura. No se suma de nuevo el impuesto al precio. Se propone extraerlo del total final después de descuentos: `base = total / 1,18` e `igv = total - base`; por ejemplo, S/ 118 contienen S/ 100 de base y S/ 18 de IGV. Dividir S/ 118 entre 0,18 daría un resultado incorrecto. La venta debe conservar los importes necesarios para explicar su cálculo y el ticket emitido, aun si cambia el catálogo o se devuelve después. Siguen pendientes redondeo y asignación por detalle, numeración, datos del comprador y casos exonerados. No se presume emisión electrónica ni se confunde con el adjunto de `comprobantes_compra`.

## Reglas de integridad propuestas

- Impedir más de un turno abierto a la vez en una caja física y nuevas aperturas de esa caja en la misma fecha operativa después de `cerrar día`.
- Impedir cerrar un turno sin efectivo contado y diferencia calculada. Una diferencia no exige que el efectivo contado coincida con el esperado.
- Validar que el cobro neto cubra el total final y que la suma de descuentos manuales por venta no exceda el límite configurado. La fórmula exacta entre pagos entregados, vuelto y cobro neto queda pendiente de la decisión sobre el vuelto.
- Rechazar completa la venta ante stock insuficiente, también si otra venta consumió el saldo antes de confirmarla. Confirmar conjuntamente venta, pagos y salida de inventario es la solución técnica propuesta para cumplir esa regla.
- Mantener historial de precios, factores, descuentos y cuadres aun cuando cambie la configuración futura; no eliminar registros para corregir diferencias.

## Reporte diario

No se propone una tabla adicional para el reporte. Después de `cerrar día`, se calcula a partir de **todos** los turnos de esa caja y fecha operativa, sus ventas, pagos, reintegros, ingresos, egresos y diferencias. El efectivo contado que pasa de un turno al siguiente no es un nuevo ingreso y no debe sumarse dos veces. Los reintegros tras el cierre original no recalculan ese cuadre; sigue pendiente cómo presentarlos en reportes del día de venta y del día de reintegro. La persistencia del reporte solo se reconsideraría si aparece una necesidad de conservar una versión emitida e inmutable.

## Decisiones pendientes antes de crear migraciones

1. Quién administra `configuracion_descuentos` (límite único para toda la tienda); reglas de promociones simultáneas y redondeo de importes.
2. Fecha operativa y zona horaria; saldo de apertura del primer turno del día y tratamiento del efectivo tras `cerrar día`.
3. Confirmar la fórmula propuesta del IGV incluido al 18 %; precisar redondeo y reparto del IGV y de descuentos para devoluciones, y formato del ticket interno de venta. Los vueltos y reintegros en efectivo o Yape tienen entidades, pero no lógica de cobro ni confirmación externa de Yape.
4. Enlace venta–movimiento de inventario, conservación del historial y operación completa frente a stock insuficiente o ventas simultáneas. El almacén se elige antes de vender.
5. Necesidad futura de traslados entre cajas físicas; no se incluye una tabla de traslados en esta propuesta inicial.
