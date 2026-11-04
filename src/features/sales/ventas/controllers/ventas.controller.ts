import {
  Body,
  Controller,
  NotImplementedException,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrearVentaSchema } from '../dto/crear-venta.dto.js';
import type { CrearVentaDto } from '../dto/crear-venta.dto.js';

@ApiBearerAuth()
@ApiTags('ventas')
@Controller({ path: 'ventas', version: VERSION_NEUTRAL })
export class VentasController {
  @Post()
  @ApiResponse({ status: 501, description: 'Procesamiento de venta pendiente' })
  procesarVenta(
    @Body({ schema: CrearVentaSchema }) _data: CrearVentaDto,
  ): never {
    throw new NotImplementedException(
      'El procesamiento de ventas aún no está implementado',
    );
  }
}
