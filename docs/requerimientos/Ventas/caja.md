# Caja y cuadre

## Propósito y alcance

Controlar el efectivo de una caja física mediante turnos que pueden abrirse y cerrarse varias veces al día. Cada cierre exige cuadre; el cierre del día genera un reporte que reúne todos los turnos. Las ventas y cobros se definen en [Ventas y promociones](ventas-y-promociones.md).

## Flujo principal

El usuario abre un turno de la caja, registra ventas y, cuando corresponde, ingresos o egresos de efectivo. Al cerrar cuenta el efectivo y se registra cualquier diferencia. Puede cerrar turno para continuar después con la misma caja, o cerrar día para terminar su operación y obtener el reporte consolidado.

## Requisitos

### RF-CAJA-001 — Abrir turno

- Estado: confirmado.
- Regla: se requiere un turno abierto de la caja física para registrar ventas. Una caja puede tener varios turnos sucesivos en el mismo día; el saldo inicial del siguiente turno de esa misma caja es el efectivo realmente contado al cerrar el anterior. El efectivo de Yape no forma parte de ese saldo.
- Comprobación: se puede volver a abrir la caja después de cerrar turno, usando el efectivo contado del turno anterior; sin turno abierto no se registra una venta.
- Dependencias: [RF-VENT-003](ventas-y-promociones.md#rf-vent-003--cobrar-una-venta).
- Fuente: solicitante. El importe inicial del primer turno del día y quién puede abrirlo están pendientes.

### RF-CAJA-002 — Cuadrar al cerrar

- Estado: confirmado.
- Regla: todo cierre de turno y de día exige registrar el efectivo contado y calcular la diferencia respecto del efectivo esperado. Se permite cerrar con diferencia, que queda registrada; no se ajusta ni oculta automáticamente. El efectivo esperado se obtiene del saldo inicial, el efectivo recibido por ventas menos el vuelto entregado en efectivo, más los ingresos de efectivo y menos los egresos de efectivo. Los reintegros en efectivo por anulaciones y devoluciones reducen el efectivo esperado del turno en que se entregan, sin contarlos otra vez como egresos manuales. Vuelto y reintegros por Yape se informan por separado y no reducen el efectivo físico.
- Comprobación: con saldo inicial S/ 50, cobros en efectivo S/ 100, ingresos S/ 20 y egresos S/ 10, sin vueltos ni reintegros, se esperan S/ 160; si se cuentan S/ 155, el cierre guarda una diferencia de S/ -5 y, si sigue otro turno, este inicia con S/ 155. Un reintegro posterior en efectivo afecta solo al turno en que se paga, no al ya cerrado.
- Dependencias: [RF-CAJA-003](#rf-caja-003--registrar-ingresos-y-egresos), [RF-VENT-003](ventas-y-promociones.md#rf-vent-003--cobrar-una-venta).
- Fuente: solicitante.

### RF-CAJA-003 — Registrar ingresos y egresos

- Estado: confirmado.
- Regla: se pueden registrar movimientos de ingreso y egreso de efectivo de un turno, con monto, motivo y usuario. Si antes del cierre se detecta un movimiento omitido, se registra explícitamente y se recalcula el cuadre; no se reemplaza por un ajuste automático de la diferencia. Los cobros de ventas no se duplican como ingresos manuales.
- Comprobación: un ingreso incrementa y un egreso reduce el efectivo esperado; cada movimiento puede consultarse con su responsable y motivo; la diferencia permanece registrada si no se explica con movimientos reales.
- Dependencias: [RF-CAJA-002](#rf-caja-002--cuadrar-al-cerrar); [auditoría existente](../02-no-funcionales.md#rnf-004-auditoría).
- Fuente: solicitante y recomendación aceptada. Categorías y permisos de movimientos pendientes de validar.

### RF-CAJA-004 — Cerrar turno

- Estado: confirmado.
- Regla: «cerrar turno» realiza el cuadre obligatorio y permite una nueva apertura de la misma caja física durante ese día, con el efectivo contado como nuevo saldo inicial.
- Comprobación: después del cierre no se pueden registrar ventas en el turno cerrado; al abrir el siguiente turno de la misma caja se recupera el monto contado, no el monto esperado.
- Dependencias: [RF-CAJA-001](#rf-caja-001--abrir-turno), [RF-CAJA-002](#rf-caja-002--cuadrar-al-cerrar).
- Fuente: solicitante.

### RF-CAJA-005 — Cerrar día y consultar reporte

- Estado: confirmado.
- Regla: «cerrar día» exige el cuadre del último turno, impide reabrir la misma caja física en esa fecha y deja disponible un reporte consolidado de todos los turnos de esa caja en ese día. El reporte separa ventas en efectivo y Yape, ingresos, egresos, reintegros y diferencias de cuadre. No cuenta como nuevo ingreso el efectivo trasladado como saldo inicial entre turnos. Una anulación o devolución posterior no reescribe los importes ya cerrados; queda pendiente cómo se refleja en los reportes por fecha de venta y de reintegro.
- Comprobación: tras varios cierres de turno, el reporte incluye todos ellos y el cierre final; no duplica los saldos trasladados. Una nueva apertura de esa caja en la misma fecha es rechazada.
- Dependencias: [RF-CAJA-002](#rf-caja-002--cuadrar-al-cerrar), [RF-CAJA-004](#rf-caja-004--cerrar-turno).
- Fuente: recomendación aceptada por el solicitante.

### RF-CAJA-006 — Trasladar efectivo entre cajas distintas

- Estado: propuesto; fuera del alcance inicial salvo confirmación.
- Regla propuesta: si se necesita trasladar efectivo entre cajas físicas distintas, registrarlo como una operación explícita con origen, destino, monto y responsable; no reutilizar el saldo de la siguiente apertura de la misma caja como mecanismo de traslado.
- Comprobación propuesta: un traslado afecta el efectivo esperado de ambas cajas y deja trazabilidad sin contarlo como venta.
- Fuente: recomendación aún no solicitada como funcionalidad inicial.

## Pendientes de validar

- Política para el saldo al abrir el primer turno de un nuevo día, incluidos retiros o depósitos al cierre diario.
- Zona horaria y fecha operativa de la caja; permisos para apertura, movimientos, cierres y consulta de reportes.
- Si un cierre puede corregirse, quién lo autoriza y cómo conservar su historial; formato y filtros del reporte.
- Registro del vuelto en ambos medios; identificación del turno abierto que efectúa un reintegro tras cerrar el turno de venta; reportes del día original frente al día de reintegro, incluso si el día original ya cerró. No modificar ni ocultar un cuadre histórico.
- Transferencias entre cajas físicas, si se incorporan más adelante.
