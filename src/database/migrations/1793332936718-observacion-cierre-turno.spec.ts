import type { QueryRunner } from 'typeorm';
import { ObservacionCierreTurno1793332936718 } from './1793332936718-observacion-cierre-turno.js';

describe('ObservacionCierreTurno1793332936718', () => {
  it('agrega una columna nullable para conservar los turnos existentes', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new ObservacionCierreTurno1793332936718().up({
      query,
    } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "turnos_caja" ADD "observacion_cierre" character varying(500)',
    );
  });

  it('elimina la columna al revertir la migración', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new ObservacionCierreTurno1793332936718().down({
      query,
    } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "turnos_caja" DROP COLUMN "observacion_cierre"',
    );
  });
});
