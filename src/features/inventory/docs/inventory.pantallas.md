# Organización del Frontend — Sistema de Inventario

## 1. Objetivo

Organizar los módulos y las pantallas del sistema de inventario de manera clara, escalable y fácil de utilizar.

**No es necesario crear un menú por cada tabla de la base de datos.** Algunas entidades funcionan como detalles de otras y deben administrarse dentro de una misma pantalla.

---

## 2. Estructura de menús

```text
📦 Catálogo
├── Productos
│   ├── Datos generales
│   ├── Variantes
│   ├── Atributos
│   └── Unidades del producto
└── Proveedores

🏬 Inventario
├── Existencias
└── Movimientos
    ├── Ingresos
    ├── Salidas
    ├── Traslados
    ├── Ajustes
    └── Historial

⚙️ Configuración
├── Almacenes
├── Unidades de medida
└── Atributos
```

> **Nota:** Las opciones de Datos generales, Variantes, Atributos y Unidades del producto se muestran como pestañas dentro de la pantalla de Productos, no como menús independientes.

---

## 3. Relación entre pantallas y entidades

| Módulo        | Pantalla    | Entidades utilizadas                                                                             |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Catálogo      | Productos   | `productos`, `variantes_producto`, `atributos_producto`, `valores_variante`, `unidades_producto` |
| Catálogo      | Proveedores | `proveedores`                                                                                    |
| Inventario    | Existencias | `existencias`, `productos`, `variantes_producto`, `almacenes`                                    |
| Inventario    | Movimientos | `movimientos_inventario`, `detalle_movimiento`                                                   |
| Inventario    | Historial   | `movimientos_inventario`, `detalle_movimiento`                                                   |
| Configuración | Almacenes   | `almacenes`                                                                                      |
| Configuración | Unidades    | `unidades`                                                                                       |
| Configuración | Atributos   | `atributos`                                                                                      |

---

## 4. Módulo de Catálogo

### 4.1. Productos

La pantalla de Productos permite registrar y administrar los productos comercializados por la empresa.

Al crear o editar un producto, se utilizan las siguientes pestañas:

#### Pestaña 1: Datos generales

Permite administrar la información principal del producto.

**Entidad:** `productos`

Campos de ejemplo:

- Código del producto
- Nombre
- Descripción
- Unidad base
- Estado

#### Pestaña 2: Variantes

Permite registrar las distintas presentaciones de un producto.

**Entidades:**

- `variantes_producto`
- `atributos_producto`
- `valores_variante`

**Ejemplo: Producto Camiseta**

| SKU       | Color  | Talla |
| --------- | ------ | ----- |
| CAM-NEG-M | Negro  | M     |
| CAM-NEG-L | Negro  | L     |
| CAM-BLA-M | Blanco | M     |

Cada variante representa una combinación específica de atributos y dispone de su propio control de existencias.

Los atributos se configuran una sola vez y después se utilizan para definir las variantes de cada producto.

#### Pestaña 3: Unidades

Permite configurar las unidades de medida y sus factores de conversión.

**Entidades:**

- `unidades`
- `unidades_producto`

**Ejemplo: Producto Agua embotellada**

| Unidad                | Factor respecto a la unidad base |
| --------------------- | -------------------------------- |
| Botella               | 1                                |
| Paquete de 6 botellas | 6                                |
| Caja de 24 botellas   | 24                               |

**Regla de negocio:** cada producto tiene una unidad base y puede disponer de unidades secundarias con sus respectivos factores de conversión.

El inventario se mantiene en unidades base, independientemente de la unidad utilizada durante el registro de un movimiento.

### 4.2. Proveedores

Permite registrar y administrar las empresas o personas que suministran productos.

**Entidad:** `proveedores`

Funciones principales:

- Crear proveedores
- Consultar proveedores
- Editar información
- Activar o desactivar proveedores
- Relacionar proveedores con ingresos de inventario

---

## 5. Módulo de Inventario

### 5.1. Existencias

Permite consultar el stock disponible de cada variante en los diferentes almacenes.

**Entidad principal:** `existencias`

Ejemplo:

| Producto | Variante  | Almacén    | Stock |
| -------- | --------- | ---------- | ----: |
| Camiseta | Negro / M | Principal  |   120 |
| Camiseta | Negro / L | Principal  |    85 |
| Camiseta | Negro / M | Secundario |    40 |

**Reglas de negocio:**

- El stock se administra por variante y almacén.
- Cada variante puede tener existencias en diferentes almacenes.
- El stock se expresa en la unidad base del producto.
- No se permite modificar directamente el stock desde esta pantalla.
- Cualquier cambio debe generarse mediante un movimiento de inventario.

### 5.2. Movimientos de inventario

Permite registrar las operaciones que modifican las existencias.

**Entidades:**

- `movimientos_inventario`
- `detalle_movimiento`

Todos los tipos de movimiento pueden compartir un mismo formulario, adaptando los campos de acuerdo con la operación seleccionada.

#### Tipos de movimiento

| Tipo     | Descripción                       | Información requerida                |
| -------- | --------------------------------- | ------------------------------------ |
| Ingreso  | Aumenta las existencias           | Almacén destino y proveedor opcional |
| Salida   | Disminuye las existencias         | Almacén origen y motivo              |
| Traslado | Transfiere stock entre almacenes  | Almacén origen y destino             |
| Ajuste   | Corrige diferencias de inventario | Almacén y justificación              |

#### Formulario de movimientos

**Cabecera del movimiento**

Contiene la información general de la operación:

- Tipo de movimiento
- Fecha
- Almacén de origen o destino
- Proveedor, cuando corresponda
- Observaciones
- Usuario responsable

**Detalle del movimiento**

Permite agregar múltiples productos o variantes en una misma operación.

Ejemplo:

| Variante           | Cantidad | Unidad |
| ------------------ | -------: | ------ |
| Camiseta Negro / M |       20 | Unidad |
| Camiseta Negro / L |       15 | Unidad |
| Agua 500 ml        |        2 | Caja   |

Las cantidades se convierten a la unidad base antes de actualizar las existencias.

### 5.3. Historial de movimientos

Permite consultar las operaciones de inventario registradas previamente.

Funciones principales:

- Consultar movimientos por fecha
- Filtrar por tipo
- Filtrar por almacén
- Consultar movimientos por producto o variante
- Identificar al usuario responsable
- Visualizar el detalle de cada movimiento

**Importante:** el historial debe conservar la trazabilidad de las operaciones. Las correcciones de movimientos ya aplicados deben realizarse mediante operaciones de reversión o compensación, en lugar de modificar silenciosamente el historial.

---

## 6. Módulo de Configuración

### 6.1. Almacenes

**Entidad:** `almacenes`

Permite registrar los lugares físicos o lógicos donde se almacenan los productos.

Funciones:

- Crear almacenes
- Editar almacenes
- Activar o desactivar almacenes
- Consultar almacenes disponibles

### 6.2. Unidades de medida

**Entidad:** `unidades`

Permite administrar el catálogo general de unidades.

Ejemplos:

- Unidad
- Kilogramo
- Gramo
- Litro
- Mililitro
- Caja
- Paquete

Los factores de conversión específicos de cada producto se configuran en `unidades_producto`.

### 6.3. Atributos

**Entidad:** `atributos`

Permite definir las características utilizadas para generar variantes.

Ejemplos:

- Color
- Talla
- Material
- Capacidad
- Presentación

Los atributos disponibles para cada producto se relacionan mediante `atributos_producto`, y sus valores concretos se asignan a las variantes mediante `valores_variante`.

---

## 7. Reglas generales del sistema

1. **Producto y variante:** un producto puede tener múltiples variantes. El stock se controla por variante, no únicamente por producto.
2. **Control por almacén:** una misma variante puede tener diferentes cantidades disponibles en cada almacén.
3. **Unidad base:** cada producto utiliza una unidad base para controlar su inventario.
4. **Conversión de unidades:** las unidades secundarias utilizan factores de conversión configurados por producto.
5. **Movimientos obligatorios:** los ingresos, salidas, traslados y ajustes deben generar registros que permitan auditar el stock.
6. **Trazabilidad:** cada movimiento debe identificar al usuario responsable y la fecha de operación.
7. **Integridad de existencias:** las actualizaciones de stock y el registro del movimiento deben realizarse de forma atómica, dentro de una transacción de base de datos.
8. **Restricciones de stock:** el sistema debe validar el stock disponible antes de realizar salidas o traslados, salvo que exista una política explícita que permita existencias negativas.

---

## 8. Resumen de arquitectura

La organización final del sistema queda distribuida en tres módulos principales:

| Módulo            | Responsabilidad                                                     |
| ----------------- | ------------------------------------------------------------------- |
| **Catálogo**      | Gestionar productos, variantes, unidades por producto y proveedores |
| **Inventario**    | Consultar existencias y registrar todos los movimientos de stock    |
| **Configuración** | Administrar almacenes, unidades generales y atributos reutilizables |

### Principio de diseño

**Las entidades de base de datos no necesariamente representan pantallas del frontend.**

Las pantallas se organizan según las operaciones que necesita realizar el usuario, mientras que las entidades se agrupan de acuerdo con sus relaciones y responsabilidades.

De esta manera, el sistema mantiene una navegación sencilla y una arquitectura preparada para incorporar funcionalidades adicionales, como compras, ventas, reservas de stock, lotes o números de serie.
