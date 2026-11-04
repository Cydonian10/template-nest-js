# SPEC 01 — Registrar una venta

> **Estado:** Aprobado  
> **Dependencias:** SPEC venta/01-cierre-turno-caja, SPEC venta/02-resumen-cierre-turno  
> **Fecha:** 2026-10-31  
> **Objetivo:** Registrar mediante un único endpoint una venta pagada con sus detalles y salida de inventario.

## Alcance

**Incluye:**

- Agregar `POST /api/ventas` para usuarios autenticados y obtener de la sesión el usuario que registra la venta.
- Recibir el turno, el almacén, los detalles y los pagos en una sola solicitud.
- Calcular los importes con el precio vigente del catálogo, sin descuentos y con IGV del 18 % incluido.
- Registrar la venta confirmada, los pagos, el vuelto aplicable y una salida confirmada de inventario en una transacción.
- Impedir ventas con existencias insuficientes y coordinar la venta con otras operaciones de inventario y el cierre del turno.
- Evitar duplicados por reintentos mediante una clave de idempotencia por usuario.
- Documentar el contrato en Swagger y probar validaciones, cálculos, persistencia y concurrencia.

**Fuera de alcance:**

- Consulta, edición, anulación o devolución de ventas y generación de comprobantes o tickets.
- Ventas a crédito, pagos pendientes, descuentos manuales y promociones.
- Nuevos medios de pago, cambios en los permisos y cambios en las reglas de cierre de caja.
- Confirmación del precio mostrado en el cliente; se usa el precio vigente al procesar la venta.

## Modelo de datos y contrato

Se reutilizan `Venta`, `DetalleVenta`, `PagoVenta`, `VueltoVenta`, `MovimientoInventario`, `DetalleMovimiento` y `Existencia`. Se agregará la persistencia necesaria para asociar de manera única la clave de idempotencia y el contenido de la solicitud al usuario y a la venta. La migración debe conservar los registros existentes y no compartir el espacio de claves de las operaciones independientes de inventario.

La solicitud exige el encabezado `Idempotency-Key` y un cuerpo con esta estructura:

```json
{
  "turnoId": "uuid-del-turno",
  "almacenId": "uuid-del-almacen",
  "detalles": [
    {
      "varianteId": "uuid-de-la-variante",
      "unidadId": "uuid-de-la-unidad",
      "cantidad": "2"
    }
  ],
  "pagos": [{ "medio": "efectivo", "importe": "50.00" }]
}
```

- Los identificadores son UUID. Las cantidades y los importes son cadenas decimales positivas dentro de la precisión de sus columnas. Se exige al menos un detalle y un pago; se rechazan propiedades adicionales y pares `varianteId`/`unidadId` duplicados.
- El turno debe existir y estar abierto. Cualquier usuario autenticado puede vender en él. El almacén, la variante y la unidad deben existir y ser utilizables; la unidad debe estar asociada al producto de la variante.
- El precio de la variante corresponde a la unidad base. El precio unitario de venta es el precio vigente multiplicado por `factorABase`, redondeado a dos decimales. Cada subtotal de línea es el precio unitario redondeado multiplicado por la cantidad, redondeado a dos decimales. Se usa aritmética decimal exacta y redondeo de mitad hacia arriba.
- La cantidad base es la cantidad multiplicada por el factor de la unidad. Se respetan las precisiones existentes y no se permite una conversión que resulte en una cantidad base nula o no representable.
- El subtotal de la venta es la suma de los subtotales de línea y coincide con el total porque no hay descuentos. La base imponible es el total dividido entre 1,18, redondeado a dos decimales; el IGV es la diferencia entre total y base. Los descuentos promocionales y manuales de cabecera y detalle son cero. El total debe ser positivo.
- Se admiten pagos en `efectivo` y `yape`, incluidos pagos mixtos. La suma debe cubrir el total. Si hay excedente, se registra como vuelto en efectivo y no puede superar el efectivo recibido.
- Se guarda una salida confirmada del almacén indicado, con detalles correspondientes a las líneas y su cantidad base. Se reducen las existencias y su valor de costo conforme al costo promedio y las reglas existentes de salida. La venta referencia el movimiento generado.
- La respuesta de creación contiene el identificador, la fecha, el estado, el turno, el almacén, el usuario, los importes, los detalles con precios y cantidades, los pagos y el vuelto. Los decimales se devuelven como cadenas. La respuesta se obtiene de los valores registrados, no de precios actuales.
- La clave de idempotencia es obligatoria y se identifica junto con el usuario autenticado. Una repetición del mismo cuerpo devuelve la respuesta original sin volver a cobrar ni descontar existencias. La misma clave con otro cuerpo devuelve `409`. Dos solicitudes simultáneas con la misma clave no pueden crear dos ventas.
- Datos inválidos o propiedades adicionales producen `400`; referencias inexistentes producen `404`; turno cerrado, stock insuficiente, pagos insuficientes, vuelto no permitido o conflicto de idempotencia producen `409`. Una falla revierte todos los cambios.

## Plan de implementación

1. Incorporar la persistencia y migración de idempotencia para ventas, compatible con registros existentes, y probar su unicidad por usuario sin interferir con claves de inventario.
2. Agregar DTO de solicitud y respuesta en `src/features/sales/ventas/dto/`, con validación de encabezado, referencias, decimales, pagos y detalles; cubrir las reglas con pruebas.
3. Agregar comando y handler en `src/features/sales/ventas/commands/crear-venta/`; calcular importes con los datos vigentes y probar conversiones, redondeo, IGV, pagos y vuelto.
4. En el handler, usar `UnitOfWork` y su `EntityManager` para bloquear y validar el turno y las existencias, persistir venta, pagos y salida con su valoración, y resolver la idempotencia de manera atómica. Reutilizar las reglas y coordinación de bloqueo existentes de inventario y cierre de turno.
5. Registrar el handler y un controlador en `src/features/sales/sales.module.ts`; exponer y documentar `POST /api/ventas` con sus respuestas y errores.
6. Añadir pruebas de integración de creación, rollback y concurrencia con cierre de turno, movimientos de inventario y reintentos; verificar la compilación y las pruebas relevantes.

## Criterios de aceptación

- [ ] Un usuario autenticado crea una venta confirmada mediante una solicitud con turno abierto, almacén, detalles y pagos válidos.
- [ ] Se rechazan solicitudes sin autenticación, claves ausentes, UUID o decimales inválidos, listas vacías, propiedades adicionales y pares de variante y unidad repetidos.
- [ ] Se validan la existencia y disponibilidad de las referencias, la asociación de unidad y producto, y el estado abierto del turno.
- [ ] El precio procede del catálogo al procesar la venta y el precio por unidad, subtotales, base e IGV siguen las fórmulas y el redondeo definidos.
- [ ] Los descuentos son cero y las ventas de total cero se rechazan.
- [ ] Los pagos en efectivo y Yape cubren el total; se rechazan pagos insuficientes y excedentes mayores que el efectivo recibido.
- [ ] La venta, sus detalles, pagos y eventual vuelto, la salida de inventario y el cambio de existencias y valor de costo se registran juntos o no se registra ninguno.
- [ ] La venta rechaza stock insuficiente, también cuando varias líneas de una misma variante en unidades diferentes superan conjuntamente la existencia.
- [ ] Dos ventas concurrentes no pueden consumir una misma existencia por encima del saldo disponible.
- [ ] Una venta concurrente con el cierre no puede registrarse en un turno ya cerrado ni invalidar el efectivo confirmado en el cierre.
- [ ] Un reintento idéntico del mismo usuario y clave devuelve la respuesta original sin repetir efectos, incluso con solicitudes concurrentes; otro cuerpo con esa clave devuelve `409`.
- [ ] La respuesta incluye los datos registrados descritos y el endpoint aparece en Swagger.
- [ ] Pasan las pruebas relevantes y la compilación de la API.

## Decisiones tomadas y descartadas

- **Sí:** una sola solicitud registra venta, pago e inventario, para evitar ventas parcialmente registradas.
- **Sí:** precio vigente del servidor, sin confirmación del precio mostrado; el cliente no define el importe cobrado.
- **Sí:** precio de la unidad base multiplicado por su factor, con redondeo por línea y mitad hacia arriba.
- **Sí:** IGV incluido del 18 % y ningún descuento en esta primera versión.
- **Sí:** pagos completos en efectivo y Yape, incluso mixtos; el vuelto se limita al efectivo recibido.
- **Sí:** rechazar stock insuficiente y valorar las salidas al costo promedio existente.
- **Sí:** idempotencia obligatoria por usuario para evitar duplicados por reintentos.
- **No:** venta sin pagos o sin movimiento de inventario, crédito y ventas de total cero.

## Riesgos identificados

| Riesgo                                                                   | Mitigación                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Ventas o movimientos simultáneos agotan el mismo saldo.                  | Coordinar bloqueos de existencia con las operaciones existentes y comprobar carreras con conexiones independientes. |
| Una venta modifica el efectivo después de confirmar el cierre.           | Bloquear el turno siguiendo el protocolo del cierre y probar ambas operaciones concurrentes.                        |
| El precio cambia entre visualizar el carrito y vender.                   | Aplicar el precio vigente y devolverlo en la respuesta; la confirmación del precio mostrado queda fuera de alcance. |
| Reintentos duplican ventas o se confunden con operaciones de inventario. | Aislar la idempotencia de ventas por usuario y protegerla con unicidad transaccional.                               |

## Qué no incluye esta especificación

- Consultas, modificaciones, anulaciones, devoluciones ni comprobantes de venta.
- Crédito, descuentos, promociones o medios de pago adicionales.
- Confirmación del precio visualizado por el cliente.

## Regla

- Si ejecutar el test
