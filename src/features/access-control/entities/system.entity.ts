import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { SystemModule } from './module.entity.js';

@Entity('systems')
export class System {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  path: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  active: boolean;

  @ApiProperty({ default: 0, type: Number })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  order: number;

  @OneToMany(() => SystemModule, (module) => module.system)
  modules: Relation<SystemModule[]>;
}
