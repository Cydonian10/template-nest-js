import type { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../../shared/exceptions/resource-not-found.exception.js';
import { FilterVariantesMovimientoSchema } from '../../dto/filter-variantes-movimiento.dto.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { BuscarVariantesMovimientoHandler } from './buscar-variantes-movimiento.handler.js';
import { BuscarVariantesMovimientoQuery } from './buscar-variantes-movimiento.query.js';

const almacenId = '550e8400-e29b-41d4-a716-446655440000';

function createHandler(activo = true) {
  const builder = {
    innerJoinAndSelect: vi.fn().mockReturnThis(),
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
  };
  const almacenes = { existsBy: vi.fn().mockResolvedValue(activo) };
  const variantes = { createQueryBuilder: vi.fn().mockReturnValue(builder) };
  const handler = new BuscarVariantesMovimientoHandler(
    almacenes as unknown as Repository<Almacen>,
    variantes as unknown as Repository<VarianteProducto>,
  );
  return { handler, almacenes, variantes, builder };
}

describe('BuscarVariantesMovimientoHandler', () => {
  it.each([
    ['salida', 'existencia.cantidad > 0'],
    [
      'traslado',
      'producto.activo = true AND variante.activo = true AND existencia.cantidad > 0',
    ],
    [
      'ajuste',
      '((producto.activo = true AND variante.activo = true) OR existencia.cantidad > 0)',
    ],
  ] as const)(
    'filtra %s según saldo y estado del catálogo',
    async (tipo, condition) => {
      const { handler, almacenes, builder } = createHandler();
      const filter = FilterVariantesMovimientoSchema.parse({
        tipo,
        almacenId,
        q: '  %Tuerca_!  ',
        page: '2',
      });

      await expect(
        handler.execute(new BuscarVariantesMovimientoQuery(filter)),
      ).resolves.toEqual([[], 0]);
      expect(almacenes.existsBy).toHaveBeenCalledWith({
        id: almacenId,
        activo: true,
      });
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        'variante.existencias',
        'existencia',
        'existencia.almacenId = :almacenId',
        { almacenId },
      );
      expect(builder.where).toHaveBeenCalledWith(
        "(producto.nombre ILIKE :search ESCAPE '!' OR variante.sku ILIKE :search ESCAPE '!')",
        { search: '%!%Tuerca!_!!%' },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(condition);
      expect(builder.orderBy).toHaveBeenCalledWith('producto.nombre', 'ASC');
      expect(builder.addOrderBy).toHaveBeenCalledWith('variante.id', 'ASC');
      expect(builder.skip).toHaveBeenCalledWith(20);
      expect(builder.take).toHaveBeenCalledWith(20);
    },
  );

  it('rechaza almacenes inexistentes o inactivos antes de buscar', async () => {
    const { handler, variantes } = createHandler(false);
    const filter = FilterVariantesMovimientoSchema.parse({
      tipo: 'salida',
      almacenId,
      q: 'tuerca',
    });

    await expect(
      handler.execute(new BuscarVariantesMovimientoQuery(filter)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(variantes.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('valida tipo, almacén, búsqueda mínima y paginación', () => {
    const valid = { tipo: 'ajuste', almacenId, q: 'tuerca' };
    expect(FilterVariantesMovimientoSchema.parse(valid)).toMatchObject({
      page: 1,
      limit: 20,
    });
    for (const invalid of [
      { ...valid, tipo: 'ingreso' },
      { ...valid, almacenId: 'todos' },
      { ...valid, q: '  x  ' },
      { ...valid, q: '' },
      { ...valid, page: '0' },
      { ...valid, limit: '101' },
    ]) {
      expect(FilterVariantesMovimientoSchema.safeParse(invalid).success).toBe(
        false,
      );
    }
  });
});
