import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../access-control/entities/user.entity.js';
import { Almacen } from './almacen.entity.js';
import { Proveedor } from './proveedor.entity.js';
import { DetalleMovimiento } from './detalle-movimiento.entity.js';

export enum TipoMovimientoInventario {
  INGRESO = 'ingreso',
  SALIDA = 'salida',
  TRASLADO = 'traslado',
  AJUSTE = 'ajuste',
}

export enum EstadoMovimientoInventario {
  BORRADOR = 'borrador',
  CONFIRMADO = 'confirmado',
  ANULADO = 'anulado',
}

@Entity('movimientos_inventario')
@Check(
  'CHK_movimientos_inventario_almacenes',
  `("tipo" = 'ingreso' AND "almacen_origen_id" IS NULL AND "almacen_destino_id" IS NOT NULL)
    OR ("tipo" = 'salida' AND "almacen_origen_id" IS NOT NULL AND "almacen_destino_id" IS NULL)
    OR ("tipo" = 'traslado' AND "almacen_origen_id" IS NOT NULL AND "almacen_destino_id" IS NOT NULL AND "almacen_origen_id" <> "almacen_destino_id")
    OR ("tipo" = 'ajuste' AND "almacen_origen_id" IS NULL AND "almacen_destino_id" IS NOT NULL)`,
)
@Check(
  'CHK_movimientos_inventario_proveedor',
  '"proveedor_id" IS NULL OR "tipo" = \'ingreso\'',
)
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoMovimientoInventario,
    enumName: 'tipo_movimiento_inventario',
  })
  tipo: TipoMovimientoInventario;

  @ManyToOne(() => Almacen, (almacen) => almacen.movimientosOrigen, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'almacen_origen_id' })
  almacenOrigen: Relation<Almacen> | null;

  @RelationId((movimiento: MovimientoInventario) => movimiento.almacenOrigen)
  almacenOrigenId: string | null;

  @ManyToOne(() => Almacen, (almacen) => almacen.movimientosDestino, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'almacen_destino_id' })
  almacenDestino: Relation<Almacen> | null;

  @RelationId((movimiento: MovimientoInventario) => movimiento.almacenDestino)
  almacenDestinoId: string | null;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @RelationId((movimiento: MovimientoInventario) => movimiento.usuario)
  usuarioId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;

  @Column({
    type: 'enum',
    enum: EstadoMovimientoInventario,
    enumName: 'estado_movimiento_inventario',
    default: EstadoMovimientoInventario.BORRADOR,
  })
  estado: EstadoMovimientoInventario;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.movimientos, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Relation<Proveedor> | null;

  @RelationId((movimiento: MovimientoInventario) => movimiento.proveedor)
  proveedorId: string | null;

  @OneToMany(() => DetalleMovimiento, (detalle) => detalle.movimiento)
  detalles: Relation<DetalleMovimiento[]>;
}
