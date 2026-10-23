import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DetalleVenta } from './detalle-venta.entity.js';
import { DevolucionVenta } from './devolucion-venta.entity.js';

@Entity('detalles_devolucion_venta')
@Check(
  'CHK_detalles_devolucion_cantidad',
  '"cantidad" > 0 AND "cantidad_base" > 0',
)
@Check('CHK_detalles_devolucion_importe', '"importe" >= 0')
export class DetalleDevolucionVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DevolucionVenta, (devolucion) => devolucion.detalles, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Relation<DevolucionVenta>;

  @ManyToOne(() => DetalleVenta, (detalle) => detalle.devoluciones, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'detalle_venta_id' })
  detalleVenta: Relation<DetalleVenta>;

  @Column({ type: 'numeric', precision: 20, scale: 6 })
  cantidad: string;

  @Column({ name: 'cantidad_base', type: 'numeric', precision: 24, scale: 6 })
  cantidadBase: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;
}
