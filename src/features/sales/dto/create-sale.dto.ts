import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { SaleStatus } from '../entities/sale.entity.js';

export const CreateSaleDetailSchema = z.strictObject({
  productId: z.coerce.number().int().min(1),
  quantity: z.coerce.number().int().min(1),
});

export class CreateSaleDetailDto {
  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 2, minimum: 1 })
  quantity!: number;
}

export const CreateSaleSchema = z.strictObject({
  userId: z.coerce.number().int().min(1),
  status: z.enum(SaleStatus).optional(),
  details: z.array(CreateSaleDetailSchema).min(1),
});

export class CreateSaleDto {
  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiPropertyOptional({ enum: SaleStatus, default: SaleStatus.PENDING })
  status?: SaleStatus;

  @ApiProperty({ type: [CreateSaleDetailDto] })
  details!: CreateSaleDetailDto[];
}
