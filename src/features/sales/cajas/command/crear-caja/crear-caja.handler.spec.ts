import type { EntityManager } from 'typeorm';
import type { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Caja } from '../../../entities/caja.entity.js';
import { CrearCajaCommand } from './crear-caja.command.js';
import { CrearCajaHandler } from './crear-caja.handler.js';

describe('CrearCajaHandler', () => {
  it.each([
    ['1', 'C0001'],
    ['10', 'C0010'],
    ['10000', 'C10000'],
  ])(
    'genera el código %s como %s y guarda la caja',
    async (siguiente, codigo) => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ siguiente }]);
      const caja = { id: 'id', codigo, nombre: 'Principal', activo: true };
      const save = vi.fn().mockResolvedValue(caja);
      const manager = { query, save } as unknown as EntityManager;
      const unitOfWork = {
        execute: (work: (manager: EntityManager) => Promise<unknown>) =>
          work(manager),
      } as unknown as UnitOfWork;
      const handler = new CrearCajaHandler(unitOfWork);

      await expect(
        handler.execute(new CrearCajaCommand({ nombre: 'Principal' })),
      ).resolves.toEqual(caja);
      expect(query).toHaveBeenNthCalledWith(
        1,
        'SELECT pg_advisory_xact_lock($1, $2)',
        [20261029, 1],
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('MAX(SUBSTRING(codigo FROM 2)::numeric)'),
      );
      expect(save).toHaveBeenCalledWith(Caja, {
        nombre: 'Principal',
        codigo,
        activo: true,
      });
    },
  );
});
