import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSystemCommand } from './create-system.command.js';
import { InjectRepository } from '@nestjs/typeorm';
import { System } from '../../../entities/system.entity.js';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@CommandHandler(CreateSystemCommand)
export class CreateSystemHandler implements ICommandHandler<CreateSystemCommand> {
  constructor(
    @InjectRepository(System)
    private readonly systemRepo: Repository<System>,
  ) {}

  async execute(command: CreateSystemCommand): Promise<System> {
    const newSystem = this.systemRepo.create({
      code: command.data.code,
      name: command.data.name,
      description: command.data.description,
      active: command.data.active,
      order: command.data.order,
    });

    try {
      return await this.systemRepo.save(newSystem);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un sistema con ese código');
      }
      throw error;
    }
  }
}
