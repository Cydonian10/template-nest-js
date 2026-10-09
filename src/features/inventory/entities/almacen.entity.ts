import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Existencia } from './existencia.entity.js';
import { MovimientoInventario } from './movimiento-inventario.entity.js';

@Entity('almacenes')
export class Almacen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, unique: true })
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Existencia, (existencia) => existencia.almacen)
  existencias: Relation<Existencia[]>;

  @OneToMany(
    () => MovimientoInventario,
    (movimiento) => movimiento.almacenOrigen,
  )
  movimientosOrigen: Relation<MovimientoInventario[]>;

  @OneToMany(
    () => MovimientoInventario,
    (movimiento) => movimiento.almacenDestino,
  )
  movimientosDestino: Relation<MovimientoInventario[]>;
}
