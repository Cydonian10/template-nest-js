import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import databaseConfig from './config/database.config.js';
import { envSchema } from './config/env.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { ProductsModule } from './features/products/products.module.js';
import { SalesModule } from './features/sales/sales.module.js';
import { UsersModule } from './features/users/users.module.js';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter.js';

@Module({
  imports: [
    CqrsModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validate: (config) => envSchema.parse(config),
    }),
    DatabaseModule,
    ProductsModule,
    UsersModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
