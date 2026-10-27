import { NotFoundException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import { MovimientoInventario } from '../../../entities/movimiento-inventario.entity.js';
import { FilterResumenSalidasSchema } from '../../dto/resumen-salidas.dto.js';
import { ResumenSalidasHandler } from './resumen-salidas.handler.js';
import { ResumenSalidasQuery } from './resumen-salidas.query.js';

describe('ResumenSalidasHandler', () => {
  function setup(activo = true) {
    const query = vi.fn()
      .mockResolvedValueOnce([{ fecha: '2026-10-25', cantidad: '1' }])
      .mockResolvedValueOnce([{ id: 's1', cantidadDetalles: '3', fecha: '2026-10-25 23:59:59-05' }]);
    const existsBy = vi.fn().mockResolvedValue(activo);
    const transaction = vi.fn(async (_level: string, work: (manager: EntityManager) => Promise<unknown>) =>
      work({ query, getRepository: () => ({ existsBy }) } as unknown as EntityManager),
    );
    const handler = new ResumenSalidasHandler({ manager: { transaction } } as Repository<MovimientoInventario>);
    return { handler, query, existsBy };
  }

  it('cuenta solo salidas confirmadas en días inclusivos de Lima y filtra almacén origen', async () => {
    const { handler, query, existsBy } = setup();
    const filter = { almacenId: '11111111-1111-4111-8111-111111111111', desde: '2026-10-24', hasta: '2026-10-26' };
    await expect(handler.execute(new ResumenSalidasQuery(filter))).resolves.toEqual({
      total: 1,
      porDia: [
        { fecha: '2026-10-24', cantidad: 0 },
        { fecha: '2026-10-25', cantidad: 1 },
        { fecha: '2026-10-26', cantidad: 0 },
      ],
      recientes: [{ id: 's1', cantidadDetalles: 3, fecha: '2026-10-25 23:59:59-05' }],
    });
    expect(existsBy).toHaveBeenCalledWith({ id: filter.almacenId, activo: true });
    expect(query.mock.calls[0][0]).toContain("AT TIME ZONE 'America/Lima'");
    expect(query.mock.calls[0][0]).toContain("m.\"tipo\" = 'salida' AND m.\"estado\" = 'confirmado'");
    expect(query.mock.calls[0][1]).toEqual([filter.desde, filter.hasta, filter.almacenId]);
    expect(query.mock.calls[1][0]).toContain('ORDER BY m."fecha" DESC, m."id" DESC LIMIT 5');
  });

  it('usa NULL al consultar todos para no castear "todos" a UUID', async () => {
    const { handler, query, existsBy } = setup();
    await handler.execute(new ResumenSalidasQuery({ almacenId: 'todos', desde: '2026-10-25', hasta: '2026-10-25' }));
    expect(existsBy).not.toHaveBeenCalled();
    expect(query.mock.calls[0][1]).toEqual(['2026-10-25', '2026-10-25', null]);
  });

  it('rechaza almacén inactivo y fechas inválidas', async () => {
    const { handler, query } = setup(false);
    await expect(handler.execute(new ResumenSalidasQuery({ almacenId: 'a1', desde: '2026-10-25', hasta: '2026-10-25' }))).rejects.toBeInstanceOf(NotFoundException);
    expect(query).not.toHaveBeenCalled();
    for (const input of [
      { desde: '2026-10-25', hasta: '2026-10-25' },
      { almacenId: 'todos', desde: '2026-02-30', hasta: '2026-03-01' },
      { almacenId: 'todos', desde: '2026-10-26', hasta: '2026-10-25' },
    ]) expect(FilterResumenSalidasSchema.safeParse(input).success).toBe(false);
  });
});
