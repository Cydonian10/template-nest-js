import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { User } from '../../../../access-control/entities/user.entity.js';
import { Almacen } from '../../../entities/almacen.entity.js';
import { Unidad } from '../../../entities/unidad.entity.js';
import { VarianteProducto } from '../../../entities/variante-producto.entity.js';
import type { CreateMovimientoDto } from '../../dto/create-movimiento.dto.js';
import { CreateMovimientoSchema } from '../../dto/create-movimiento.dto.js';
import type { CrearMovimientoCommand } from './crear-movimiento.command.js';

/** Decimales exactos: cantidad (6) × factor (8) debe caber en base (6). */
export function cantidadEnBase(cantidad: string, factor: string): string {
  const convertir = (valor: string, decimales: number): bigint => {
    const match = /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(valor);
    if (!match || (match[2]?.length ?? 0) > decimales) {
      throw new BadRequestException('Factor o cantidad no válidos');
    }
    return BigInt(match[1] + (match[2] ?? '').padEnd(decimales, '0'));
  };
  const negativa = cantidad.startsWith('-');
  const unidades = convertir(negativa ? cantidad.slice(1) : cantidad, 6);
  const conversion = unidades * convertir(factor, 8);
  if (conversion % 100_000_000n !== 0n) {
    throw new BadRequestException(
      'La cantidad base requiere más de seis decimales',
    );
  }
  const base = conversion / 100_000_000n;
  if (base === 0n)
    throw new BadRequestException('La cantidad base debe ser distinta de cero');
  if (base >= 10n ** 24n) {
    throw new BadRequestException(
      'La cantidad base excede el límite del inventario',
    );
  }
  const texto = base.toString().padStart(7, '0');
  return `${negativa ? '-' : ''}${texto.slice(0, -6)}.${texto.slice(-6)}`;
}

export type DetalleValidado = {
  variante: VarianteProducto;
  unidad: Unidad;
  cantidad: string;
  factorABase: string;
  cantidadBase: string;
  costoUnitarioBase?: string;
};

export type MovimientoValidado = {
  input: CreateMovimientoDto;
  usuario: User;
  origen: Almacen;
  destino: Almacen | null;
  detalles: DetalleValidado[];
};

/** Lee y valida el catálogo dentro del EntityManager del futuro comando transaccional; no escribe. */
export async function validarMovimiento(
  manager: EntityManager,
  { userId, data }: CrearMovimientoCommand,
): Promise<MovimientoValidado> {
  const parsed = CreateMovimientoSchema.safeParse(data);
  if (!parsed.success)
    throw new BadRequestException('Datos de movimiento no válidos');
  const input = parsed.data;

  const usuario = await manager.findOneBy(User, { id: userId, active: true });
  if (!usuario) throw new UnauthorizedException();
  const origen = await manager.findOneBy(Almacen, {
    id: input.almacenOrigenId,
    activo: true,
  });
  if (!origen) throw new BadRequestException('Almacén de origen no disponible');
  const destino = input.almacenDestinoId
    ? await manager.findOneBy(Almacen, {
        id: input.almacenDestinoId,
        activo: true,
      })
    : null;
  if (input.tipo === 'traslado' && !destino) {
    throw new BadRequestException('Almacén de destino no disponible');
  }

  const ids = input.detalles.map(({ varianteId }) => varianteId);
  const variantes = await manager.find(VarianteProducto, {
    where: { id: In(ids) },
    relations: { producto: { unidadBase: true, unidades: { unidad: true } } },
  });
  if (variantes.length !== ids.length) {
    throw new BadRequestException('Variante no disponible');
  }
  const porId = new Map(variantes.map((variante) => [variante.id, variante]));
  const detalles = input.detalles.map((detalle): DetalleValidado => {
    const variante = porId.get(detalle.varianteId);
    if (!variante) throw new BadRequestException('Variante no disponible');
    const activo = variante.activo && variante.producto.activo;
    if (
      !activo &&
      (input.tipo === 'traslado' ||
        (!detalle.cantidad.startsWith('-') && input.tipo === 'ajuste'))
    ) {
      throw new BadRequestException(
        'No se puede aumentar ni trasladar catálogo inactivo',
      );
    }

    const producto = variante.producto;
    const esBase = detalle.unidadId === producto.unidadBase.id;
    const secundaria = producto.unidades.find(
      ({ unidad }) => unidad.id === detalle.unidadId,
    );
    const unidad = esBase ? producto.unidadBase : secundaria?.unidad;
    const factorABase = esBase ? '1' : secundaria?.factorABase;
    if (!unidad || !factorABase) {
      throw new BadRequestException('Unidad no válida para el producto');
    }
    return {
      variante,
      unidad,
      cantidad: detalle.cantidad,
      factorABase,
      cantidadBase: cantidadEnBase(detalle.cantidad, factorABase),
      ...(detalle.costoUnitarioBase !== undefined && {
        costoUnitarioBase: detalle.costoUnitarioBase,
      }),
    };
  });

  return { input, usuario, origen, destino, detalles };
}
