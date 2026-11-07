import type { DataSource } from 'typeorm';
import { ListarMovimientosCajaHandler } from './listar-movimientos.handler.js';
import { ListarMovimientosCajaQuery } from './listar-movimientos.query.js';

it('filtra por fecha real en Lima y pagina los resultados', async () => {
  // Comprobar límites inclusivos y parámetros, sin usar la fecha operativa del turno.
  const query = vi.fn().mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([{ id: 'm1' }]);
  const handler = new ListarMovimientosCajaHandler({ query } as unknown as DataSource);
  const resultado = await handler.execute(new ListarMovimientosCajaQuery({ desde: '2026-11-07', hasta: '2026-11-08', page: 2, limit: 20 }));
  expect(resultado).toEqual({ data: [{ id: 'm1' }], total: 1, page: 2, limit: 20 });
  expect(query.mock.calls[1][0]).toContain("AT TIME ZONE 'America/Lima'");
  expect(query.mock.calls[1][0]).toContain('m.fecha <');
  expect(query.mock.calls[1][1]).toEqual(['2026-11-07', '2026-11-08', 20, 20]);
});
