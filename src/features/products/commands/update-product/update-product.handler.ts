import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { Product } from '../../entities/product.entity.js';
import { UpdateProductCommand } from './update-product.command.js';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  public async execute(command: UpdateProductCommand): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: command.data.id },
    });

    if (!product) {
      throw new ResourceNotFoundException('Producto', command.data.id);
    }

    this.repository.merge(product, {
      name: command.data.name,
      price: command.data.price,
      stock: command.data.stock,
      description: command.data.description,
    });

    return this.repository.save(product);
  }
}
