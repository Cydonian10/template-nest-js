import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import type { AtributoProducto } from '../../../entities/atributo-producto.entity.js';
import type { Atributo } from '../../../entities/atributo.entity.js';
import type { Producto } from '../../../entities/producto.entity.js';
import { AgregarAtributoProductoCommand } from './agregar-atributo-producto.command.js';
import { AgregarAtributoProductoHandler } from './agregar-atributo-producto.handler.js';

describe('AgregarAtributoProductoHandler', () => {
  const command = new AgregarAtributoProductoCommand({
    productoId: 'p1',
    atributoId: 'a1',
  });

  const setup = (
    productoExiste = true,
    atributoExiste = true,
    yaAsignado = false,
  ) => {
    const productos = { existsBy: vi.fn().mockResolvedValue(productoExiste) };
    const atributos = { existsBy: vi.fn().mockResolvedValue(atributoExiste) };
    const asignacion = {
      productoId: 'p1',
      atributoId: 'a1',
    } as AtributoProducto;
    const atributosProducto = {
      existsBy: vi.fn().mockResolvedValue(yaAsignado),
      create: vi.fn().mockReturnValue(asignacion),
      insert: vi.fn().mockResolvedValue(undefined),
    };
    const handler = new AgregarAtributoProductoHandler(
      productos as unknown as Repository<Producto>,
      atributos as unknown as Repository<Atributo>,
      atributosProducto as unknown as Repository<AtributoProducto>,
    );
    return { handler, productos, atributos, atributosProducto, asignacion };
  };

  it('inserta una asociación nueva', async () => {
    const { handler, productos, atributos, atributosProducto, asignacion } =
      setup();
    await expect(handler.execute(command)).resolves.toBe(asignacion);
    expect(productos.existsBy).toHaveBeenCalledWith({ id: 'p1' });
    expect(atributos.existsBy).toHaveBeenCalledWith({ id: 'a1' });
    expect(atributosProducto.existsBy).toHaveBeenCalledWith({
      productoId: 'p1',
      atributoId: 'a1',
    });
    expect(atributosProducto.create).toHaveBeenCalledWith({
      productoId: 'p1',
      atributoId: 'a1',
    });
    expect(atributosProducto.insert).toHaveBeenCalledWith(asignacion);
  });

  it('devuelve 404 cuando el producto no existe', async () => {
    const { handler, atributos, atributosProducto } = setup(false);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(atributos.existsBy).not.toHaveBeenCalled();
    expect(atributosProducto.insert).not.toHaveBeenCalled();
  });

  it('devuelve 404 cuando el atributo no existe', async () => {
    const { handler, atributosProducto } = setup(true, false);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(atributosProducto.insert).not.toHaveBeenCalled();
  });

  it('devuelve 409 si ya está asociado', async () => {
    const { handler, atributosProducto } = setup(true, true, true);
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(atributosProducto.insert).not.toHaveBeenCalled();
  });

  it('traduce la colisión por concurrencia a 409', async () => {
    const { handler, atributosProducto } = setup();
    atributosProducto.insert.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' }),
    );
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('traduce la pérdida de una FK por concurrencia a 409', async () => {
    const { handler, atributosProducto } = setup();
    atributosProducto.insert.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23503' }),
    );
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
