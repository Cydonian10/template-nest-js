import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { MovimientoInventario } from '../../inventory/entities/movimiento-inventario.entity.js';
import { Venta } from './venta.entity.js';
import { TurnoCaja } from './turno-caja.entity.js';
import { DetalleDevolucionVenta } from './detalle-devolucion-venta.entity.js';
import { ReintegroVenta } from './reintegro-venta.entity.js';

export enum TipoDevolucionVenta {
  ANULACION = 'anulacion',
  DEVOLUCION = 'devolucion',
}

@Entity('devoluciones_venta')
@Check(
  'CHK_devoluciones_venta_importes',
  '"importe" >= 0 AND "base_imponible" >= 0 AND "igv" >= 0',
)
export class DevolucionVenta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Venta, (venta) => venta.devoluciones, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'venta_id' })
  venta: Relation<Venta>;

  @RelationId((devolucion: DevolucionVenta) => devolucion.venta)
  ventaId: string;

  @ManyToOne(() => TurnoCaja, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'turno_id' })
  turno: Relation<TurnoCaja>;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @OneToOne(() => MovimientoInventario, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'movimiento_inventario_id' })
  movimientoInventario: Relation<MovimientoInventario> | null;

  @Column({
    type: 'enum',
    enum: TipoDevolucionVenta,
    enumName: 'tipo_devolucion_venta',
  })
  tipo: TipoDevolucionVenta;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  baseImponible: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  igv: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  importe: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;

  @OneToMany(() => DetalleDevolucionVenta, (detalle) => detalle.devolucion)
  detalles: Relation<DetalleDevolucionVenta[]>;

  @OneToMany(() => ReintegroVenta, (reintegro) => reintegro.devolucion)
  reintegros: Relation<ReintegroVenta[]>;
}
