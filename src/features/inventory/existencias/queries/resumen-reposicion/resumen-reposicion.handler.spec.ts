import { NotFoundException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { ResumenReposicionHandler } from './resumen-reposicion.handler.js';
import { ResumenReposicionQuery } from './resumen-reposicion.query.js';

describe('ResumenReposicionHandler', () => {
  function setup(activo = true) {
    const count = { getRawOne: vi.fn().mockResolvedValue({ bajoMinimo: '18', agotadas: '12' }) };
    const builder = {
      innerJoin: vi.fn().mockReturnThis(), leftJoin: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(), addOrderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([{ varianteId: 'v1', cantidadBase: '0', minimoBase: null, tipo: 'agotada' }]),
      clone: vi.fn(() => ({ select: vi.fn().mockReturnThis(), addSelect: vi.fn().mockReturnThis(), ...count })),
    };
    const existsBy = vi.fn().mockResolvedValue(activo);
    const getRepository = vi.fn((entity: typeof Almacen | typeof VarianteProducto) =>
      entity === Almacen ? { existsBy } : { createQueryBuilder: vi.fn(() => builder) },
    );
    const transaction = vi.fn(async (_level: string, work: (manager: EntityManager) => Promise<unknown>) =>
      work({ getRepository } as unknown as EntityManager),
    );
    const handler = new ResumenReposicionHandler({ manager: { transaction } } as Repository<VarianteProducto>);
    return { handler, builder, existsBy, count, transaction };
  }

  it('cuenta todos los pares y limita en base de datos las diez alertas ordenadas', async () => {
    const { handler, builder, count, transaction } = setup();
    await expect(handler.execute(new ResumenReposicionQuery('todos'))).resolves.toEqual({
      bajoMinimo: 18, agotadas: 12,
      alertas: [{ varianteId: 'v1', cantidadBase: '0', minimoBase: null, tipo: 'agotada' }],
    });
    expect(transaction).toHaveBeenCalledWith('REPEATABLE READ', expect.any(Function));
    expect(count.getRawOne).toHaveBeenCalledOnce();
    expect(builder.leftJoin).toHaveBeenCalledTimes(2);
    expect(builder.where).toHaveBeenCalledWith('variante.activo = true');
    expect(builder.andWhere).toHaveBeenCalledWith(
      '(COALESCE(saldo.cantidad, 0) = 0 OR (COALESCE(saldo.cantidad, 0) > 0 AND COALESCE(saldo.cantidad, 0) <= minimo.minimoBase))',
    );
    expect(builder.orderBy).toHaveBeenCalledWith(
      'CASE WHEN COALESCE(saldo.cantidad, 0) = 0 THEN 0 ELSE 1 END', 'ASC',
    );
    expect(builder.addOrderBy).toHaveBeenCalledWith(
      'COALESCE(saldo.cantidad, 0) / NULLIF(minimo.minimoBase, 0)', 'ASC', 'NULLS FIRST',
    );
    expect(builder.limit).toHaveBeenCalledWith(10);
  });

  it('filtra un almacén activo o rechaza uno inexistente', async () => {
    const { handler, builder, existsBy } = setup();
    await handler.execute(new ResumenReposicionQuery('a1'));
    expect(existsBy).toHaveBeenCalledWith({ id: 'a1', activo: true });
    expect(builder.andWhere).toHaveBeenCalledWith('almacen.id = :almacenId', { almacenId: 'a1' });
    const inactive = setup(false);
    await expect(inactive.handler.execute(new ResumenReposicionQuery('a2'))).rejects.toBeInstanceOf(NotFoundException);
    expect(inactive.builder.getRawMany).not.toHaveBeenCalled();
  });
});
