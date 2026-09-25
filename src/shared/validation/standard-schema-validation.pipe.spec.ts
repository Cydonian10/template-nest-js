import {
  BadRequestException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { CreateProductSchema } from '../../features/products/dto/create-product.dto.js';

describe('StandardSchemaValidationPipe', () => {
  const pipe = new StandardSchemaValidationPipe();
  const metadata = { type: 'body' as const, schema: CreateProductSchema };

  it('validates and transforms a Zod schema value', async () => {
    const result = await pipe.transform(
      { name: 'Taladro', price: '89.99', stock: '2' },
      metadata,
    );

    expect(result).toEqual({ name: 'Taladro', price: 89.99, stock: 2 });
  });

  it('rejects values that do not satisfy the schema', async () => {
    await expect(
      pipe.transform({ name: 'Taladro', price: 0, unknown: true }, metadata),
    ).rejects.toThrow(BadRequestException);
  });
});
