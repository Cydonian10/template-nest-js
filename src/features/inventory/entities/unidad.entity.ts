import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from './producto.entity.js';
import { UnidadProducto } from './unidad-producto.entity.js';
import { DetalleMovimiento } from './detalle-movimiento.entity.js';

@Entity('unidades')
export class Unidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ length: 20 })
  simbolo: string;

  @Column({ length: 30 })
  tipo: string;

  @OneToMany(() => Producto, (producto) => producto.unidadBase)
  productosBase: Relation<Producto[]>;

  @OneToMany(() => UnidadProducto, (unidadProducto) => unidadProducto.unidad)
  unidadesProducto: Relation<UnidadProducto[]>;

  @OneToMany(() => DetalleMovimiento, (detalle) => detalle.unidad)
  detallesMovimiento: Relation<DetalleMovimiento[]>;
}
