import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  EstadoMovimientoInventario,
  MovimientoInventario,
} from '../../../entities/movimiento-inventario.entity.js';
import { ListarHistorialMovimientosQuery } from './listar-historial-movimientos.query.js';

/** Comparar por día civil de Lima, que mantiene UTC−05 todo el año. */
function inicioDiaLima(dia: string): Date {
  return new Date(`${dia}T05:00:00.000Z`);
}

function finDiaLima(dia: string): Date {
  const siguiente = inicioDiaLima(dia);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  return siguiente;
}

function normalizarBusqueda(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .replace(/[!%_]/g, '!$&');
}

function textoSinTildes(columna: string): string {
  return `LOWER(TRANSLATE(${columna}, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))`;
}

@QueryHandler(ListarHistorialMovimientosQuery)
export class ListarHistorialMovimientosHandler
  implements IQueryHandler<ListarHistorialMovimientosQuery>
{
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly movimientos: Repository<MovimientoInventario>,
  ) {}

  async execute({ filter }: ListarHistorialMovimientosQuery): Promise<[MovimientoInventario[], number]> {
    // El total, los IDs de la página y sus detalles pertenecen al mismo snapshot.
    return this.movimientos.manager.transaction('REPEATABLE READ', async (manager) => {
      const repo = manager.getRepository(MovimientoInventario);
      const listado = repo
        .createQueryBuilder('movimiento')
        .where('movimiento.estado = :estado', {
          estado: EstadoMovimientoInventario.CONFIRMADO,
        });

      if (filter.tipo) {
        listado.andWhere('movimiento.tipo = :tipo', { tipo: filter.tipo });
      }
      if (filter.desde) {
        listado.andWhere('movimiento.fecha >= :desde', {
          desde: inicioDiaLima(filter.desde),
        });
      }
      if (filter.hasta) {
        listado.andWhere('movimiento.fecha < :hasta', {
          hasta: finDiaLima(filter.hasta),
        });
      }
      if (filter.q) {
        listado.leftJoin('movimiento.almacenOrigen', 'origen');
        listado.leftJoin('movimiento.almacenDestino', 'destino');
        listado.andWhere(
          `(
            movimiento.id::text LIKE :search ESCAPE '!'
            OR ${textoSinTildes('origen.nombre')} LIKE :search ESCAPE '!'
            OR ${textoSinTildes('destino.nombre')} LIKE :search ESCAPE '!'
            OR EXISTS (
              SELECT 1 FROM detalle_movimiento AS linea
              INNER JOIN variantes_producto AS variante ON variante.id = linea.variante_id
              INNER JOIN productos AS producto ON producto.id = variante.producto_id
              WHERE linea.movimiento_id = movimiento.id
                AND (${textoSinTildes('variante.sku')} LIKE :search ESCAPE '!'
                  OR ${textoSinTildes('producto.nombre')} LIKE :search ESCAPE '!')
            )
          )`,
          { search: `%${normalizarBusqueda(filter.q)}%` },
        );
      }

      const [pagina, total] = await listado
        .orderBy('movimiento.fecha', 'DESC')
        .addOrderBy('movimiento.id', 'DESC')
        .skip((filter.page - 1) * filter.limit)
        .take(filter.limit)
        .getManyAndCount();

      if (!pagina.length) return [[], total];

      // Cargar relaciones después de paginar: una unión con detalles antes del
      // límite multiplicaría movimientos y alteraría el recuento y la página.
      const movimientos = await repo.find({
        where: { id: In(pagina.map((movimiento) => movimiento.id)) },
        relations: { almacenOrigen: true, almacenDestino: true, detalles: true },
      });
      const porId = new Map(movimientos.map((movimiento) => [movimiento.id, movimiento]));
      return [
        pagina.map((movimiento) => {
          const completo = porId.get(movimiento.id);
          if (!completo) throw new Error(`Movimiento no encontrado: ${movimiento.id}`);
          return completo;
        }),
        total,
      ];
    });
  }
}
