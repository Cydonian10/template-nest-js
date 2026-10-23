# Ventas y promociones

## Propósito y alcance

Registrar ventas de variantes en las unidades admitidas por el producto, cobrar en efectivo, Yape o ambos y aplicar descuentos promocionales y manuales. El catálogo ya guarda un precio de venta por variante y factores de conversión a unidad base; las existencias se controlan por variante y almacén. Estos datos se reutilizarían, sin considerar implementada todavía la salida por venta ([modelo de inventario](../../modelos/02-inventario-costos.md)). La venta requiere un turno de [Caja](caja.md) abierto. Anulaciones, devoluciones parciales, desglose de IGV incluido y ticket de venta forman parte de la primera versión; sus excepciones aún deben detallarse.

## Flujo principal

Un usuario autorizado abre o utiliza un turno de caja, selecciona el almacén antes de vender, elige variantes y cantidades por unidad de venta, revisa precios y promociones, aplica descuentos manuales si tiene permiso y registra un cobro. El resultado esperado es una venta con sus conceptos, descuentos y pagos identificables y una salida de inventario del almacén elegido. Su implementación aún requiere diseño.

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
- Regla: al registrar la venta se registra su cobro en efectivo, Yape o una combinación de ambos. Por ahora el usuario declara el importe pagado por Yape; el sistema no verifica ese pago con un proveedor externo. La integración con una billetera virtual se pospone. El vuelto puede entregarse en efectivo o Yape; solo el efectivo efectivamente recibido menos el vuelto entregado en efectivo aumenta el efectivo físico del turno. Los importes recibidos y entregados deben permitir comprobar que el cobro neto cubre exactamente el total de la venta; falta definir su representación en pagos y vueltos.
- Comprobación: se acepta una venta con pago mixto declarado y vuelto en cualquiera de los dos medios si el cobro neto coincide con el total; se rechaza una venta sin turno abierto o con cobro neto insuficiente. El cuadre distingue el vuelto en efectivo del declarado por Yape y no presenta el pago Yape como verificado automáticamente.
- Dependencias: [RF-CAJA-001](caja.md#rf-caja-001--abrir-turno), [RF-CAJA-003](caja.md#rf-caja-003--registrar-ingresos-y-egresos).
- Fuente: solicitante. Confirmó ambas formas de entregar vuelto. Quedan por definir los datos operativos del vuelto por Yape; no existe confirmación automática de Yape en esta versión.

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
- Regla: un usuario con el permiso correspondiente de Ventas puede aplicar descuentos manuales a líneas individuales o al total de la venta. Estos pueden acumularse con promociones automáticas: primero se aplica la promoción y después se calcula el descuento manual sobre el importe ya rebajado. La suma de todos los descuentos manuales de la venta no puede superar un monto máximo configurable por venta completa. El límite es único para toda la tienda y se administra donde se configuran los descuentos; no varía según el rol.
- Comprobación: se aceptan descuentos manuales en varias líneas si su suma no supera el límite; se rechaza un intento de superar el límite distribuyendo importes entre líneas o combinando descuento por línea y por total. Un usuario sin el permiso no puede aplicar descuentos manuales.
- Dependencias: [RF-PROM-002](#rf-prom-002--aplicar-descuento-por-volumen); [reglas existentes de autorización](../03-negocio.md#permisos-y-control-de-acceso).
- Fuente: solicitante. Están pendientes quién puede modificar el límite y si el descuento manual se ingresa como monto, porcentaje o ambos.

### RF-VENT-005 — Confirmar venta y salida de inventario

- Estado: confirmado para la selección de almacén y el rechazo por falta de existencias; propuesta técnica pendiente de diseñar para la operación transaccional y la conservación del historial.
- Regla: antes de vender se elige el almacén del que saldrá la mercancía. La venta descuenta el stock de las variantes vendidas en ese almacén y se rechaza completa si no alcanza; no se permiten saldos negativos. Se propone confirmar cobro, venta y salida de inventario en una única operación y conservar los importes, factores y descuentos aplicados sin depender del catálogo futuro.
- Comprobación: una venta con stock suficiente descuenta la cantidad base del almacén elegido; con stock insuficiente no queda venta cobrada ni salida parcial. En ventas simultáneas no se confirma una venta cuyo stock ya fue consumido por otra. Una consulta posterior debe conservar los valores originales aunque cambie el catálogo (criterio propuesto para el historial).
- Dependencias: [RF-VENT-001](#rf-vent-001--vender-variantes-en-unidades-combinadas), [modelo de inventario](../../modelos/02-inventario-costos.md).
- Fuente: solicitante para almacén y falta de stock; propuesta de diseño para atomicidad e historial.

### RF-VENT-006 — Anular ventas

- Estado: confirmado para anulación completa, almacén y turno posterior; otras reglas pendientes de validar.
- Regla: anular revierte la venta completa, no solo algunas líneas; las unidades regresan al almacén del que salieron. Puede anularse después del cierre del turno de venta: el reintegro se registra en un turno posterior sin modificar el cuadre cerrado. Se propone conservar la venta y el detalle originales para mantener trazabilidad.
- Comprobación: una anulación restaura la cantidad total vendida en el almacén de origen y registra el importe reintegrado en efectivo o Yape; si el turno original ya cerró, su efectivo contado y diferencia no cambian. Quedan por definir la admisión de anulaciones después de devoluciones parciales, cómo se vincula el reintegro y qué datos de motivo y responsable son obligatorios.
- Dependencias: [RF-VENT-005](#rf-vent-005--confirmar-venta-y-salida-de-inventario), [Caja](caja.md).
- Fuente: solicitante.

### RF-VENT-007 — Registrar devoluciones

- Estado: confirmado para devoluciones parciales, almacén y turno posterior; otras reglas pendientes de validar.
- Regla: se admiten devoluciones parciales de una venta. Las unidades devueltas regresan al almacén del que salieron; se reintegra el importe efectivamente pagado por esas unidades, teniendo en cuenta sus descuentos e IGV incluido, en efectivo o Yape. Si el turno de la venta ya cerró, el reintegro se registra en un turno posterior sin modificar su cuadre. Se propone vincular cada devolución a la venta y a sus líneas originales.
- Comprobación: una devolución parcial repone en el almacén original solo las cantidades devueltas y registra el reintegro correspondiente al importe pagado por ellas; no altera el efectivo contado ni la diferencia del turno original si ya cerró. Quedan por definir el reparto y redondeo de descuentos a nivel de venta, el límite entre devoluciones sucesivas y qué hacer cuando la mercancía no pueda volver a stock disponible.
- Dependencias: [RF-VENT-005](#rf-vent-005--confirmar-venta-y-salida-de-inventario), [Caja](caja.md).
- Fuente: solicitante.

### RF-VENT-008 — Desglosar IGV y emitir ticket de venta

- Estado: confirmado para IGV incluido al 18 %, ticket interno y descuentos separados; regla de extracción pendiente de validar.
- Regla: el precio de la variante ya incluye IGV del 18 %. El ticket de venta es una constancia interna sin valor tributario: no se emite boleta, factura ni comprobante electrónico en este alcance. Debe mostrar por separado el descuento y el IGV desglosado, sin sumarlo otra vez al total a pagar. Se propone extraer el IGV del total después de descuentos: base = total / 1,18; IGV = total - base. No se obtiene dividiendo el total entre 0,18. Faltan criterios de redondeo y tratamiento de artículos no gravados.
- Comprobación: para un total cobrado de S/ 118 sin descuentos, el desglose propuesto es base S/ 100 e IGV S/ 18; el cliente sigue pagando S/ 118. El ticket muestra subtotal, descuentos y total, con IGV separado; su formato, numeración y corrección ante anulaciones o devoluciones quedan pendientes.
- Dependencias: [RF-VENT-003](#rf-vent-003--cobrar-una-venta), [RF-VENT-006](#rf-vent-006--anular-ventas), [RF-VENT-007](#rf-vent-007--registrar-devoluciones).
- Fuente: solicitante.

## Pendientes de validar

- Reglas para promociones simultáneas, importe fijo mayor que el precio de una caja y descuentos combinados que intenten dejar un total negativo.
- Quién administra el límite manual único y si se admite un descuento ingresado como monto, porcentaje o ambos; alcance de permisos para vender, administrar promociones y autorizar descuentos.
- Confirmar la fórmula de extracción del IGV del total ya descontado; redondeo y reparto por línea, existencia de artículos exonerados/inafectos, numeración y datos del ticket interno; cómo se documentan anulaciones y devoluciones.
- Cómo registrar el vuelto en cada medio, pagos excedentes y cómo se declara o referencia un pago Yape sin verificación externa.
- Cómo distribuir descuentos generales e IGV entre unidades para el reintegro y redondear sus importes; reglas para días cerrados, mercancía no apta para reventa, devoluciones parciales sucesivas y anulación de una venta ya devuelta parcialmente.
- Cómo vincular la venta al movimiento de inventario y garantizar la salida completa frente a ventas concurrentes.
