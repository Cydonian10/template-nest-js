# Base de datos de inventario

Referencia del esquema definido en `src/features/inventory/entities/`. Los nombres de tablas y columnas son los de PostgreSQL; las propiedades de TypeORM pueden estar en `camelCase`. **Este documento no es una migración:** las tablas se crearán cuando se genere y ejecute una migración a partir de las entidades.

Convenciones: `PK` = clave primaria, `FK` = clave foránea, `UQ` = valor único, `NULL` = opcional. Todos los `id` autogenerados son UUID. Las FK usan `ON DELETE RESTRICT`: no se borran catálogos o movimientos referenciados. PostgreSQL devuelve los valores `numeric` como cadenas en las entidades para preservar la precisión.

## Catálogo de productos

### `unidades`

| Columna   | Tipo           | Reglas           | Uso                                                                                       |
| --------- | -------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `id`      | `uuid`         | PK, autogenerado | Identificador de la unidad.                                                               |
| `nombre`  | `varchar(100)` | No nulo, UQ      | Ej.: unidad, caja, kilogramo.                                                             |
| `simbolo` | `varchar(20)`  | No nulo          | Ej.: `u`, `caja`, `kg`.                                                                   |
| `tipo`    | `varchar(30)`  | No nulo          | Clasificación de la unidad; aún no tiene catálogo cerrado conteo, empaque, masa, volumen. |

### `productos`

| Columna          | Tipo           | Reglas                      | Uso                                        |
| ---------------- | -------------- | --------------------------- | ------------------------------------------ |
| `id`             | `uuid`         | PK, autogenerado            | Identificador del producto.                |
| `nombre`         | `varchar(200)` | No nulo                     | Nombre común a todas sus variantes.        |
| `descripcion`    | `text`         | NULL                        | Descripción opcional.                      |
| `unidad_base_id` | `uuid`         | FK → `unidades.id`, no nulo | Unidad en la que se lleva el inventario.   |
| `activo`         | `boolean`      | No nulo, por defecto `true` | Permite desactivar sin borrar el producto. |

### `unidades_producto`

| Columna         | Tipo            | Reglas                       | Uso                                                  |
| --------------- | --------------- | ---------------------------- | ---------------------------------------------------- |
| `id`            | `uuid`          | PK, autogenerado             | Identificador de la conversión.                      |
| `producto_id`   | `uuid`          | FK → `productos.id`, no nulo | Producto al que aplica.                              |
| `unidad_id`     | `uuid`          | FK → `unidades.id`, no nulo  | Unidad secundaria.                                   |
| `factor_a_base` | `numeric(20,8)` | No nulo, `> 0`               | Cantidad de unidades base por una unidad secundaria. |

`(producto_id, unidad_id)` es único. Por ejemplo, si la unidad base es `unidad`, una `caja` de 12 tiene `factor_a_base = 12`. La unidad base ya está indicada en `productos.unidad_base_id`; no necesita repetirse aquí.

### `atributos`

| Columna  | Tipo           | Reglas           | Uso                           |
| -------- | -------------- | ---------------- | ----------------------------- |
| `id`     | `uuid`         | PK, autogenerado | Identificador del atributo.   |
| `nombre` | `varchar(100)` | No nulo, UQ      | Ej.: color, talla, capacidad. |

### `atributos_producto`

| Columna       | Tipo   | Reglas                            | Uso                                  |
| ------------- | ------ | --------------------------------- | ------------------------------------ |
| `producto_id` | `uuid` | PK compuesta, FK → `productos.id` | Producto que usa el atributo.        |
| `atributo_id` | `uuid` | PK compuesta, FK → `atributos.id` | Atributo permitido para el producto. |

### `variantes_producto`

| Columna         | Tipo            | Reglas                       | Uso                                      |
| --------------- | --------------- | ---------------------------- | ---------------------------------------- |
| `id`            | `uuid`          | PK, autogenerado             | Identificador de la variante.            |
| `producto_id`   | `uuid`          | FK → `productos.id`, no nulo | Producto al que pertenece.               |
| `sku`           | `varchar(100)`  | No nulo, UQ                  | Código único de la variante.             |
| `codigo_barras` | `varchar(100)`  | NULL, UQ cuando tiene valor  | Código de barras opcional.               |
| `precio`        | `numeric(18,2)` | No nulo                      | Precio de la variante.                   |
| `activo`        | `boolean`       | No nulo, por defecto `true`  | Permite desactivar sin perder historial. |

### `valores_variante`

| Columna       | Tipo           | Reglas                                     | Uso                      |
| ------------- | -------------- | ------------------------------------------ | ------------------------ |
| `variante_id` | `uuid`         | PK compuesta, FK → `variantes_producto.id` | Variante concreta.       |
| `atributo_id` | `uuid`         | PK compuesta, FK → `atributos.id`          | Atributo de la variante. |
| `valor`       | `varchar(150)` | No nulo                                    | Ej.: `negro`, `M`.       |

La clave compuesta permite un solo valor por atributo y variante. La comprobación de que el atributo figure en `atributos_producto` queda pendiente para la lógica de aplicación.

## Almacenes y existencias

### `almacenes`

| Columna  | Tipo           | Reglas                      | Uso                                      |
| -------- | -------------- | --------------------------- | ---------------------------------------- |
| `id`     | `uuid`         | PK, autogenerado            | Identificador del almacén.               |
| `nombre` | `varchar(150)` | No nulo, UQ                 | Nombre del lugar de almacenamiento.      |
| `activo` | `boolean`      | No nulo, por defecto `true` | Permite desactivar sin perder historial. |

### `existencias`

| Columna       | Tipo            | Reglas                                     | Uso                                             |
| ------------- | --------------- | ------------------------------------------ | ----------------------------------------------- |
| `variante_id` | `uuid`          | PK compuesta, FK → `variantes_producto.id` | Variante almacenada.                            |
| `almacen_id`  | `uuid`          | PK compuesta, FK → `almacenes.id`          | Almacén donde se encuentra.                     |
| `cantidad`    | `numeric(24,6)` | No nulo, por defecto `0`, `>= 0`           | Stock expresado en la unidad base del producto. |

Existe como máximo un saldo por variante y almacén. Los cambios de saldo deben realizarse de forma transaccional al confirmar movimientos; las entidades por sí solas no actualizan el stock.

## Movimientos

### `movimientos_inventario`

| Columna              | Tipo                                | Reglas                                 | Uso                                            |
| -------------------- | ----------------------------------- | -------------------------------------- | ---------------------------------------------- |
| `id`                 | `uuid`                              | PK, autogenerado                       | Identificador de la cabecera.                  |
| `tipo`               | enum `tipo_movimiento_inventario`   | No nulo                                | `ingreso`, `salida`, `traslado` o `ajuste`.    |
| `almacen_origen_id`  | `uuid`                              | FK → `almacenes.id`, NULL según tipo   | Almacén del que sale el stock.                 |
| `almacen_destino_id` | `uuid`                              | FK → `almacenes.id`, NULL según tipo   | Almacén que recibe el stock o donde se ajusta. |
| `usuario_id`         | `uuid`                              | FK → `users.id`, no nulo               | Usuario que registra el movimiento.            |
| `fecha`              | `timestamptz`                       | No nulo, por defecto fecha de creación | Fecha de registro.                             |
| `estado`             | enum `estado_movimiento_inventario` | No nulo, por defecto `borrador`        | `borrador`, `confirmado` o `anulado`.          |
| `motivo`             | `text`                              | NULL                                   | Justificación opcional.                        |
| `proveedor_id`       | `uuid`                              | FK → `proveedores.id`, NULL            | Opcional y solo válido para ingresos.          |

Reglas de almacén definidas mediante `CHECK`:

| Tipo       | Origen      | Destino                           |
| ---------- | ----------- | --------------------------------- |
| `ingreso`  | Vacío       | Obligatorio                       |
| `salida`   | Obligatorio | Vacío                             |
| `traslado` | Obligatorio | Obligatorio y distinto del origen |
| `ajuste`   | Vacío       | Obligatorio (almacén ajustado)    |

### `detalle_movimiento`

| Columna         | Tipo            | Reglas                                               | Uso                                               |
| --------------- | --------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `id`            | `uuid`          | PK, autogenerado                                     | Identificador del renglón.                        |
| `movimiento_id` | `uuid`          | FK → `movimientos_inventario.id`, no nulo            | Cabecera del movimiento.                          |
| `variante_id`   | `uuid`          | FK → `variantes_producto.id`, no nulo                | Variante afectada.                                |
| `unidad_id`     | `uuid`          | FK → `unidades.id`, no nulo                          | Unidad utilizada al registrar la operación.       |
| `cantidad`      | `numeric(20,6)` | No nulo, distinta de `0`                             | Cantidad en la unidad indicada.                   |
| `factor_a_base` | `numeric(20,8)` | No nulo, `> 0`                                       | Copia del factor vigente al registrar el detalle. |
| `cantidad_base` | `numeric(24,6)` | No nulo, distinta de `0`, mismo signo que `cantidad` | Copia de la cantidad convertida a la unidad base. |

Para un ajuste, una cantidad positiva aumenta y una negativa reduce stock. La base de datos aún **no** exige que ingreso, salida o traslado tengan cantidades positivas, ni verifica que `cantidad_base = cantidad × factor_a_base` o que la unidad sea válida para el producto: estas reglas deberán validarse al implementar los comandos. Los movimientos y detalles no se eliminan en cascada.

## Proveedores

### `proveedores`

| Columna     | Tipo           | Reglas                      | Uso                               |
| ----------- | -------------- | --------------------------- | --------------------------------- |
| `id`        | `uuid`         | PK, autogenerado            | Identificador del proveedor.      |
| `nombre`    | `varchar(200)` | No nulo                     | Nombre del proveedor.             |
| `documento` | `varchar(100)` | NULL, UQ cuando tiene valor | Identificación opcional.          |
| `contacto`  | `varchar(200)` | NULL                        | Información de contacto opcional. |
