import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import type { Relation } from 'typeorm';
import { Existencia } from './existencia.entity.js';
import { MovimientoInventario } from './movimiento-inventario.entity.js';

@Entity('almacenes')
@Unique('UQ_almacenes_orden_creacion', ['ordenCreacion'])
export class Almacen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, unique: true })
  nombre: string;

  @Column({ default: true })
  activo: boolean;

  // Orden de alta persistente; los registros previos a la migración se ordenan
  // alfabéticamente, no por una fecha histórica de creación.
  @Column({
    name: 'orden_creacion',
    type: 'bigint',
    default: () => "nextval('almacenes_orden_creacion_seq'::regclass)",
  })
  ordenCreacion: string;

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
