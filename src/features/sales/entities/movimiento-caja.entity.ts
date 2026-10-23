import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { TurnoCaja } from './turno-caja.entity.js';

export enum TipoMovimientoCaja {
  INGRESO = 'ingreso',
  EGRESO = 'egreso',
}

@Entity('movimientos_caja')
@Check('CHK_movimientos_caja_importe', '"importe" > 0')
export class MovimientoCaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TurnoCaja, (turno) => turno.movimientos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'turno_id' })
  turno: Relation<TurnoCaja>;

  @RelationId((movimiento: MovimientoCaja) => movimiento.turno)
  turnoId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @Column({
    type: 'enum',
    enum: TipoMovimientoCaja,
    enumName: 'tipo_movimiento_caja',
  })
  tipo: TipoMovimientoCaja;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;

  @Column({ type: 'text' })
  motivo: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
