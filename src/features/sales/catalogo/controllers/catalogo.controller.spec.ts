import type { QueryBus } from '@nestjs/cqrs';
import { ListarCatalogoSchema } from '../dto/listar-catalogo.dto.js';
import { ListarCatalogoQuery } from '../queries/listar-catalogo/listar-catalogo.query.js';
import { CatalogoController } from './catalogo.controller.js';

describe('CatalogoController', () => {
  it('valida el filtro y despacha la consulta paginada', async () => {
    // Preparar un filtro válido con búsqueda vacía y un resultado simulado.
    const filtros = ListarCatalogoSchema.parse({
      almacenId: '22222222-2222-4222-8222-222222222222',
      page: '2',
      limit: '5',
      q: '',
    });
    const pagina = { items: [], page: 2, limit: 5, totalItems: 0 };
    const execute = vi.fn().mockResolvedValue(pagina);
    const controller = new CatalogoController({
      execute,
    } as unknown as QueryBus);

    // El controlador conserva los parámetros y devuelve la página de la consulta.
    const resultado = await controller.listar(filtros);
    expect(resultado).toEqual(pagina);
    expect(execute).toHaveBeenCalledWith(new ListarCatalogoQuery(filtros));
  });

  it('rechaza filtros inválidos', () => {
    // El almacén y los límites deben ser válidos antes de consultar la base de datos.
    const resultado = ListarCatalogoSchema.safeParse({
      almacenId: 'inválido',
      page: 0,
      limit: 101,
    });
    expect(resultado.success).toBe(false);
  });
});
