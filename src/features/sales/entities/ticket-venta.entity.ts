import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Venta } from './venta.entity.js';

@Entity('tickets_venta')
export class TicketVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Venta, (venta) => venta.ticket, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Relation<Venta>;

  @RelationId((ticket: TicketVenta) => ticket.venta)
  ventaId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
