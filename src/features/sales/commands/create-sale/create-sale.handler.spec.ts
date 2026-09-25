import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { CreateSaleCommand } from './create-sale.command.js';
import { CreateSaleHandler } from './create-sale.handler.js';

describe('CreateSaleHandler', () => {
  it('debería fallar si el usuario no existe', async () => {
    const manager = { findOne: vi.fn().mockResolvedValue(null) };
    const unitOfWork = {
      execute: vi.fn((work) => work(manager)),
    } as unknown as UnitOfWork;
    const handler = new CreateSaleHandler(unitOfWork);

    await expect(
      handler.execute(
        new CreateSaleCommand({
          userId: 99,
          details: [{ productId: 1, quantity: 1 }],
        }),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
