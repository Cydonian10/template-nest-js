import { BadRequestException, Controller, Get, Header, NotFoundException, Param, ParseUUIDPipe, Query, StreamableFile, VERSION_NEUTRAL } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../../auth/decorators/public.decorator.js';
import { ImageStorage } from '../../images/storage/image-storage.js';

@Public()
@Controller({ path: 'catalogo-publico', version: VERSION_NEUTRAL })
export class CatalogoPublicoController {
  constructor(private readonly dataSource: DataSource, private readonly imageStorage: ImageStorage) {}

  @Get('categorias')
  async categorias(): Promise<{ id: string; nombre: string }[]> {
    return this.dataSource.query(`SELECT c.id, c.nombre FROM categorias c
      WHERE c.activo = true AND EXISTS (SELECT 1 FROM productos_categorias pc
        JOIN productos p ON p.id = pc.producto_id AND p.activo = true
        JOIN variantes_producto v ON v.producto_id = p.id AND v.activo = true WHERE pc.categoria_id = c.id)
      ORDER BY c.nombre, c.id`);
  }

  @Get('productos')
  async productos(@Query('q') q = '', @Query('categoria') categoria = '', @Query('page') pagina = '1', @Query('limit') limite = '12') {
    if (typeof q !== 'string' || q.length > 150 || typeof categoria !== 'string' ||
      (categoria && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoria)) ||
      typeof pagina !== 'string' || !/^[1-9]\d{0,5}$/.test(pagina) ||
      typeof limite !== 'string' || !['6', '12', '24'].includes(limite)) {
      throw new BadRequestException('Filtros inválidos');
    }
    const page = Number(pagina);
    const limit = Number(limite);
    const busqueda = `%${q.trim().replace(/[!%_]/g, '!$&')}%`;
    const condiciones = `p.activo = true AND v.activo = true AND (p.nombre ILIKE $1 ESCAPE '!'
      OR EXISTS (SELECT 1 FROM valores_variante vv WHERE vv.variante_id = v.id AND vv.valor ILIKE $1 ESCAPE '!'))
      AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM productos_categorias pc
        JOIN categorias c ON c.id = pc.categoria_id AND c.activo = true
        WHERE pc.producto_id = p.id AND c.id = $2::uuid))`;
    const params = [busqueda, categoria || null];
    const [total] = await this.dataSource.query(`SELECT count(*)::int AS total FROM productos p JOIN variantes_producto v ON v.producto_id = p.id WHERE ${condiciones}`, params);
    const items = await this.dataSource.query(`SELECT v.id, p.nombre,
      COALESCE((SELECT json_agg(json_build_object('atributo', a.nombre, 'valor', vv.valor) ORDER BY a.nombre, a.id)
        FROM valores_variante vv JOIN atributos a ON a.id = vv.atributo_id WHERE vv.variante_id = v.id), '[]'::json) AS atributos,
      (EXISTS (SELECT 1 FROM variante_imagenes vi WHERE vi.variante_id = v.id)
        OR EXISTS (SELECT 1 FROM producto_imagenes pi WHERE pi.producto_id = p.id)) AS "tieneImagen",
      COALESCE((SELECT json_agg(json_build_object('id', c.id, 'nombre', c.nombre) ORDER BY c.nombre)
        FROM productos_categorias pc JOIN categorias c ON c.id = pc.categoria_id AND c.activo = true
        WHERE pc.producto_id = p.id), '[]'::json) AS categorias,
      EXISTS (SELECT 1 FROM existencias e
        JOIN almacenes a ON a.id = e.almacen_id AND a.activo = true
        WHERE e.variante_id = v.id AND e.cantidad > 0) AS disponible
      FROM productos p JOIN variantes_producto v ON v.producto_id = p.id
      WHERE ${condiciones} ORDER BY p.nombre, p.id, v.sku, v.id LIMIT $3 OFFSET $4`,
      [...params, limit, (page - 1) * limit]);
    return { items, totalItems: total.total, page, limit };
  }

  @Get('variantes/:varianteId/imagen')
  @Header('Cache-Control', 'public, max-age=300')
  @Header('X-Content-Type-Options', 'nosniff')
  async imagen(@Param('varianteId', new ParseUUIDPipe()) varianteId: string): Promise<StreamableFile> {
    const imagenes: { clave: string; mime: string }[] = await this.dataSource.query(`
      SELECT i.clave_almacenamiento AS clave, i.tipo_mime AS mime FROM variantes_producto v
      JOIN productos p ON p.id = v.producto_id AND p.activo = true
      JOIN LATERAL (
        SELECT vi.imagen_id, 0 AS prioridad, vi.es_principal, vi.orden FROM variante_imagenes vi WHERE vi.variante_id = v.id
        UNION ALL
        SELECT pi.imagen_id, 1 AS prioridad, pi.es_principal, pi.orden FROM producto_imagenes pi WHERE pi.producto_id = p.id
        ORDER BY prioridad, es_principal DESC, orden, imagen_id LIMIT 1
      ) seleccion ON true JOIN imagenes i ON i.id = seleccion.imagen_id
      WHERE v.id = $1 AND v.activo = true`, [varianteId]);
    if (!imagenes.length) throw new NotFoundException('Imagen no encontrada');
    const buffer = await this.imageStorage.read(imagenes[0].clave);
    return new StreamableFile(buffer, { type: imagenes[0].mime });
  }
}
