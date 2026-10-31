# Listado de cajas con turnos

## Objetivo

Listar las cajas con sus turnos de una fecha operativa, incluyendo el efectivo esperado de cada turno.

## Consulta

- **Endpoint:** `GET /api/cajas`
- **Parámetros:**
  - `fechaOperativa`: fecha de los turnos a consultar, en formato `YYYY-MM-DD`.
  - `estado`: `activas`, `inactivas` o `todas`.

Cada caja debe incluir sus datos de identificación, su estado y sus turnos de la fecha consultada. Las cajas sin turnos deben incluirse con una lista vacía.

Cada turno debe mostrar:

- Usuario de apertura y usuario de cierre, si existe.
- Fecha operativa.
- Fecha y hora de apertura y de cierre, si existe.
- Saldo inicial y efectivo esperado.

En un turno abierto, el usuario y la fecha de cierre serán `null`.

## Reglas del efectivo

- El primer turno de una caja en una fecha operativa permite ingresar manualmente el saldo inicial.
- Los turnos posteriores de la misma caja y fecha operativa toman como saldo inicial el efectivo contado al cierre del turno anterior. No se hereda el saldo de otra fecha operativa.
- Una caja con cierre de tipo día no admite nuevos turnos en esa fecha operativa.
- Para un turno cerrado, se muestra el efectivo esperado guardado al cierre.
- Para un turno abierto, se calcula en tiempo real:

  `saldo inicial + pagos en efectivo − vueltos − devoluciones en efectivo + ingresos − egresos`

- El saldo del turno anterior no se suma nuevamente si ya está incluido en el saldo inicial. Las operaciones no deben contarse dos veces si están representadas en más de un registro.

## Pendientes de definición

- Si `fechaOperativa` es obligatoria o tiene un valor predeterminado; en este último caso, definir la zona horaria.
- El estado predeterminado cuando se omite el filtro `estado`.
