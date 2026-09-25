import { NotFoundException } from '@nestjs/common';

export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} con identificador ${identifier} no encontrado`);
  }
}
