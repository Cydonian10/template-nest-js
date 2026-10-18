import { NotFoundException, NotImplementedException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { FilterExistenciasSchema } from '../../dto/filter-existencias.dto.js';
import { ListarExistenciasHandler } from './listar-existencias.handler.js';
import { ListarExistenciasQuery } from './listar-existencias.query.js';

const almacenId = '11111111-1111-4111-8111-111111111111';

describe('FilterExistenciasSchema', () => {
  it('exige almacén explícito y admite filtros y paginación válidos', () => {
    expect(FilterExistenciasSchema.safeParse({}).success).toBe(false);
    expect(FilterExistenciasSchema.parse({ almacenId: 'todos' })).toEqual({
      almacenId: 'todos',
      page: 1,
      limit: 20,
      disponibilidad: 'todas',
    });
    expect(
      FilterExistenciasSchema.parse({
        almacenId,
        page: '2',
        limit: '10',
        q: '  CAM-NEG  ',
        productoId: almacenId,
        disponibilidad: 'sin_stock',
      }),
    ).toEqual({
      almacenId,
      page: 2,
      limit: 10,
      q: 'CAM-NEG',
      productoId: almacenId,
      disponibilidad: 'sin_stock',
    });
  });

  it.each([
    { almacenId: 'desconocido' },
    { almacenId: 'todos', page: '0' },
    { almacenId: 'todos', limit: '101' },
    { almacenId: 'todos', disponibilidad: 'agotado' },
    { almacenId: 'todos', productoId: 'no-uuid' },
    { almacenId: 'todos', q: 'x'.repeat(151) },
  ])('rechaza parámetros inválidos: %j', (params) => {
    expect(FilterExistenciasSchema.safeParse(params).success).toBe(false);
  });
});

describe('ListarExistenciasHandler', () => {
  const filter = FilterExistenciasSchema.parse({ almacenId });

  it('rechaza almacenes inexistentes o inactivos antes de consultar saldos', async () => {
    const existsBy = vi.fn().mockResolvedValue(false);
    const handler = new ListarExistenciasHandler({
      existsBy,
    } as unknown as Repository<Almacen>);

    await expect(
      handler.execute(new ListarExistenciasQuery(filter)),
    ).rejects.toThrow(NotFoundException);
    expect(existsBy).toHaveBeenCalledWith({ id: almacenId, activo: true });
  });

  it('no inventa saldos mientras la consulta real está pendiente', async () => {
    const existsBy = vi.fn().mockResolvedValue(true);
    const handler = new ListarExistenciasHandler({
      existsBy,
    } as unknown as Repository<Almacen>);

    await expect(
      handler.execute(new ListarExistenciasQuery(filter)),
    ).rejects.toThrow(NotImplementedException);
    await expect(
      handler.execute(
        new ListarExistenciasQuery({ ...filter, almacenId: 'todos' }),
      ),
    ).rejects.toThrow(NotImplementedException);
    expect(existsBy).toHaveBeenCalledTimes(1);
  });
});
