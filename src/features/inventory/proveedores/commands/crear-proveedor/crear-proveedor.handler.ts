import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Proveedor } from '../../../entities/proveedor.entity.js';
import { CrearProveedorCommand } from './crear-proveedor.command.js';

@CommandHandler(CrearProveedorCommand)
export class CrearProveedorHandler implements ICommandHandler<CrearProveedorCommand> {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedores: Repository<Proveedor>,
  ) {}

  async execute({ data }: CrearProveedorCommand): Promise<Proveedor> {
    try {
      return await this.proveedores.save(
        this.proveedores.create({
          nombre: data.nombre,
          documento: data.documento ?? null,
          contacto: data.contacto ?? null,
        }),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Ya existe un proveedor con ese documento');
      }
      throw error;
    }
  }
}
