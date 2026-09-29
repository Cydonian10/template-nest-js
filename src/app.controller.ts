import { Controller, Get } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Get()
  getHello(): string {
    this.logger.log('GET / recibido');
    return this.appService.getHello();
  }
}
