import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '../../../../../shared/database/unit-of-work.js';
import { Caja } from '../../../entities/caja.entity.js';
import { CrearCajaCommand } from './crear-caja.command.js';

@CommandHandler(CrearCajaCommand)
export class CrearCajaHandler implements ICommandHandler<CrearCajaCommand> {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute({ data }: CrearCajaCommand): Promise<Caja> {
    return this.unitOfWork.execute(async (manager) => {
      // Serializa la generación de códigos hasta que termine la transacción.
      await manager.query(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [20261029, 1],
      );
      const rows: { siguiente: string }[] = await manager.query(
        `SELECT (COALESCE(MAX(SUBSTRING(codigo FROM 2)::numeric), 0) + 1)::text AS siguiente
         FROM cajas WHERE codigo ~ '^C[0-9]+$'`,
      );
      const codigo = `C${rows[0].siguiente.padStart(4, '0')}`;

      return manager.save(Caja, { nombre: data.nombre, codigo, activo: true });
    });
  }
}
