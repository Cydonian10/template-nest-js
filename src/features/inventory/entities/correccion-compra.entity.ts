import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { Compra } from './compra.entity.js';

@Entity('correcciones_compra')
export class CorreccionCompra {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Compra, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'compra_id' })
  compra: Relation<Compra>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @Column({ type: 'jsonb' }) anterior: Record<string, unknown>;

  @Column({ type: 'jsonb' }) nuevo: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' }) fecha: Date;
}
