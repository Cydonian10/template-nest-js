import {
  Body,
  BadRequestException,
  Controller,
  Headers,
  Post,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import { CrearVentaCommand } from '../commands/crear-venta/crear-venta.command.js';
import {
  CrearVentaSchema,
  IdempotencyKeySchema,
} from '../dto/crear-venta.dto.js';
import type { CrearVentaDto } from '../dto/crear-venta.dto.js';
import { VentaCreadaResponseDto } from '../dto/venta-creada-response.dto.js';

@ApiBearerAuth()
@ApiTags('ventas')
@Controller({ path: 'ventas', version: VERSION_NEUTRAL })
export class VentasController {
  constructor(private readonly commands: CommandBus) {}

  @Post()
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Clave única por usuario para reintentos de esta venta',
    schema: { type: 'string' },
  })
  @ApiCreatedResponse({
    type: VentaCreadaResponseDto,
    description:
      'Venta registrada o respuesta original de un reintento idéntico',
  })
  @ApiBadRequestResponse({
    description: 'Clave, cuerpo o referencias no utilizables inválidos',
  })
  @ApiUnauthorizedResponse({ description: 'Autenticación requerida' })
  @ApiNotFoundResponse({ description: 'Referencia inexistente' })
  @ApiConflictResponse({
    description:
      'Turno cerrado, stock o pago insuficiente, vuelto no permitido o conflicto de idempotencia',
  })
  procesarVenta(
    @CurrentUser('id') usuarioId: string,
    @Headers('idempotency-key') clave: string | undefined,
    @Body({ schema: CrearVentaSchema }) data: CrearVentaDto,
  ): Promise<VentaCreadaResponseDto> {
    const resultado = IdempotencyKeySchema.safeParse(clave);
    if (!resultado.success)
      throw new BadRequestException('La clave de idempotencia es obligatoria');
    return this.commands.execute(
      new CrearVentaCommand(usuarioId, resultado.data, data),
    );
  }
}
