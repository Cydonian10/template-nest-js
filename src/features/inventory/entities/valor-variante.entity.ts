import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { VarianteProducto } from './variante-producto.entity.js';
import { Atributo } from './atributo.entity.js';

@Entity('valores_variante')
export class ValorVariante {
  @PrimaryColumn({ name: 'variante_id', type: 'uuid' })
  varianteId: string;

  @ManyToOne(() => VarianteProducto, (variante) => variante.valores, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'variante_id' })
  variante: Relation<VarianteProducto>;

  @PrimaryColumn({ name: 'atributo_id', type: 'uuid' })
  atributoId: string;

  @ManyToOne(() => Atributo, (atributo) => atributo.valores, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'atributo_id' })
  atributo: Relation<Atributo>;

  @Column({ length: 150 })
  valor: string;
}
