import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateProductSchema = z.strictObject({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).optional(),
});

export class CreateProductDto {
  @ApiProperty({ example: 'Taladro eléctrico' })
  name!: string;

  @ApiPropertyOptional({ example: 'Taladro de 750W' })
  description?: string;

  @ApiProperty({ example: 89.99, minimum: 0 })
  price!: number;

  @ApiPropertyOptional({ example: 10, minimum: 0, default: 0 })
  stock?: number;
}
