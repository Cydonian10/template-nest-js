import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { VarianteProducto } from '../../inventory/entities/variante-producto.entity.js';
import { Unidad } from '../../inventory/entities/unidad.entity.js';
import { Venta } from './venta.entity.js';
import { DescuentoVenta } from './descuento-venta.entity.js';
import { DetalleDevolucionVenta } from './detalle-devolucion-venta.entity.js';

@Entity('detalles_venta')
@Check(
  'CHK_detalles_venta_cantidades',
  '"cantidad" > 0 AND "factor_a_base" > 0 AND "cantidad_base" > 0',
)
@Check(
  'CHK_detalles_venta_importes',
  '"precio_unitario" >= 0 AND "subtotal" >= 0 AND "descuento_promocional" >= 0 AND "descuento_manual" >= 0 AND "total" >= 0',
)
export class DetalleVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venta, (venta) => venta.detalles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Relation<Venta>;

  @RelationId((detalle: DetalleVenta) => detalle.venta)
  ventaId: string;

  @ManyToOne(() => VarianteProducto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @ManyToOne(() => Unidad, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unidad_id' })
  unidad: Relation<Unidad>;

  @Column({ type: 'numeric', precision: 20, scale: 6 })
  cantidad: string;

  @Column({ name: 'factor_a_base', type: 'numeric', precision: 20, scale: 8 })
  factorABase: string;

  @Column({ name: 'cantidad_base', type: 'numeric', precision: 24, scale: 6 })
  cantidadBase: string;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 18, scale: 2 })
  precioUnitario: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  subtotal: string;

  @Column({
    name: 'descuento_promocional',
    type: 'numeric',
    precision: 18,
    scale: 2,
  })
  descuentoPromocional: string;

  @Column({
    name: 'descuento_manual',
    type: 'numeric',
    precision: 18,
    scale: 2,
  })
  descuentoManual: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  total: string;

  @OneToMany(() => DescuentoVenta, (descuento) => descuento.detalle)
  descuentos: Relation<DescuentoVenta[]>;

  @OneToMany(() => DetalleDevolucionVenta, (detalle) => detalle.detalleVenta)
  devoluciones: Relation<DetalleDevolucionVenta[]>;
}
