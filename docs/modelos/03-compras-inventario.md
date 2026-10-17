# Compras y recepción de inventario

## Flujo implementado: recepción completa e inmediata

`POST /api/compras` registra una compra con proveedor existente, almacén activo y al menos un renglón; en **una transacción de PostgreSQL** crea la compra, un único movimiento `ingreso` confirmado, sus detalles y suma cantidad y valor de costo en `existencias`. No hay borradores, recepción diferida ni parcial. El usuario del ingreso se toma de la sesión, no del formulario. La fecha de compra corresponde al documento del proveedor; la recepción se confirma al registrar la compra.

La migración inicial `1791690118249-inventario.ts` crea estas tablas; `1791690118253-documentos-compras.ts` añade `tipo_documento` (`factura`, `boleta`, `otro`), `serie_documento` y la unicidad documental por `(proveedor_id, tipo_documento, serie_documento, numero_documento)` para documentos completos. Las filas antiguas con datos incompletos siguen admitidas. Un documento duplicado devuelve **409** y no vuelve a sumar stock.

### Datos y cálculos

| Tabla                                           | Contenido en este flujo                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compras`                                       | Proveedor, usuario, fecha, tipo/serie/número documental, observaciones, total calculado y fecha de registro.                                        |
| `detalles_compra`                               | Variante, unidad, cantidad, factor de conversión copiado del catálogo y precio unitario; admite la misma variante en varios renglones.              |
| `movimientos_inventario` / `detalle_movimiento` | Un ingreso confirmado por compra y un detalle enlazado por cada renglón; cada detalle conserva cantidad base y costo aplicado.                      |
| `existencias`                                   | Cantidad y valor de costo por variante y almacén; se incrementan atómicamente mediante `INSERT ... ON CONFLICT DO UPDATE` dentro de la transacción. |
| `comprobantes_compra`                           | Cero o un archivo en este flujo, con metadatos y clave privada; no almacena el binario.                                                             |

Los decimales se reciben y devuelven como **cadenas**. `total_documento` es la suma de cada subtotal `cantidad × precio_unitario`, redondeado individualmente a seis decimales mitad hacia arriba (PEN). El costo del detalle de movimiento usa ese subtotal. `cantidad_base = cantidad × factor_a_base` debe representarse **exactamente** con seis decimales: si no, se rechaza la compra sin redondear existencias. No se aceptan total, factor o costo calculados por el cliente como autoridad; tampoco se desglosan impuestos, descuentos, gastos ni pagos.

## Contratos HTTP y permisos

Todas las rutas llevan el prefijo `/api` y requieren autenticación. Los permisos `COMPRAS_LEER`, `COMPRAS_CREAR` y `PROVEEDORES_LEER` pertenecen al sistema `INVENTARIO` y **no se asignan automáticamente** a roles.

| Ruta                                                   | Permiso            | Resultado                                                                                                     |
| ------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/proveedores?page=&limit=&nombre=&documento=` | `PROVEEDORES_LEER` | Proveedores paginados y filtrados.                                                                            |
| `GET /api/proveedores/todos?nombre=&documento=`        | `PROVEEDORES_LEER` | Coincidencias sin paginar para selectores.                                                                    |
| `GET /api/variantes`                                   | `PRODUCTOS_LEER`   | Variantes activas paginadas, con producto y unidades de compra válidas.                                       |
| `GET /api/compras?page=&limit=&q=`                     | `COMPRAS_LEER`     | Compras recientes, búsqueda por proveedor/documento.                                                          |
| `GET /api/compras/:id`                                 | `COMPRAS_LEER`     | Renglones, almacén, ingreso confirmado y metadatos del comprobante o `null`.                                  |
| `POST /api/compras`                                    | `COMPRAS_CREAR`    | Compra e ingreso confirmados; HTTP 201 con ID y estado del comprobante.                                       |
| `POST /api/compras/:id/comprobante`                    | `COMPRAS_CREAR`    | Añade el único comprobante pendiente; HTTP 201 con metadatos, 404 si falta la compra y 409 si ya hay archivo. |
| `GET /api/compras/:id/comprobante/archivo`             | `COMPRAS_LEER`     | Descarga autenticada, privada y sin caché.                                                                    |

La creación recibe `multipart/form-data`: `proveedorId`, `almacenId`, `tipoDocumento`, `fecha` (`YYYY-MM-DD`), `serieDocumento`, `numeroDocumento`, `renglones` (arreglo **JSON serializado** de `{ varianteId, unidadId, cantidad, precioUnitario }`), `observaciones` opcional y archivo opcional `comprobante`. La respuesta 201 es `{ "id": "...", "comprobante": { "estado": "adjuntado" | "pendiente" | "fallido", "advertencia"?: "..." } }`. `pendiente` significa que no se envió archivo; `fallido` significa que se intentó, pero se rechazó o no pudo guardarse: **la compra y el stock ya quedaron confirmados**. No se debe repetir la creación para recuperar el archivo; usar el endpoint posterior.

El adjunto posterior recibe `multipart/form-data` con solo `comprobante`. Se admiten PDF, JPG y PNG de **1 byte a 10 MiB**; se verifica el contenido real contra el MIME declarado y se limita la subida. El archivo se guarda privadamente en `COMPROBANTE_STORAGE_DIR` (por defecto `uploads/comprobantes`), con clave aleatoria que nunca se expone como URL. Si falla el registro de metadatos, se intenta eliminar el archivo huérfano. Un bloqueo transaccional de la compra impide dos adjuntos simultáneos; un fallo permite reintentar mientras no exista comprobante.

## Fuera de este flujo

El modelo conserva relaciones que podrían soportar **varios ingresos y varios comprobantes** para compras futuras, pero esta API solo crea un ingreso completo y permite un comprobante por compra. La recepción parcial o posterior, el reemplazo de archivos, correcciones/anulaciones, pagos y costos adicionales requieren otro flujo con validaciones propias; **adjuntar un comprobante nunca modifica stock**. Una corrección de una recepción ya confirmada debe registrarse mediante un movimiento compensatorio, no alterando silenciosamente el historial.
