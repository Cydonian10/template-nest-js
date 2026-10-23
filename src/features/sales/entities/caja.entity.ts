import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { TurnoCaja } from './turno-caja.entity.js';

@Entity('cajas')
export class Caja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => TurnoCaja, (turno) => turno.caja)
  turnos: Relation<TurnoCaja[]>;
}
