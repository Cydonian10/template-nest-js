import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import { CreateMovimientoSchema } from '../../dto/create-movimiento.dto.js';
import type { CreateMovimientoDto } from '../../dto/create-movimiento.dto.js';
import { CrearMovimientoCommand } from './crear-movimiento.command.js';
import { cantidadEnBase, validarMovimiento } from './validar-movimiento.js';

const origenId = '550e8400-e29b-41d4-a716-446655440000';
const destinoId = '550e8400-e29b-41d4-a716-446655440001';
const varianteId = '550e8400-e29b-41d4-a716-446655440002';
const unidadId = '550e8400-e29b-41d4-a716-446655440003';
const cajaId = '550e8400-e29b-41d4-a716-446655440004';
const otraId = '550e8400-e29b-41d4-a716-446655440005';
const idempotenciaClave = '550e8400-e29b-41d4-a716-446655440006';

const salida: CreateMovimientoDto = {
  tipo: 'salida',
  idempotenciaClave,
  almacenOrigenId: origenId,
  detalles: [{ varianteId, unidadId, cantidad: '2' }],
};

function setup({ activo = true, productoActivo = true } = {}) {
  const usuario = { id: 'u1', active: true };
  const origen = { id: origenId, activo: true };
  const destino = { id: destinoId, activo: true };
  const variante = {
    id: varianteId,
    activo,
    producto: {
      activo: productoActivo,
      unidadBase: { id: unidadId, nombre: 'Unidad' },
      unidades: [
        { unidad: { id: cajaId, nombre: 'Caja' }, factorABase: '12.00000000' },
      ],
    },
  };
  const manager = {
    findOneBy: vi.fn().mockImplementation((entity, options: { id: string }) => {
      if (entity === User) return usuario;
      if (entity === Almacen) return options.id === origenId ? origen : destino;
      return null;
    }),
    find: vi.fn().mockResolvedValue([variante]),
    save: vi.fn(),
    query: vi.fn(),
  };
  const validate = (data: CreateMovimientoDto) =>
    validarMovimiento(
      manager as unknown as EntityManager,
      new CrearMovimientoCommand('u1', data),
    );
  return { manager, validate, usuario, origen, destino, variante };
}

describe('CreateMovimientoSchema', () => {
  it('acepta costo cero explícito en ajuste positivo y prohíbe costo en reducciones', () => {
    const ajuste = {
      ...salida,
      tipo: 'ajuste',
      motivo: 'Diferencia física',
      detalles: [
        { ...salida.detalles[0], cantidad: '1', costoUnitarioBase: '0' },
      ],
    };
    expect(CreateMovimientoSchema.safeParse(ajuste).success).toBe(true);
    expect(
      CreateMovimientoSchema.safeParse({
        ...ajuste,
        detalles: [{ ...ajuste.detalles[0], cantidad: '-1' }],
      }).success,
    ).toBe(false);
    expect(
      CreateMovimientoSchema.safeParse({
        ...ajuste,
        detalles: [{ ...ajuste.detalles[0], costoUnitarioBase: undefined }],
      }).success,
    ).toBe(false);
  });

  it.each([
    { ...salida, tipo: 'ingreso' },
    { ...salida, idempotenciaClave: 'invalida' },
    { ...salida, almacenOrigenId: 'invalido' },
    { ...salida, almacenDestinoId: destinoId },
    { ...salida, detalles: [] },
    { ...salida, detalles: [salida.detalles[0], salida.detalles[0]] },
    { ...salida, detalles: [{ ...salida.detalles[0], cantidad: '-1' }] },
    { ...salida, detalles: [{ ...salida.detalles[0], cantidad: '0' }] },
    { ...salida, detalles: [{ ...salida.detalles[0], cantidad: '1.1234567' }] },
    {
      ...salida,
      detalles: [{ ...salida.detalles[0], costoUnitarioBase: '1' }],
    },
    { ...salida, usuarioId: 'otro' },
    { ...salida, tipo: 'traslado', almacenDestinoId: origenId },
    { ...salida, tipo: 'traslado' },
    { ...salida, tipo: 'ajuste', motivo: ' ' },
  ])(
    'rechaza solicitudes mal formadas sin consultas ni escrituras: %j',
    (data) => {
      expect(CreateMovimientoSchema.safeParse(data).success).toBe(false);
    },
  );
});

describe('validarMovimiento', () => {
  it('lee usuario, almacén y catálogo; convierte cajas sin escribir', async () => {
    const { manager, validate, variante, usuario, origen } = setup();
    const result = await validate({
      ...salida,
      detalles: [{ varianteId, unidadId: cajaId, cantidad: '1.5' }],
    });
    expect(result).toMatchObject({
      usuario,
      origen,
      destino: null,
      detalles: [
        {
          variante,
          cantidad: '1.5',
          cantidadBase: '18.000000',
          factorABase: '12.00000000',
        },
      ],
    });
    expect(manager.findOneBy).toHaveBeenCalledWith(User, {
      id: 'u1',
      active: true,
    });
    expect(manager.findOneBy).toHaveBeenCalledWith(Almacen, {
      id: origenId,
      activo: true,
    });
    expect(manager.find).toHaveBeenCalledWith(
      VarianteProducto,
      expect.objectContaining({
        relations: {
          producto: { unidadBase: true, unidades: { unidad: true } },
        },
      }),
    );
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('conserva el signo de un ajuste negativo y valida destino de traslado', async () => {
    const { validate, destino } = setup();
    const ajuste = await validate({
      ...salida,
      tipo: 'ajuste',
      motivo: 'Conteo',
      detalles: [{ varianteId, unidadId: cajaId, cantidad: '-2' }],
    });
    expect(ajuste.detalles[0].cantidadBase).toBe('-24.000000');
    const traslado = await validate({
      ...salida,
      tipo: 'traslado',
      almacenDestinoId: destinoId,
    });
    expect(traslado.destino).toBe(destino);
  });

  it('rechaza usuario, origen y destino no disponibles', async () => {
    const { manager, validate } = setup();
    manager.findOneBy.mockResolvedValueOnce(null);
    await expect(validate(salida)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    manager.findOneBy
      .mockResolvedValueOnce({ id: 'u1' })
      .mockResolvedValueOnce(null);
    await expect(validate(salida)).rejects.toBeInstanceOf(BadRequestException);

    manager.findOneBy
      .mockResolvedValueOnce({ id: 'u1' })
      .mockResolvedValueOnce({ id: origenId })
      .mockResolvedValueOnce(null);
    await expect(
      validate({ ...salida, tipo: 'traslado', almacenDestinoId: destinoId }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza variante ausente, unidad ajena y aumentos o traslados inactivos', async () => {
    const { manager, validate } = setup();
    manager.find.mockResolvedValueOnce([]);
    await expect(validate(salida)).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validate({
        ...salida,
        detalles: [{ varianteId, unidadId: otraId, cantidad: '1' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const inactive = setup({ activo: false });
    await expect(
      inactive.validate({
        ...salida,
        tipo: 'traslado',
        almacenDestinoId: destinoId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      inactive.validate({
        ...salida,
        tipo: 'ajuste',
        motivo: 'Conteo',
        detalles: [
          { varianteId, unidadId, cantidad: '1', costoUnitarioBase: '0' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      inactive.validate({
        ...salida,
        tipo: 'ajuste',
        motivo: 'Conteo',
        detalles: [{ varianteId, unidadId, cantidad: '-1' }],
      }),
    ).resolves.toBeDefined();
    await expect(
      setup({ productoActivo: false }).validate(salida),
    ).resolves.toBeDefined();
  });

  it('rechaza una conversión que requiere más de seis decimales', async () => {
    const { validate, variante } = setup();
    variante.producto.unidades[0].factorABase = '0.33333333';
    await expect(
      validate({
        ...salida,
        detalles: [{ varianteId, unidadId: cajaId, cantidad: '1' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valida el DTO también al invocar el comando directamente', async () => {
    const { manager } = setup();
    await expect(
      validarMovimiento(
        manager as unknown as EntityManager,
        new CrearMovimientoCommand('u1', {
          ...salida,
          tipo: 'ingreso',
        } as never),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.findOneBy).not.toHaveBeenCalled();
  });
});

describe('cantidadEnBase', () => {
  it('no usa aritmética binaria y conserva precisión y signo', () => {
    expect(cantidadEnBase('0.1', '0.10000000')).toBe('0.010000');
    expect(cantidadEnBase('-2.5', '12.00000000')).toBe('-30.000000');
    expect(cantidadEnBase('0.000001', '1')).toBe('0.000001');
  });

  it('rechaza factores inválidos y resultados con exceso de precisión', () => {
    expect(() => cantidadEnBase('1', '0')).toThrow(BadRequestException);
    expect(() => cantidadEnBase('1', '0.33333333')).toThrow(
      BadRequestException,
    );
  });
});
