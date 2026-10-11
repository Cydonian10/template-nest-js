import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DetalleCompra } from './detalle-compra.entity.js';
import { MovimientoInventario } from './movimiento-inventario.entity.js';
import { VarianteProducto } from './variante-producto.entity.js';
import { Unidad } from './unidad.entity.js';

@Entity('detalle_movimiento')
@Check('CHK_detalle_movimiento_factor_positivo', '"factor_a_base" > 0')
@Check(
  'CHK_detalle_movimiento_cantidad_no_cero',
  '"cantidad" <> 0 AND "cantidad_base" <> 0',
)
@Check('CHK_detalle_movimiento_mismo_signo', '"cantidad" * "cantidad_base" > 0')
@Check(
  'CHK_detalle_movimiento_costo_total_no_negativo',
  '"costo_total" IS NULL OR "costo_total" >= 0',
)
export class DetalleMovimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MovimientoInventario, (movimiento) => movimiento.detalles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'movimiento_id' })
  movimiento: Relation<MovimientoInventario>;

  @RelationId((detalle: DetalleMovimiento) => detalle.movimiento)
  movimientoId: string;

  @ManyToOne(
    () => VarianteProducto,
    (variante) => variante.detallesMovimiento,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @RelationId((detalle: DetalleMovimiento) => detalle.variante)
  varianteId: string;

  @ManyToOne(() => Unidad, (unidad) => unidad.detallesMovimiento, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'unidad_id' })
  unidad: Relation<Unidad>;

  @RelationId((detalle: DetalleMovimiento) => detalle.unidad)
  unidadId: string;

  @ManyToOne(() => DetalleCompra, (compra) => compra.detallesMovimiento, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'detalle_compra_id' })
  detalleCompra: Relation<DetalleCompra> | null;

  @RelationId((detalle: DetalleMovimiento) => detalle.detalleCompra)
  detalleCompraId: string | null;

  @Column({ type: 'numeric', precision: 20, scale: 6 })
  cantidad: string;

  @Column({ name: 'factor_a_base', type: 'numeric', precision: 20, scale: 8 })
  factorABase: string;

  @Column({ name: 'cantidad_base', type: 'numeric', precision: 24, scale: 6 })
  cantidadBase: string;

  // Importe absoluto aplicado a este detalle; el tipo y la cantidad indican la dirección.
  @Column({
    name: 'costo_total',
    type: 'numeric',
    precision: 38,
    scale: 6,
    nullable: true,
  })
  costoTotal: string | null;
}
