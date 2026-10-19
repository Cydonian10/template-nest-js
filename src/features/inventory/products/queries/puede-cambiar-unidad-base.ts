import { Not, type EntityManager } from 'typeorm';
import { DetalleMovimiento } from '../../entities/detalle-movimiento.entity.js';
import { Existencia } from '../../entities/existencia.entity.js';

export async function puedeCambiarUnidadBase(
  manager: EntityManager,
  productoId: string,
): Promise<boolean> {
  const tieneMovimientos = await manager.exists(DetalleMovimiento, {
    where: { variante: { producto: { id: productoId } } },
  });
  if (tieneMovimientos) return false;

  const tieneSaldo = await manager.exists(Existencia, {
    where: {
      variante: { producto: { id: productoId } },
      cantidad: Not('0'),
    },
  });
  return !tieneSaldo;
}
