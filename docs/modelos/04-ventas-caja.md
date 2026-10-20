# Modelo propuesto de ventas, promociones y caja

**Estado:** propuesta de diseño; no hay tablas, entidades ni migraciones de Ventas y Caja implementadas por este documento. Se basa en los requisitos de [Ventas y promociones](../requerimientos/modulos/ventas-y-promociones.md) y [Caja y cuadre](../requerimientos/modulos/caja.md). Los nombres y campos definitivos se decidirán al diseñar las migraciones.

## Tablas nuevas propuestas

| Tabla | Datos principales propuestos | Relaciones y finalidad |
| --- | --- | --- |
| `cajas` | `id`, `codigo`, `nombre`, `activo` | Identifica una caja física; tiene muchos turnos. |
| `turnos_caja` | `id`, `caja_id`, usuario que abre y cierra, fecha operativa, horas de apertura y cierre, saldo inicial, efectivo esperado, efectivo contado, diferencia, tipo de cierre (`turno` o `dia`) | Cada venta y movimiento de efectivo pertenece a un turno. Un cierre de día marca el fin de operaciones de esa caja en esa fecha; el siguiente turno del mismo día, si lo hay tras un cierre de turno, comienza con el efectivo contado. |
| `movimientos_caja` | `id`, `turno_id`, tipo (`ingreso` o `egreso`), importe, motivo, usuario, fecha | Registra movimientos de efectivo ajenos a los cobros de venta. No elimina ni reemplaza diferencias de cuadre. |
| `ventas` | `id`, `turno_id`, usuario vendedor, fecha, subtotal, descuento promocional, descuento manual, total final, estado | Encabezado de la venta cobrada. Guarda importes históricos, no recalculados a partir del catálogo actual. La definición de estados ante anulaciones queda pendiente. |
| `detalles_venta` | `id`, `venta_id`, `variante_id`, `unidad_id`, cantidad, factor a unidad base, cantidad base, precio unitario aplicado, importes y descuentos aplicados | Una fila por variante y unidad vendida: 4 cajas y 2 unidades de una variante se representan por separado. Conserva una copia de precios y factores usados al vender. |
| `pagos_venta` | `id`, `venta_id`, medio (`efectivo` o `yape`), importe, fecha | Admite más de un medio en una venta. Solo los pagos en efectivo incrementan el efectivo esperado del turno. Los datos necesarios para identificar o verificar un pago Yape siguen pendientes. |
| `promociones` | `id`, `producto_id`, `unidad_id`, cantidad mínima, tipo de descuento (`porcentaje` o `monto_fijo`), valor, vigencia, estado | Regla por producto y unidad, heredada por sus variantes. En la promoción conversada se suman las cajas de todas las variantes del producto; un monto fijo se aplica por cada caja elegible. |
| `descuentos_venta` | `id`, `venta_id`, `detalle_venta_id` opcional, `promocion_id` opcional, tipo de origen (`promocion` o `manual`), importe aplicado, usuario autorizador si es manual | Registro histórico del descuento por línea o por venta. Permite distinguir descuentos automáticos de manuales y verificar que la suma de los manuales no supere el límite por venta. |
| `configuracion_descuentos` | `id`, monto máximo manual, vigencia o marcas de cambio | Propuesta para administrar el límite monetario por venta. Falta definir si se configura globalmente o según rol u otro alcance, y quién puede cambiarlo. |

Los importes monetarios y cantidades requieren tipos decimales exactos, coherentes con Inventario. El detalle de precisión, redondeo e índices se definirá antes de migrar.

## Relaciones con tablas existentes

- `detalles_venta` referencia `variantes_producto` y `unidades`; la unidad debe estar admitida para el producto de la variante. El precio vigente está en `variantes_producto.precio` y la conversión en `unidades_producto.factor_a_base`, pero la venta guarda los valores efectivamente usados.
- `promociones` referencia `productos` y `unidades`; su aplicabilidad debe validar que la unidad esté asociada al producto. No requiere una fila por variante.
- `turnos_caja`, `ventas`, `movimientos_caja` y los descuentos manuales relacionan sus responsables con `users`; los permisos aprovechan el control de acceso existente, sin crear tablas nuevas de permisos.
- La salida por venta debe reutilizar `movimientos_inventario`, `detalle_movimiento` y `existencias` por variante y almacén. Queda pendiente definir cómo vincular explícitamente la venta con su movimiento de inventario y validar la operación transaccional; no se propone una segunda tabla de existencias.

## Reglas de integridad propuestas

- Impedir más de un turno abierto a la vez en una caja física y nuevas aperturas de esa caja en la misma fecha operativa después de `cerrar día`.
- Impedir cerrar un turno sin efectivo contado y diferencia calculada. Una diferencia no exige que el efectivo contado coincida con el esperado.
- Validar que la suma de `pagos_venta` coincida con el total final y que la suma de descuentos manuales por venta no exceda el límite configurado.
- Confirmar venta, pagos y salida de inventario conjuntamente y rechazar cantidades superiores al stock disponible. Esta última regla sigue **propuesta**, pendiente de validación funcional.
- Mantener historial de precios, factores, descuentos y cuadres aun cuando cambie la configuración futura; no eliminar registros para corregir diferencias.

## Reporte diario

No se propone una tabla adicional para el reporte. Después de `cerrar día`, se calcula a partir de **todos** los turnos de esa caja y fecha operativa, sus ventas, pagos, ingresos, egresos y diferencias. El efectivo contado que pasa de un turno al siguiente no es un nuevo ingreso y no debe sumarse dos veces. La persistencia del reporte solo se reconsideraría si aparece una necesidad de conservar una versión emitida e inmutable.

## Decisiones pendientes antes de crear migraciones

1. Alcance y administración de `configuracion_descuentos`; reglas de promociones simultáneas y redondeo de importes.
2. Fecha operativa y zona horaria; saldo de apertura del primer turno del día y tratamiento del efectivo tras `cerrar día`.
3. Comprobantes, impuestos, vuelto, identificación/confirmación de Yape, anulaciones y devoluciones.
4. Enlace venta–movimiento de inventario, almacén de origen y comportamiento exacto frente a stock insuficiente.
5. Necesidad futura de traslados entre cajas físicas; no se incluye una tabla de traslados en esta propuesta inicial.
