import { Module } from '@nestjs/common';
import { UnitOfWork } from '../../shared/database/unit-of-work.js';
import { CrearCajaHandler } from './cajas/command/crear-caja/crear-caja.handler.js';
import { CajasController } from './cajas/controllers/caja-controller/cajas.controller.js';
import { ListarCajasHandler } from './cajas/queries/listar-cajas/listar-cajas.handler.js';
import { CajaTurnoController } from './caja-turnos/controllers/caja-turno.controller.js';
import { AbrirTurnoHandler } from './caja-turnos/commands/abrir-turno/abrir-turno.handler.js';
import { CerrarTurnoHandler } from './caja-turnos/commands/cerrar-turno/cerrar-turno.handler.js';
import { ResumenTurnoHandler } from './caja-turnos/queries/resumen-turno/resumen-turno.handler.js';
import { VentasController } from './ventas/controllers/ventas.controller.js';
import { CrearVentaHandler } from './ventas/commands/crear-venta/crear-venta.handler.js';
import { CatalogoController } from './catalogo/controllers/catalogo.controller.js';
import { ListarCatalogoHandler } from './catalogo/queries/listar-catalogo/listar-catalogo.handler.js';

@Module({
  controllers: [CajasController, CajaTurnoController, VentasController, CatalogoController],
  providers: [
    UnitOfWork,
    CrearCajaHandler,
    ListarCajasHandler,
    AbrirTurnoHandler,
    CerrarTurnoHandler,
    ResumenTurnoHandler,
    CrearVentaHandler,
    ListarCatalogoHandler,
  ],
})
export class SalesModule {}
