import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Existencia } from '../../../entities/existencia.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
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

  function setup({
    active = true,
    rows = [],
    total = '0',
    variants = [],
  }: {
    active?: boolean;
    rows?: Record<string, unknown>[];
    total?: string;
    variants?: Record<string, unknown>[];
  } = {}) {
    const builder = (result: unknown, method: 'getRawOne' | 'getRawMany') => {
      const query = {
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        getRawOne: vi.fn(),
        getRawMany: vi.fn(),
      };
      query[method].mockResolvedValue(result);
      return query;
    };
    const countQuery = builder({ total: String(rows.length) }, 'getRawOne');
    const rowsQuery = {
      ...builder(rows, 'getRawMany'),
      clone: vi.fn(() => countQuery),
    };
    const totalQuery = builder({ totalValorCosto: total }, 'getRawOne');
    const existsBy = vi.fn().mockResolvedValue(active);
    const find = vi.fn().mockResolvedValue(variants);
    const handler = new ListarExistenciasHandler(
      { existsBy } as unknown as Repository<Almacen>,
      {
        createQueryBuilder: vi.fn(() => rowsQuery),
        find,
      } as unknown as Repository<VarianteProducto>,
      {
        createQueryBuilder: vi.fn(() => totalQuery),
      } as unknown as Repository<Existencia>,
    );
    return { handler, rowsQuery, countQuery, totalQuery, existsBy, find };
  }

  it('rechaza almacenes inexistentes o inactivos antes de consultar saldos', async () => {
    const { handler, existsBy, rowsQuery } = setup({ active: false });

    await expect(
      handler.execute(new ListarExistenciasQuery(filter)),
    ).rejects.toThrow(NotFoundException);
    expect(existsBy).toHaveBeenCalledWith({ id: almacenId, activo: true });
    expect(rowsQuery.getRawMany).not.toHaveBeenCalled();
  });

  it('devuelve vacío real sin almacenes activos y no intenta cargar relaciones', async () => {
    const { handler, existsBy, find } = setup();

    await expect(
      handler.execute(
        new ListarExistenciasQuery({ ...filter, almacenId: 'todos' }),
      ),
    ).resolves.toEqual({
      items: [],
      page: 1,
      limit: 20,
      totalItems: 0,
      totalValorCosto: '0',
    });
    expect(existsBy).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });

  it('pagina saldos de inactivos con stock y carga unidades y atributos una sola vez', async () => {
    const varianteId = '22222222-2222-4222-8222-222222222222';
    const saldo = {
      varianteId,
      almacenId,
      almacenNombre: 'Principal',
      cantidadBase: '24.000000',
      valorCosto: '120.000000',
      costoPromedioBase: '5.000000',
      costoRegistradoCero: false,
    };
    const variante = {
      id: varianteId,
      sku: 'CAM-NEG-M',
      activo: false,
      precio: '39.90',
      valores: [{ atributo: { id: 'color', nombre: 'Color' }, valor: 'Negro' }],
      producto: {
        id: 'p1',
        nombre: 'Camiseta',
        activo: true,
        unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
        unidades: [
          {
            unidad: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
            factorABase: '1',
          },
          {
            unidad: { id: 'u2', nombre: 'Caja', simbolo: 'cj' },
            factorABase: '12.00000000',
          },
        ],
      },
    };
    const { handler, rowsQuery, countQuery, totalQuery, find } = setup({
      rows: [
        saldo,
        {
          ...saldo,
          almacenId: 'a2',
          almacenNombre: 'Tienda',
          cantidadBase: '1.000000',
          valorCosto: '0',
          costoPromedioBase: '0.000000',
          costoRegistradoCero: true,
        },
      ],
      total: '120.000000',
      variants: [variante],
    });
    const response = await handler.execute(
      new ListarExistenciasQuery({
        ...filter,
        almacenId: 'todos',
        page: 2,
        limit: 2,
        q: 'cam%',
        productoId: filter.almacenId,
        disponibilidad: 'con_stock',
      }),
    );

    expect(response).toMatchObject({
      page: 2,
      limit: 2,
      totalItems: 2,
      totalValorCosto: '120.000000',
      items: [
        {
          producto: { nombre: 'Camiseta', unidadBase: { simbolo: 'u' } },
          variante: {
            sku: 'CAM-NEG-M',
            activo: false,
            precioVenta: '39.90',
            valores: [{ atributo: 'Color', valor: 'Negro' }],
          },
          cantidadBase: '24.000000',
          valorCosto: '120.000000',
          costoPromedioBase: '5.000000',
          unidadesSecundarias: [{ id: 'u2', factorABase: '12.00000000' }],
        },
        {
          almacen: { nombre: 'Tienda' },
          cantidadBase: '1.000000',
          costoPromedioBase: '0.000000',
          costoRegistradoCero: true,
        },
      ],
    });
    expect(rowsQuery.where).toHaveBeenCalledWith(
      '((variante.activo = true AND producto.activo = true) OR existencia.cantidad > 0)',
    );
    expect(rowsQuery.andWhere).toHaveBeenCalledWith(
      "(producto.nombre ILIKE :search ESCAPE '!' OR variante.sku ILIKE :search ESCAPE '!')",
      { search: '%cam!%%' },
    );
    expect(rowsQuery.andWhere).toHaveBeenCalledWith('existencia.cantidad > 0');
    expect(rowsQuery.andWhere).toHaveBeenCalledWith(
      'producto.id = :productoId',
      { productoId: filter.almacenId },
    );
    expect(rowsQuery.offset).toHaveBeenCalledWith(2);
    expect(rowsQuery.limit).toHaveBeenCalledWith(2);
    expect(countQuery.select).toHaveBeenCalledWith('COUNT(*)', 'total');
    expect(totalQuery.where).not.toHaveBeenCalled();
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('restringe filas y total al almacén elegido, pero no filtra el total por disponibilidad', async () => {
    const { handler, rowsQuery, totalQuery } = setup({ total: '70.000000' });
    await handler.execute(
      new ListarExistenciasQuery({ ...filter, disponibilidad: 'sin_stock' }),
    );

    expect(rowsQuery.andWhere).toHaveBeenCalledWith('almacen.id = :almacenId', {
      almacenId,
    });
    expect(rowsQuery.andWhere).toHaveBeenCalledWith(
      'COALESCE(existencia.cantidad, 0) = 0',
    );
    expect(totalQuery.where).toHaveBeenCalledWith('almacen.id = :almacenId', {
      almacenId,
    });
    expect(totalQuery.innerJoin).toHaveBeenCalledWith(
      'saldo.almacen',
      'almacen',
      'almacen.activo = true',
    );
  });

  it('incluye una variante activa sin existencia persistida como saldo cero', async () => {
    const varianteId = '22222222-2222-4222-8222-222222222222';
    const { handler, rowsQuery } = setup({
      rows: [
        {
          varianteId,
          almacenId,
          almacenNombre: 'Principal',
          cantidadBase: '0',
          valorCosto: '0',
          costoPromedioBase: null,
          costoRegistradoCero: false,
        },
      ],
      variants: [
        {
          id: varianteId,
          sku: 'CAM-BLA-M',
          activo: true,
          precio: '39.90',
          valores: [],
          producto: {
            id: 'p1',
            nombre: 'Camiseta',
            activo: true,
            unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
            unidades: [],
          },
        },
      ],
    });

    await expect(
      handler.execute(new ListarExistenciasQuery(filter)),
    ).resolves.toMatchObject({
      totalItems: 1,
      items: [
        {
          cantidadBase: '0',
          valorCosto: '0',
          costoPromedioBase: null,
          unidadesSecundarias: [],
        },
      ],
    });
    expect(rowsQuery.leftJoin).toHaveBeenCalledWith(
      Existencia,
      'existencia',
      'existencia.varianteId = variante.id AND existencia.almacenId = almacen.id',
    );
    expect(rowsQuery.innerJoin).toHaveBeenCalledWith(
      Almacen,
      'almacen',
      'almacen.activo = true',
    );
  });
});
