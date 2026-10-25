import { describe, expect, it, vi } from 'vitest';
import { FilterHistorialMovimientosSchema } from '../../dto/filter-historial-movimientos.dto.js';
import { ListarHistorialMovimientosHandler } from './listar-historial-movimientos.handler.js';
import { ListarHistorialMovimientosQuery } from './listar-historial-movimientos.query.js';

function escenario(pagina: { id: string }[] = [], total = 0) {
  const builder = {
    where: vi.fn(),
    andWhere: vi.fn(),
    leftJoin: vi.fn(),
    orderBy: vi.fn(),
    addOrderBy: vi.fn(),
    skip: vi.fn(),
    take: vi.fn(),
    getManyAndCount: vi.fn().mockResolvedValue([pagina, total]),
  };
  for (const method of ['where', 'andWhere', 'leftJoin', 'orderBy', 'addOrderBy', 'skip', 'take'] as const) {
    builder[method].mockReturnValue(builder);
  }
  const repo = {
    createQueryBuilder: vi.fn().mockReturnValue(builder),
    find: vi.fn().mockResolvedValue([...pagina].reverse()),
  };
  const movimientos = {
    manager: {
      transaction: vi.fn().mockImplementation(async (_level, work) => work({ getRepository: () => repo })),
    },
  };
  return { builder, repo, movimientos };
}

describe('ListarHistorialMovimientosHandler', () => {
  it('filtra confirmados, pagina antes de cargar detalles y conserva el orden', async () => {
    const { builder, repo, movimientos } = escenario([{ id: 'b' }, { id: 'a' }], 5);
    const handler = new ListarHistorialMovimientosHandler(movimientos as never);
    const resultado = await handler.execute(
      new ListarHistorialMovimientosQuery({ page: 2, limit: 2, tipo: 'ingreso' }),
    );

    expect(movimientos.manager.transaction).toHaveBeenCalledWith('REPEATABLE READ', expect.any(Function));
    expect(builder.where).toHaveBeenCalledWith('movimiento.estado = :estado', { estado: 'confirmado' });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.tipo = :tipo', { tipo: 'ingreso' });
    expect(builder.orderBy).toHaveBeenCalledWith('movimiento.fecha', 'DESC');
    expect(builder.addOrderBy).toHaveBeenCalledWith('movimiento.id', 'DESC');
    expect(builder.skip).toHaveBeenCalledWith(2);
    expect(builder.take).toHaveBeenCalledWith(2);
    expect(repo.find).toHaveBeenCalledWith({
      where: { id: expect.objectContaining({ _value: ['b', 'a'] }) },
      relations: { almacenOrigen: true, almacenDestino: true, detalles: true },
    });
    expect(resultado).toEqual([[{ id: 'b' }, { id: 'a' }], 5]);
  });

  it('convierte límites de días de Lima a UTC y rechaza filtros de fecha invertidos', async () => {
    const { builder, movimientos } = escenario();
    await new ListarHistorialMovimientosHandler(movimientos as never).execute(
      new ListarHistorialMovimientosQuery(
        FilterHistorialMovimientosSchema.parse({ desde: '2026-10-24', hasta: '2026-10-24' }),
      ),
    );
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha >= :desde', {
      desde: new Date('2026-10-24T05:00:00.000Z'),
    });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha < :hasta', {
      hasta: new Date('2026-10-25T05:00:00.000Z'),
    });
    expect(FilterHistorialMovimientosSchema.safeParse({ desde: '2026-10-25', hasta: '2026-10-24' }).success).toBe(false);
  });

  it('busca UUID, almacenes, SKU y producto con escape y sin tildes', async () => {
    const { builder, repo, movimientos } = escenario();
    await new ListarHistorialMovimientosHandler(movimientos as never).execute(
      new ListarHistorialMovimientosQuery(
        FilterHistorialMovimientosSchema.parse({ q: '  Árbol_%  ' }),
      ),
    );
    const [sql, params] = builder.andWhere.mock.calls[0] as [string, { search: string }];
    expect(sql).toContain('movimiento.id::text LIKE :search');
    expect(sql).toContain('origen.nombre');
    expect(sql).toContain('destino.nombre');
    expect(sql).toContain('variante.sku');
    expect(sql).toContain('producto.nombre');
    expect(sql).toContain('EXISTS');
    expect(sql).toContain("ESCAPE '!'");
    expect(params.search).toBe('%arbol!_!%%');
    expect(builder.leftJoin).toHaveBeenCalledTimes(2);
    expect(repo.find).not.toHaveBeenCalled();
  });
});
