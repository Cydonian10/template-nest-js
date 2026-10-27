import type { EntityManager, Repository } from 'typeorm';
import { Compra } from '../../../entities/compra.entity.js';
import { PeriodoActividadSchema } from '../../../resumen-actividad.js';
import { ResumenInventarioHandler } from './resumen-inventario.handler.js';
import { ResumenInventarioQuery } from './resumen-inventario.query.js';

describe('ResumenInventarioHandler', () => {
  it('cuenta documentos pendientes y recibidos globalmente, rellena ceros y limita recientes', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ fecha: '2026-10-25', cantidad: '2' }])
      .mockResolvedValueOnce([
        { id: 'pendiente', recibida: false, totalDocumento: null },
        { id: 'recibida', recibida: true, totalDocumento: '20.000000' },
      ]);
    const transaction = vi.fn(async (_level: string, work: (manager: EntityManager) => Promise<unknown>) =>
      work({ query } as unknown as EntityManager),
    );
    const handler = new ResumenInventarioHandler({ manager: { transaction } } as Repository<Compra>);
    const periodo = { desde: '2026-10-24', hasta: '2026-10-26' };
    await expect(handler.execute(new ResumenInventarioQuery(periodo))).resolves.toEqual({
      total: 2,
      porDia: [
        { fecha: '2026-10-24', cantidad: 0 },
        { fecha: '2026-10-25', cantidad: 2 },
        { fecha: '2026-10-26', cantidad: 0 },
      ],
      recientes: [
        { id: 'pendiente', recibida: false, totalDocumento: null },
        { id: 'recibida', recibida: true, totalDocumento: '20.000000' },
      ],
    });
    expect(transaction).toHaveBeenCalledWith('REPEATABLE READ', expect.any(Function));
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain('FROM "compras" c WHERE c."fecha" BETWEEN $1::date AND $2::date');
    expect(query.mock.calls[1][0]).toContain('m."estado" = \'confirmado\'');
    expect(query.mock.calls[1][0]).toContain('ORDER BY c."fecha" DESC, c."id" DESC LIMIT 5');
    expect(query.mock.calls[1][1]).toEqual(['2026-10-24', '2026-10-26']);
  });

  it('rechaza fechas inexistentes, ausentes o invertidas', () => {
    for (const input of [
      {}, { desde: '2026-10-25' },
      { desde: '2026-02-30', hasta: '2026-03-01' },
      { desde: '2026-10-26', hasta: '2026-10-25' },
    ]) {
      expect(PeriodoActividadSchema.safeParse(input).success).toBe(false);
    }
  });
});
