# Requisitos del sistema — índice

- Estado: especificación inicial de Ventas y Caja con pendientes identificados; entidades preliminares creadas, sin migración ni flujos implementados.
- Última revisión: 23 de octubre de 2026.
- Fuente de las decisiones de Ventas y Caja: conversación con el solicitante.

## Documentos

- [Requisitos funcionales existentes](01-funcionales.md): autenticación, usuarios y control de acceso.
- [Requisitos no funcionales existentes](02-no-funcionales.md): seguridad, autorización y auditoría.
- [Reglas de negocio existentes](03-negocio.md): usuarios, roles y permisos.
- [Ventas y promociones](modulos/ventas-y-promociones.md): variantes, unidades, cobros, descuentos, devoluciones, IGV incluido y ticket de venta.
- [Caja y cuadre](modulos/caja.md): turnos, movimientos y cierre del día.
- [Modelo de tablas y entidades preliminares](../modelos/04-ventas-caja.md): estructura de Ventas, Promociones y Caja; sin migración ni tablas creadas.

## Relación entre capacidades

Ventas utiliza el catálogo, las unidades y las existencias de Inventario, y los usuarios y permisos de Control de acceso. Una venta cobrada pertenece a un turno de Caja. Las promociones se calculan en Ventas; su importe cobrado alimenta el cuadre de Caja. Los requisitos nuevos conservan sus propios identificadores para no alterar los identificadores existentes.

## Pendientes prioritarios

1. Definir cómo registrar el vuelto en efectivo o Yape y cómo afecta al cuadre; ambos medios están permitidos. Yape se declara manualmente y su verificación automática queda para el futuro.
2. Definir el reparto y redondeo de descuentos generales e IGV en devoluciones parciales y el documento de anulación/devolución. El stock regresa al almacén original, el reintegro corresponde a lo pagado por las unidades devueltas y, después del cierre original, se registra en otro turno sin alterar el cuadre anterior.
3. Confirmar el desglose del IGV incluido al 18 % desde el total tras descuentos y los datos del ticket interno (sin validez tributaria); definir promociones simultáneas y quién administra el límite monetario único de descuento manual.
4. Definir efectivo al iniciar el siguiente día, zona horaria y fecha operativa; diseñar el vínculo entre venta y salida de inventario. El almacén se elige antes de vender y la venta falla completa si falta stock.

Los detalles y criterios verificables de cada asunto figuran en los documentos de sus módulos. La existencia de entidades TypeORM no significa que Ventas o Caja tengan endpoints, operaciones transaccionales o tablas migradas.
