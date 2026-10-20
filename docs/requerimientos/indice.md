# Requisitos del sistema — índice

- Estado: primera especificación de Ventas y Caja; contiene decisiones confirmadas y asuntos pendientes.
- Última revisión: 20 de octubre de 2026.
- Fuente de las decisiones de Ventas y Caja: conversación con el solicitante.

## Documentos

- [Requisitos funcionales existentes](01-funcionales.md): autenticación, usuarios y control de acceso.
- [Requisitos no funcionales existentes](02-no-funcionales.md): seguridad, autorización y auditoría.
- [Reglas de negocio existentes](03-negocio.md): usuarios, roles y permisos.
- [Ventas y promociones](modulos/ventas-y-promociones.md): variantes, unidades, cobros y descuentos.
- [Caja y cuadre](modulos/caja.md): turnos, movimientos y cierre del día.
- [Modelo de tablas propuesto](../modelos/04-ventas-caja.md): estructura preliminar de base de datos para Ventas, Promociones y Caja; aún no implementada.

## Relación entre capacidades

Ventas utiliza el catálogo, las unidades y las existencias de Inventario, y los usuarios y permisos de Control de acceso. Una venta cobrada pertenece a un turno de Caja. Las promociones se calculan en Ventas; su importe cobrado alimenta el cuadre de Caja. Los requisitos nuevos conservan sus propios identificadores para no alterar los identificadores existentes.

## Pendientes prioritarios

1. Definir importe o porcentaje concreto de cada promoción, su vigencia, quién la administra y si pueden coincidir varias promociones de un mismo producto.
2. Definir configuración y alcance del límite monetario de descuento manual (global, por rol u otra opción), además de quién puede cambiarlo.
3. Definir redondeos monetarios, documentación de la venta, anulaciones/devoluciones e impuestos, si corresponden.
4. Definir qué ocurre con el efectivo al iniciar el siguiente día y la zona horaria que determina el día de operación.

Los detalles y criterios verificables de cada asunto figuran en los documentos de sus módulos. Esta especificación no afirma que Ventas o Caja estén implementados.
