import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { Caja } from './caja.entity.js';
import { Venta } from './venta.entity.js';
import { MovimientoCaja } from './movimiento-caja.entity.js';

export enum TipoCierreCaja {
  TURNO = 'turno',
  DIA = 'dia',
}

@Entity('turnos_caja')
@Index('UQ_turnos_caja_abiertos', ['caja'], {
  unique: true,
  where: '"fecha_cierre" IS NULL',
})
@Check('CHK_turnos_caja_saldo_inicial', '"saldo_inicial" >= 0')
@Check(
  'CHK_turnos_caja_cierre',
  '("fecha_cierre" IS NULL AND "efectivo_esperado" IS NULL AND "efectivo_contado" IS NULL AND "diferencia" IS NULL AND "tipo_cierre" IS NULL AND "usuario_cierre_id" IS NULL) OR ("fecha_cierre" IS NOT NULL AND "efectivo_esperado" IS NOT NULL AND "efectivo_contado" IS NOT NULL AND "diferencia" IS NOT NULL AND "tipo_cierre" IS NOT NULL AND "usuario_cierre_id" IS NOT NULL)',
)
export class TurnoCaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Caja, (caja) => caja.turnos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'caja_id' })
  caja: Relation<Caja>;

  @RelationId((turno: TurnoCaja) => turno.caja)
  cajaId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_apertura_id' })
  usuarioApertura: Relation<User>;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_cierre_id' })
  usuarioCierre: Relation<User> | null;

  @Column({ name: 'fecha_operativa', type: 'date' })
  fechaOperativa: string;

  @CreateDateColumn({ name: 'fecha_apertura', type: 'timestamptz' })
  fechaApertura: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamptz', nullable: true })
  fechaCierre: Date | null;

  @Column({ name: 'saldo_inicial', type: 'numeric', precision: 18, scale: 2 })
  saldoInicial: string;

  @Column({
    name: 'efectivo_esperado',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  efectivoEsperado: string | null;

  @Column({
    name: 'efectivo_contado',
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  efectivoContado: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  diferencia: string | null;

  @Column({
    name: 'tipo_cierre',
    type: 'enum',
    enum: TipoCierreCaja,
    enumName: 'tipo_cierre_caja',
    nullable: true,
  })
  tipoCierre: TipoCierreCaja | null;

  @OneToMany(() => Venta, (venta) => venta.turno)
  ventas: Relation<Venta[]>;

  @OneToMany(() => MovimientoCaja, (movimiento) => movimiento.turno)
  movimientos: Relation<MovimientoCaja[]>;
}
