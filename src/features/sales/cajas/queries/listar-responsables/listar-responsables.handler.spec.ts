import type { DataSource } from 'typeorm';
import { ListarResponsablesHandler } from './listar-responsables.handler.js';

describe('ListarResponsablesHandler', () => {
  it('devuelve solo la identidad de usuarios y personas activas', async () => {
    const usuarios = [{ id: 'u1', nickName: 'Ana' }];
    const query = vi.fn().mockResolvedValue(usuarios);
    const handler = new ListarResponsablesHandler({ query } as unknown as DataSource);
    const resultado = await handler.execute();
    expect(resultado).toEqual(usuarios);
    expect(query.mock.calls[0][0]).toContain('u.active = true AND p.active = true');
  });
});
