import {
  Check,
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('configuracion_descuentos')
@Check('CHK_configuracion_descuentos_unica', '"id" = 1')
@Check('CHK_configuracion_descuentos_limite', '"limite_manual" >= 0')
export class ConfiguracionDescuentos {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ name: 'limite_manual', type: 'numeric', precision: 18, scale: 2 })
  limiteManual: string;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn: Date;
}
