import { Module } from '@nestjs/common';
import { CajasController } from './cajas/controllers/caja-controller/cajas.controller.js';

@Module({ controllers: [CajasController] })
export class SalesModule {}
