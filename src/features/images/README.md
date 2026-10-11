# Imágenes de productos y variantes

- Aplica la migración con `npm run migration:run` antes de usar los endpoints.
- `POST /api/productos/:productoId/imagenes`: `multipart/form-data` con campo `imagen` (JPEG, PNG o WebP, máximo 5 MB).
- `GET /api/productos/:productoId/imagenes`: lista metadatos y el orden de subida.
- `PATCH /api/productos/:productoId/imagenes/:imagenId/principal`: establece la portada del producto.
- `GET /api/productos/:productoId/imagenes/:imagenId/archivo`: devuelve el archivo.
- `DELETE /api/productos/:productoId/imagenes/:imagenId`: quita la asociación y elimina el archivo si ya no tiene asociaciones.
- `POST /api/productos/:productoId/variantes/:varianteId/imagenes`: sube una imagen propia de la variante (mismo campo y límites).
- `GET /api/productos/:productoId/variantes/:varianteId/imagenes`: devuelve imágenes propias o, si no tiene ninguna, las del producto; cada respuesta indica `origen` (`variante` o `producto`).
- `PATCH /api/productos/:productoId/variantes/:varianteId/imagenes/:imagenId/principal`: establece la portada propia de la variante (no cambia la del producto).
- `GET /api/productos/:productoId/variantes/:varianteId/imagenes/:imagenId/archivo`: devuelve el archivo visible para la variante, incluida una imagen heredada cuando no tiene imágenes propias.
- `DELETE /api/productos/:productoId/variantes/:varianteId/imagenes/:imagenId`: solo elimina imágenes propias; para borrar una imagen heredada se usa la ruta del producto.

Las rutas requieren el JWT global de la aplicación. Por ahora no existen permisos de inventario específicos.

Los archivos se guardan en `uploads/images` (ignorado por Git). Puede establecerse `IMAGE_STORAGE_DIR` con una ruta absoluta o relativa al directorio de trabajo. En producción, montar almacenamiento persistente: el disco local de cada instancia no se comparte. Para otro proveedor, implementar `ImageStorage` y cambiar el binding en `images.module.ts`; no se guardan URLs públicas en la base de datos.

`imagenes` conserva los metadatos; `producto_imagenes` y `variante_imagenes` contienen asociaciones opcionales con FK reales. Productos y variantes pueden existir sin imágenes. Al agregar imágenes a otra entidad, crear su propia tabla de asociación y ampliar la lógica de eliminación para que no borre archivos compartidos. La eliminación del producto o la variante está restringida mientras tenga imágenes propias: se deben eliminar primero para evitar archivos huérfanos.

Cada galería permite como máximo una imagen `esPrincipal`, garantizado por índices únicos parciales en PostgreSQL. La primera subida pasa a ser principal; al eliminarla, se promueve la siguiente por `orden` e ID. Las galerías existentes reciben una portada al aplicar la migración. Si la variante no tiene imágenes propias, hereda la galería y la portada del producto. La variante no necesita imágenes para existir.
