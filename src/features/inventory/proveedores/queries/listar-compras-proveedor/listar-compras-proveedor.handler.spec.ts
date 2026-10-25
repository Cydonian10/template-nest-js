import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { Compra } from '../../../entities/compra.entity.js';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { ListarComprasProveedorHandler } from './listar-compras-proveedor.handler.js';
import { ListarComprasProveedorQuery } from './listar-compras-proveedor.query.js';

describe('ListarComprasProveedorHandler', () => {
  const id = '12345678-1234-4234-8234-123456789012';
  const proveedor = {
    id,
    nombre: 'Acero Norte',
    documento: null,
    contacto: null,
  };
  const compra = {
    id: 'c1',
    fecha: '2026-10-20',
    tipoDocumento: 'factura',
    serieDocumento: 'F001',
    numeroDocumento: '12',
    totalDocumento: '12.30',
    observaciones: 'No exponer en el listado',
  };

  function setup({
    encontrado = proveedor,
    cantidad = '2',
    total = '123456789012345678.123456',
    pagina = [compra],
  }: {
    encontrado?: typeof proveedor | null;
    cantidad?: string;
    total?: string | null;
    pagina?: (typeof compra)[];
  } = {}) {
    const builder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      clone: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      getRawOne: vi
        .fn()
        .mockResolvedValue({
          cantidadCompras: cantidad,
          totalDocumento: total,
        }),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(pagina),
    };
    const proveedores = { findOneBy: vi.fn().mockResolvedValue(encontrado) };
    const compras = { createQueryBuilder: vi.fn().mockReturnValue(builder) };
    const getRepository = vi.fn((entity: typeof Compra | typeof Proveedor) =>
      entity === Proveedor ? proveedores : compras,
    );
    const transaction = vi.fn(
      async (
        _isolation: string,
        work: (manager: {
          getRepository: typeof getRepository;
        }) => Promise<unknown>,
      ) => work({ getRepository }),
    );
    const handler = new ListarComprasProveedorHandler({
      manager: { transaction },
    } as unknown as Repository<Compra>);
    return { handler, builder, proveedores, compras, transaction };
  }

  it('calcula el resumen del rango completo antes de paginar y conserva decimales exactos', async () => {
    const { handler, builder, transaction } = setup();
    const filter = {
      desde: '2026-10-01',
      hasta: '2026-10-31',
      page: 2,
      limit: 1,
    };
    const result = await handler.execute(
      new ListarComprasProveedorQuery(id, filter),
    );

    expect(transaction).toHaveBeenCalledWith(
      'REPEATABLE READ',
      expect.any(Function),
    );
    expect(builder.where).toHaveBeenCalledWith('compra.proveedor_id = :id', {
      id,
    });
    expect(builder.andWhere).toHaveBeenCalledWith('compra.fecha >= :desde', {
      desde: filter.desde,
    });
    expect(builder.andWhere).toHaveBeenCalledWith('compra.fecha <= :hasta', {
      hasta: filter.hasta,
    });
    expect(builder.getRawOne.mock.invocationCallOrder[0]).toBeLessThan(
      builder.skip.mock.invocationCallOrder[0],
    );
    expect(builder.orderBy).toHaveBeenCalledWith('compra.fecha', 'DESC');
    expect(builder.addOrderBy).toHaveBeenCalledWith('compra.id', 'DESC');
    expect(builder.skip).toHaveBeenCalledWith(1);
    expect(builder.take).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      proveedor,
      resumen: {
        cantidadCompras: 2,
        totalDocumento: '123456789012345678.123456',
      },
      data: [
        {
          id: compra.id,
          fecha: compra.fecha,
          tipoDocumento: compra.tipoDocumento,
          serieDocumento: compra.serieDocumento,
          numeroDocumento: compra.numeroDocumento,
          totalDocumento: compra.totalDocumento,
        },
      ],
      meta: { page: 2, limit: 1, total: 2, totalPages: 2 },
    });
    expect(builder.addSelect).toHaveBeenCalledWith(
      'CASE WHEN COUNT(*) = COUNT(compra.totalDocumento) THEN COALESCE(SUM(compra.totalDocumento), 0)::text ELSE NULL END',
      'totalDocumento',
    );
  });

  it('mantiene total nulo ante una compra sin monto y cero en un intervalo vacío', async () => {
    const filter = { page: 1, limit: 20 };
    const incompleto = setup({ cantidad: '2', total: null });
    const result = await incompleto.handler.execute(
      new ListarComprasProveedorQuery(id, filter),
    );
    expect(result.resumen).toEqual({
      cantidadCompras: 2,
      totalDocumento: null,
    });
    expect(incompleto.builder.andWhere).not.toHaveBeenCalled();

    const vacio = setup({ cantidad: '0', total: '0', pagina: [] });
    expect(
      await vacio.handler.execute(new ListarComprasProveedorQuery(id, filter)),
    ).toMatchObject({
      resumen: { cantidadCompras: 0, totalDocumento: '0' },
      data: [],
      meta: { total: 0 },
    });
  });

  it('rechaza proveedores inexistentes antes de consultar compras', async () => {
    const { handler, compras, proveedores } = setup({ encontrado: null });
    await expect(
      handler.execute(
        new ListarComprasProveedorQuery(id, { page: 1, limit: 20 }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(proveedores.findOneBy).toHaveBeenCalledWith({ id });
    expect(compras.createQueryBuilder).not.toHaveBeenCalled();
  });
});
