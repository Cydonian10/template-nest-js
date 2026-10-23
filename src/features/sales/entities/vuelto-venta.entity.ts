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
import { Venta } from './venta.entity.js';

@Entity('vueltos_venta')
@Check('CHK_vueltos_venta_importe', '"importe" > 0')
export class VueltoVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venta, (venta) => venta.vueltos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Relation<Venta>;

  @Column({ type: 'enum', enum: MedioPago, enumName: 'medio_pago_venta' })
  medio: MedioPago;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
