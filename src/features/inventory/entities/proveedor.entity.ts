import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { MovimientoInventario } from './movimiento-inventario.entity.js';

@Entity('proveedores')
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  documento: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  contacto: string | null;

  @OneToMany(() => MovimientoInventario, (movimiento) => movimiento.proveedor)
  movimientos: Relation<MovimientoInventario[]>;
}
