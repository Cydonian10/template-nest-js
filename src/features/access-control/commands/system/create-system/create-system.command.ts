import type { CreateSystemDto } from '../../../dto/system/create-system.dto.js';

export class CreateSystemCommand {
  constructor(public data: CreateSystemDto) {}
}
