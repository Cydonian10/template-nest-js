import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { Producto } from '../../../entities/producto.entity.js';
import type { UnidadProducto } from '../../../entities/unidad-producto.entity.js';
import type { Unidad } from '../../../entities/unidad.entity.js';
import { AgregarUnidadProductoCommand } from './agregar-unidad-producto.command.js';
import { AgregarUnidadProductoHandler } from './agregar-unidad-producto.handler.js';

describe('AgregarUnidadProductoHandler', () => {
  const command = new AgregarUnidadProductoCommand({
    productoId: 'p1',
    unidadId: 'u1',
    factorABase: '12.50000000',
  });

  const setup = (
    productoExiste = true,
    unidadExiste = true,
    yaAsignada = false,
  ) => {
    const productos = {
      findOne: vi
        .fn()
        .mockResolvedValue(
          productoExiste ? { id: 'p1', unidadBase: { id: 'base' } } : null,
        ),
    };
    const unidades = { existsBy: vi.fn().mockResolvedValue(unidadExiste) };
    const asignacion = {
      id: 'as1',
      producto: { id: 'p1' },
      unidad: { id: 'u1' },
      factorABase: '12.50000000',
    } as UnidadProducto;
    const unidadesProducto = {
      existsBy: vi.fn().mockResolvedValue(yaAsignada),
      create: vi.fn().mockReturnValue(asignacion),
      save: vi.fn().mockResolvedValue(asignacion),
    };
    const handler = new AgregarUnidadProductoHandler(
      productos as unknown as Repository<Producto>,
      unidades as unknown as Repository<Unidad>,
      unidadesProducto as unknown as Repository<UnidadProducto>,
    );
    return { handler, productos, unidades, unidadesProducto, asignacion };
  };

  it('guarda la asociación y conserva el factor decimal', async () => {
    const { handler, productos, unidades, unidadesProducto, asignacion } =
      setup();
    await expect(handler.execute(command)).resolves.toBe(asignacion);
    expect(productos.findOne).toHaveBeenCalledWith({
      where: { id: 'p1' },
      relations: { unidadBase: true },
    });
    expect(unidades.existsBy).toHaveBeenCalledWith({ id: 'u1' });
    expect(unidadesProducto.existsBy).toHaveBeenCalledWith({
      producto: { id: 'p1' },
      unidad: { id: 'u1' },
    });
    expect(unidadesProducto.create).toHaveBeenCalledWith({
      producto: { id: 'p1' },
      unidad: { id: 'u1' },
      factorABase: '12.50000000',
    });
    expect(unidadesProducto.save).toHaveBeenCalledWith(asignacion);
  });

  it('devuelve 404 si el producto o la unidad no existe', async () => {
    const sinProducto = setup(false);
    await expect(sinProducto.handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(sinProducto.unidades.existsBy).not.toHaveBeenCalled();

    const sinUnidad = setup(true, false);
    await expect(sinUnidad.handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(sinUnidad.unidadesProducto.save).not.toHaveBeenCalled();
  });

  it('devuelve 409 si la asociación ya existe', async () => {
    const { handler, unidadesProducto } = setup(true, true, true);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(unidadesProducto.save).not.toHaveBeenCalled();
  });

  it('impide asociar la unidad base como secundaria', async () => {
    const { handler, unidades } = setup();
    await expect(
      handler.execute(
        new AgregarUnidadProductoCommand({
          productoId: 'p1',
          unidadId: 'base',
          factorABase: '1',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(unidades.existsBy).not.toHaveBeenCalled();
  });

  it.each(['23505', '23503'])(
    'traduce el error de DB %s a 409',
    async (code) => {
      const { handler, unidadesProducto } = setup();
      unidadesProducto.save.mockRejectedValue(
        new QueryFailedError('INSERT', [], { code }),
      );
      await expect(handler.execute(command)).rejects.toBeInstanceOf(
        ConflictException,
      );
    },
  );
});
