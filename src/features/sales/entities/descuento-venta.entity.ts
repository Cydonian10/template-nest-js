import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { Venta } from './venta.entity.js';
import { DetalleVenta } from './detalle-venta.entity.js';
import { Promocion } from './promocion.entity.js';

export enum OrigenDescuentoVenta {
  PROMOCION = 'promocion',
  MANUAL = 'manual',
}

@Entity('descuentos_venta')
@Check('CHK_descuentos_venta_importe', '"importe" > 0')
@Check(
  'CHK_descuentos_venta_origen',
  '("origen" = \'promocion\' AND "promocion_id" IS NOT NULL AND "usuario_id" IS NULL) OR ("origen" = \'manual\' AND "promocion_id" IS NULL AND "usuario_id" IS NOT NULL)',
)
export class DescuentoVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venta, (venta) => venta.descuentos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Relation<Venta>;

  @ManyToOne(() => DetalleVenta, (detalle) => detalle.descuentos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'detalle_venta_id' })
  detalle: Relation<DetalleVenta> | null;

  @ManyToOne(() => Promocion, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'promocion_id' })
  promocion: Relation<Promocion> | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User> | null;

  @Column({
    type: 'enum',
    enum: OrigenDescuentoVenta,
    enumName: 'origen_descuento_venta',
  })
  origen: OrigenDescuentoVenta;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;
}
