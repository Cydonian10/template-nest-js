import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity.js';
import { ImageStorage } from '../images/storage/image-storage.js';
import { LocalImageStorage } from '../images/storage/local-image-storage.js';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CreateProductHandler } from './products/commands/create-product/create-product.handler.js';
import { ProductsController } from './products/controllers/productos/products.controller.js';
import { Unidad } from './entities/unidad.entity.js';
import { UnidadController } from './unidades/controllers/unidad.controller.js';
import { CreateUnidadHandle } from './unidades/commands/create-unidad/create-unidad.handler.js';
import { FindAllUnidadesHandler } from './unidades/queries/find-all-unidades/find-all-unidades.handler.js';
import { UpdateUnidadHandler } from './unidades/commands/update-unidad/update-unidad.handler.js';
import { DeleteUnidadHandler } from './unidades/commands/delete-unidad/delete-unidad.handler.js';
import { Atributo } from './entities/atributo.entity.js';
import { AtributosController } from './atributos/controllers/atributos.controller.js';
import { CreateAtributoHandler } from './atributos/commands/create-atributo/create-atributo.handler.js';
import { UpdateAtributoHandler } from './atributos/commands/update-atributo/update-atributo.handler.js';
import { DeleteAtributoHandler } from './atributos/commands/delete-atributo/delete-atributo.handler.js';
import { FindAllAtributosHandler } from './atributos/queries/find-all-atributos/find-all-atributos.handler.js';
import { FindAtributoByIdHandler } from './atributos/queries/find-atributo-by-id/find-atributo-by-id.handler.js';
import { AtributoProducto } from './entities/atributo-producto.entity.js';
import { AtributosPorProductoController } from './products/controllers/atributos-por-producto/atributos-por-producto.controller.js';
import { UnidadesPorProductoController } from './products/controllers/unidades-por-producto/unidades-por-producto.controller.js';
import { UnidadProducto } from './entities/unidad-producto.entity.js';
import { AgregarUnidadProductoHandler } from './products/commands/agregar-unidad-producto/agregar-unidad-producto.handler.js';
import { EditarUnidadProductoHandler } from './products/commands/editar-unidad-producto/editar-unidad-producto.handler.js';
import { EliminarUnidadProductoHandler } from './products/commands/eliminar-unidad-producto/eliminar-unidad-producto.handler.js';
import { ListarUnidadesProductoHandler } from './products/queries/listar-unidades-producto/listar-unidades-producto.handler.js';
import { AtributosPorProductoHandler } from './products/queries/atributos-por-producto/atributos-por-producto.handler.js';
import { AgregarAtributoProductoHandler } from './products/commands/agregar-atributo-producto/agregar-atributo-producto.handler.js';
import { QuitarAtributoProductoHandler } from './products/commands/quitar-atributo-producto/quitar-atributo-producto.handler.js';
import { VariantesController } from './variante-producto/controllers/variantes.controller.js';
import { CrearVarianteProductoHandler } from './variante-producto/commands/crear-variante-producto/crear-variante-producto.handler.js';
import { ListarVariantesHandler } from './variante-producto/queries/listar-variantes/listar-variantes.handler.js';
import { VarianteProducto } from './entities/variante-producto.entity.js';
import { FindProductByIdHandler } from './products/queries/find-product-by-id/find-product-by-id.handler.js';
import { UpdateProductHandler } from './products/commands/update-product/update-product.handler.js';
import { Almacen } from './entities/almacen.entity.js';
import { AlmacenesController } from './almacenes/almacenes.controller.js';
import { FindAllAlmacenesHandler } from './almacenes/find-all-almacenes.handler.js';
import { CreateAlmacenHandler } from './almacenes/create-almacen.handler.js';
import { UpdateAlmacenHandler } from './almacenes/update-almacen.handler.js';
import { Proveedor } from './entities/proveedor.entity.js';
import { ProveedoresController } from './proveedores/controllers/proveedores/proveedores.controller.js';
import { FindProveedoresHandler } from './proveedores/queries/find-proveedores/find-proveedores.handler.js';
import { FindTodosProveedoresHandler } from './proveedores/queries/find-todos-proveedores/find-todos-proveedores.handler.js';
import { VariantesCompraController } from './variante-producto/controllers/variantes-compra.controller.js';
import { BuscarVariantesCompraHandler } from './variante-producto/queries/buscar-variantes-compra.handler.js';
import { ComprobanteCompra } from './entities/comprobante-compra.entity.js';
import { ComprobantesController } from './compras/controllers/comprobantes/comprobantes.controller.js';
import { DescargarComprobanteHandler } from './compras/queries/descargar-comprobante/descargar-comprobante.handler.js';
import { ComprobanteStorage } from './compras/storage/comprobante-storage.js';
import { LocalComprobanteStorage } from './compras/storage/local-comprobante-storage.js';
import { Compra } from './entities/compra.entity.js';
import { ComprasController } from './compras/controllers/compras/compras.controller.js';
import { ListarComprasHandler } from './compras/queries/listar-compras/listar-compras.handler.js';
import { ObtenerCompraHandler } from './compras/queries/obtener-compra/obtener-compra.handler.js';
import { CrearCompraHandler } from './compras/commands/crear-compra/crear-compra.handler.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Producto,
      Unidad,
      UnidadProducto,
      Atributo,
      AtributoProducto,
      VarianteProducto,
      Almacen,
      Proveedor,
      ComprobanteCompra,
      Compra,
    ]),
  ],
  controllers: [
    ProductsController,
    UnidadController,
    AtributosController,
    AtributosPorProductoController,
    UnidadesPorProductoController,
    VariantesController,
    AlmacenesController,
    ProveedoresController,
    VariantesCompraController,
    ComprobantesController,
    ComprasController,
  ],
  providers: [
    CreateProductHandler,
    FindProductByIdHandler,
    UpdateProductHandler,
    FindAllAlmacenesHandler,
    CreateAlmacenHandler,
    UpdateAlmacenHandler,
    FindProveedoresHandler,
    FindTodosProveedoresHandler,
    BuscarVariantesCompraHandler,
    DescargarComprobanteHandler,
    ListarComprasHandler,
    ObtenerCompraHandler,
    CrearCompraHandler,
    CreateUnidadHandle,
    FindAllUnidadesHandler,
    UpdateUnidadHandler,
    DeleteUnidadHandler,
    CreateAtributoHandler,
    UpdateAtributoHandler,
    DeleteAtributoHandler,
    FindAllAtributosHandler,
    FindAtributoByIdHandler,
    AtributosPorProductoHandler,
    AgregarAtributoProductoHandler,
    AgregarUnidadProductoHandler,
    EditarUnidadProductoHandler,
    EliminarUnidadProductoHandler,
    ListarUnidadesProductoHandler,
    QuitarAtributoProductoHandler,
    CrearVarianteProductoHandler,
    ListarVariantesHandler,
    UnitOfWork,
    { provide: ImageStorage, useClass: LocalImageStorage },
    { provide: ComprobanteStorage, useClass: LocalComprobanteStorage },
  ],
})
export class InventoryModule {}
