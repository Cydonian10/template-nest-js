# Ventas y promociones

## Propósito y alcance

Registrar ventas de variantes en las unidades admitidas por el producto, cobrar en efectivo, Yape o ambos y aplicar descuentos promocionales y manuales. El catálogo ya guarda un precio de venta por variante y factores de conversión a unidad base; las existencias se controlan por variante y almacén. Estos datos se reutilizarían, sin considerar implementada todavía la salida por venta ([modelo de inventario](../../modelos/02-inventario-costos.md)). La venta requiere un turno de [Caja](caja.md) abierto.

## Flujo principal

Un usuario autorizado abre o utiliza un turno de caja, selecciona variantes y cantidades por unidad de venta, revisa precios y promociones, aplica descuentos manuales si tiene permiso y registra un cobro. El resultado esperado es una venta con sus conceptos, descuentos y pagos identificables; el registro de su salida de inventario aún requiere diseño y validación.

## Requisitos

### RF-VENT-001 — Vender variantes en unidades combinadas

- Estado: confirmado.
- Regla: una venta puede incluir la misma variante en distintas unidades admitidas por su producto; por ejemplo, 4 cajas y 2 unidades sueltas. Cada cantidad se convierte a la unidad base según el factor registrado para controlar las existencias del almacén de venta.
- Comprobación: al agregar ambas líneas, la venta distingue la cantidad y unidad de cada una y calcula la cantidad base conjunta; una unidad no asociada al producto se rechaza.
- Dependencias: catálogo y existencias de Inventario; [RF-CAJA-001](caja.md#rf-caja-001--abrir-turno).
- Fuente: solicitante.

### RF-VENT-002 — Precio según la unidad de venta

- Estado: confirmado.
- Regla: el precio de la unidad base es el precio de venta de la variante; el precio de una caja u otra unidad admitida resulta de multiplicarlo por su factor a unidad base. No hay un precio independiente por caja en esta primera especificación.
- Comprobación: si una variante cuesta S/ 10 por unidad y una caja contiene 12 unidades, una caja tiene precio S/ 120 antes de descuentos; cambiar el factor afecta los cálculos futuros, no el importe ya registrado de una venta.
- Dependencias: [RF-VENT-001](#rf-vent-001--vender-variantes-en-unidades-combinadas).
- Fuente: recomendación aceptada por el solicitante.

### RF-VENT-003 — Cobrar una venta

- Estado: confirmado.
- Regla: al registrar la venta se registra su cobro en efectivo, Yape o una combinación de ambos. La suma de los importes pagados debe coincidir con el total final de la venta. El efectivo cobrado pertenece al turno abierto; el pago Yape se informa por separado y no incrementa el efectivo físico.
- Comprobación: se acepta una venta con pago mixto que cubra exactamente el total; se rechaza una venta sin turno abierto o cuyos pagos no cubran el total.
- Dependencias: [RF-CAJA-001](caja.md#rf-caja-001--abrir-turno), [RF-CAJA-003](caja.md#rf-caja-003--registrar-ingresos-y-egresos).
- Fuente: solicitante. El tratamiento de pagos insuficientes o excedentes, vuelto y confirmación de Yape está pendiente de validar.

### RF-PROM-001 — Configurar promociones por producto y unidad

- Estado: confirmado.
- Regla: una promoción por volumen se configura para una unidad de venta del producto (por ejemplo, caja), con una cantidad mínima y un descuento expresado como porcentaje o monto fijo. Se aplica a las variantes de ese producto sin duplicar la configuración en cada variante. El valor, la vigencia, el administrador y las reglas de concurrencia entre promociones quedan pendientes de definir.
- Comprobación: una promoción configurada para cajas de un producto no altera las ventas de unidades sueltas ni las de otro producto; ambas variantes del producto reciben la misma regla.
- Dependencias: [RF-VENT-001](#rf-vent-001--vender-variantes-en-unidades-combinadas).
- Fuente: solicitante.

### RF-PROM-002 — Aplicar descuento por volumen

- Estado: confirmado.
- Regla: para comprobar el mínimo se suman las cajas de todas las variantes del mismo producto en la venta. Al alcanzar 5 cajas en la promoción conversada, el descuento se aplica a todas las cajas elegibles; no se cuentan ni se descuentan las unidades sueltas por esa promoción. Un porcentaje se calcula sobre el precio de cada caja; un monto fijo se descuenta por cada caja elegible, no una sola vez por venta.
- Comprobación: 3 cajas de una variante y 2 de otra variante del mismo producto activan la promoción de 5 cajas; 4 cajas y 2 unidades sueltas no la activan. Una promoción fija de S/ 10 por caja descuenta S/ 50 al vender las 5 cajas elegibles.
- Dependencias: [RF-PROM-001](#rf-prom-001--configurar-promociones-por-producto-y-unidad), [RF-VENT-002](#rf-vent-002--precio-según-la-unidad-de-venta).
- Fuente: solicitante.

### RF-VENT-004 — Aplicar descuentos manuales

- Estado: confirmado.
- Regla: un usuario con el permiso correspondiente de Ventas puede aplicar descuentos manuales a líneas individuales o al total de la venta. Estos pueden acumularse con promociones automáticas: primero se aplica la promoción y después se calcula el descuento manual sobre el importe ya rebajado. La suma de todos los descuentos manuales de la venta no puede superar un monto máximo configurable por venta completa.
- Comprobación: se aceptan descuentos manuales en varias líneas si su suma no supera el límite; se rechaza un intento de superar el límite distribuyendo importes entre líneas o combinando descuento por línea y por total. Un usuario sin el permiso no puede aplicar descuentos manuales.
- Dependencias: [RF-PROM-002](#rf-prom-002--aplicar-descuento-por-volumen); [reglas existentes de autorización](../03-negocio.md#permisos-y-control-de-acceso).
- Fuente: solicitante. Están pendientes el alcance de la configuración del límite, quién puede modificarlo y si el descuento manual se ingresa como monto, porcentaje o ambos.

### RF-VENT-005 — Confirmar venta y salida de inventario

- Estado: propuesto; requiere validar el comportamiento de salida con Inventario.
- Regla propuesta: confirmar el cobro, registrar la venta y descontar las cantidades convertidas del almacén de venta como una sola operación; no confirmar si no hay existencias suficientes, para evitar cobros sin stock o saldos negativos. Conservar en el detalle de venta los importes y descuentos aplicados, sin depender de precios futuros del catálogo.
- Comprobación propuesta: una venta con stock suficiente deja venta, pagos y salida consistentes; si falla la salida o falta stock, no queda una venta cobrada parcialmente. Una consulta posterior conserva los precios y descuentos originales aunque cambie el catálogo.
- Dependencias: [RF-VENT-001](#rf-vent-001--vender-variantes-en-unidades-combinadas), [modelo de inventario](../../modelos/02-inventario-costos.md).
- Fuente: propuesta de diseño para validar con el solicitante.

## Pendientes de validar

- Reglas para promociones simultáneas, importe fijo mayor que el precio de una caja y descuentos combinados que intenten dejar un total negativo.
- Detalles de la configuración del límite manual y alcance de permisos para vender, administrar promociones y autorizar descuentos.
- Redondeo, impuestos, comprobantes, anulación o devolución de ventas, confirmación de Yape, vuelto y tratamiento de pagos excedentes.
- Almacén de origen de cada venta y conducta ante stock insuficiente en escenarios concurrentes.
