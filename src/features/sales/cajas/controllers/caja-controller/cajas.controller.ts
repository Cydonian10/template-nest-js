import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CrearCajaSchema } from '../../dto/crear-caja-dto/crear-caja.dto.js';
import type { CrearCajaDto } from '../../dto/crear-caja-dto/crear-caja.dto.js';

@ApiBearerAuth()
@ApiTags('cajas')
@Controller({ path: 'cajas', version: VERSION_NEUTRAL })
export class CajasController {
  @Post()
  @ApiCreatedResponse({ description: 'Creando cajas' })
  create(@Body({ schema: CrearCajaSchema }) _data: CrearCajaDto): {
    mensaje: string;
  } {
    return { mensaje: 'Creando cajas' };
  }
}
