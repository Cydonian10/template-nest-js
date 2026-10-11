# Costos del inventario

El inventario conserva cantidades y valores por variante y almacén. Este modelo prepara el cálculo de costo promedio móvil, pero **las entidades no calculan ni actualizan saldos por sí solas**. La lógica de confirmación de movimientos y la migración de inventario todavía están pendientes.

## Campos y significado

| Tabla                | Columna       | Tipo                               | Uso                                                                                                                                                            |
| -------------------- | ------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variantes_producto` | `precio`      | `numeric(18,2)`                    | Precio de venta vigente; no se usa como costo de inventario. Ya existía y no se modifica.                                                                      |
| `detalle_movimiento` | `costo_total` | `numeric(38,6) NULL`               | Valor absoluto aplicado a la cantidad del renglón en unidades base. El tipo de movimiento (y el signo de un ajuste) determina si se suma o se resta del saldo. |
| `existencias`        | `valor_costo` | `numeric(38,6) NOT NULL DEFAULT 0` | Valor del stock restante de esa variante **en ese almacén**; no es precio de venta.                                                                            |

Los costos se guardan como `numeric` y se reciben como cadenas en TypeORM para evitar pérdidas de precisión por `number`. Los costos pueden ser `0` (mercancía sin costo), pero no negativos. En `existencias`, `valor_costo` no puede ser negativo y debe ser `0` si `cantidad` es `0`. `costo_total` admite `NULL` para borradores; **al confirmar**, la lógica futura deberá exigir un importe, aunque sea `0`. No debe confundirse `NULL` (costo aún no determinado) con `0` (costo gratuito conocido). El precio de compra se guarda en `detalles_compra.precio_unitario`; el costo aplicado por unidad base puede calcularse como `costo_total / abs(cantidad_base)` cuando se necesite consultarlo, con el redondeo apropiado. Ninguno de esos costos unitarios se duplica en el detalle del movimiento.

## Cálculo previsto al confirmar movimientos

El método propuesto es **promedio ponderado móvil por variante y almacén**. Si `cantidad > 0`, `costo_promedio_base = valor_costo / cantidad`; cuando no hay existencias no se calcula un promedio.

- **Ingreso comprado:** `cantidad_base = cantidad × factor_a_base`. El importe pagado por la mercancía recibida parte de `cantidad × detalles_compra.precio_unitario`. El `costo_total` refleja el costo efectivo del renglón tras los conceptos que se decida capitalizar. Después se suman `cantidad_base` y `costo_total` al saldo. Un ingreso que no sea compra también necesita un `costo_total` aplicado, pero no un precio de compra ficticio.
- **Salida:** se toma el promedio del almacén origen antes de restar. Se registra el costo aplicado en el detalle y se restan cantidad y valor; no se recalcula usando el precio de venta. Si sale todo el stock, el valor final debe quedar exactamente en `0` para evitar residuos por redondeo.
- **Traslado:** se resta del origen y se agrega al destino el **mismo valor**, sin crear una ganancia ni volver a usar un precio de compra. El costo resultante del destino depende del saldo que ya tenía ese almacén.
- **Ajuste:** cantidad positiva incorpora stock y requiere definir su costo de entrada; cantidad negativa usa el costo promedio del almacén. El signo de `cantidad_base` indica si se suma o resta valor; `costo_total` siempre se guarda no negativo.

Ejemplo de conversión: comprar 2 cajas de 12 unidades a 60 por caja significa `cantidad_base = 24` y `costo_total = 120`, si no hay otros costos capitalizables; el costo unitario base calculado sería `120 / 24 = 5`. Ejemplo de promedio: con 10 unidades y `valor_costo = 50`, ingresar otras 10 con `costo_total = 70` deja 20 unidades, valor 120 y promedio 6. Una salida de 4 aplica costo 24 y deja 16 unidades, valor 96.

Las fórmulas anteriores son **reglas previstas**, no comportamiento ya implementado. Al desarrollarlas habrá que definir redondeo, costos adicionales, descuentos e impuestos recuperables, y usar aritmética decimal (no `number`). La confirmación debe bloquear los saldos afectados y guardar movimiento, detalles, cantidad y valor en una única transacción, evitando aplicar un mismo movimiento dos veces. Los movimientos confirmados no deben editarse silenciosamente; deben corregirse mediante reversión o compensación.

## Relación con las compras

Estos campos registran el costo aplicado al inventario; no sustituyen una compra con factura o comprobantes. El modelo de [compras y recepción](03-compras-inventario.md) ya define la compra, sus renglones y los metadatos de PDF/fotos, con vínculos hacia los ingresos. **La subida de archivos y la confirmación de ingresos aún no están implementadas.** Antes de usar estas columnas en PostgreSQL se deberá generar, revisar y ejecutar la migración del inventario y compras; si ya existen saldos, habrá que calcular su valor inicial en lugar de asumir que el `DEFAULT 0` representa su costo real.
