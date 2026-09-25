import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductSchema } from './create-product.dto.js';

export const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Taladro eléctrico' })
  name?: string;

  @ApiPropertyOptional({ example: 'Taladro de 750W' })
  description?: string;

  @ApiPropertyOptional({ example: 89.99, minimum: 0 })
  price?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  stock?: number;
}
