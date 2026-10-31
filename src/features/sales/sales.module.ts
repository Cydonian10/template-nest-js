import { Module } from '@nestjs/common';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CrearCajaHandler } from './cajas/command/crear-caja/crear-caja.handler.js';
import { CajasController } from './cajas/controllers/caja-controller/cajas.controller.js';
import { ListarCajasHandler } from './cajas/queries/listar-cajas/listar-cajas.handler.js';

@Module({
  controllers: [CajasController],
  providers: [UnitOfWork, CrearCajaHandler, ListarCajasHandler],
})
export class SalesModule {}
