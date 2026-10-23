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
import { Almacen } from '../../inventory/entities/almacen.entity.js';
import { MovimientoInventario } from '../../inventory/entities/movimiento-inventario.entity.js';
import { TurnoCaja } from './turno-caja.entity.js';
import { DetalleVenta } from './detalle-venta.entity.js';
import { PagoVenta } from './pago-venta.entity.js';
import { VueltoVenta } from './vuelto-venta.entity.js';
import { DescuentoVenta } from './descuento-venta.entity.js';
import { DevolucionVenta } from './devolucion-venta.entity.js';
import { TicketVenta } from './ticket-venta.entity.js';

export enum EstadoVenta {
  CONFIRMADA = 'confirmada',
  PARCIALMENTE_DEVUELTA = 'parcialmente_devuelta',
  DEVUELTA = 'devuelta',
  ANULADA = 'anulada',
}

@Entity('ventas')
@Check(
  'CHK_ventas_importes',
  '"subtotal" >= 0 AND "descuento_promocional" >= 0 AND "descuento_manual" >= 0 AND "base_imponible" >= 0 AND "igv" >= 0 AND "total" >= 0',
)
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TurnoCaja, (turno) => turno.ventas, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'turno_id' })
  turno: Relation<TurnoCaja>;

  @RelationId((venta: Venta) => venta.turno)
  turnoId: string;

  @ManyToOne(() => Almacen, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Relation<Almacen>;

  @RelationId((venta: Venta) => venta.almacen)
  almacenId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<User>;

  @OneToOne(() => MovimientoInventario, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'movimiento_inventario_id' })
  movimientoInventario: Relation<MovimientoInventario> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;

  @Column({
    type: 'enum',
    enum: EstadoVenta,
    enumName: 'estado_venta',
    default: EstadoVenta.CONFIRMADA,
  })
  estado: EstadoVenta;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  subtotal: string;

  @Column({
    name: 'descuento_promocional',
    type: 'numeric',
    precision: 18,
    scale: 2,
  })
  descuentoPromocional: string;

  @Column({
    name: 'descuento_manual',
    type: 'numeric',
    precision: 18,
    scale: 2,
  })
  descuentoManual: string;

  @Column({ name: 'base_imponible', type: 'numeric', precision: 18, scale: 2 })
  baseImponible: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  igv: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  total: string;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta)
  detalles: Relation<DetalleVenta[]>;

  @OneToMany(() => PagoVenta, (pago) => pago.venta)
  pagos: Relation<PagoVenta[]>;

  @OneToMany(() => VueltoVenta, (vuelto) => vuelto.venta)
  vueltos: Relation<VueltoVenta[]>;

  @OneToMany(() => DescuentoVenta, (descuento) => descuento.venta)
  descuentos: Relation<DescuentoVenta[]>;

  @OneToMany(() => DevolucionVenta, (devolucion) => devolucion.venta)
  devoluciones: Relation<DevolucionVenta[]>;

  @OneToOne(() => TicketVenta, (ticket) => ticket.venta)
  ticket: Relation<TicketVenta>;
}
