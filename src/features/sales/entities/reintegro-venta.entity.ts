import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { MedioPago } from './pago-venta.entity.js';
import { DevolucionVenta } from './devolucion-venta.entity.js';

@Entity('reintegros_venta')
@Check('CHK_reintegros_venta_importe', '"importe" > 0')
export class ReintegroVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DevolucionVenta, (devolucion) => devolucion.reintegros, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'devolucion_id' })
  devolucion: Relation<DevolucionVenta>;

  @Column({ type: 'enum', enum: MedioPago, enumName: 'medio_pago_venta' })
  medio: MedioPago;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
