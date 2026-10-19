import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import { REQUIRED_PERMISSIONS_KEY } from '../../auth/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../../auth/guards/permissions.guard.js';
import type { UserRole } from '../access-control/entities/user_roles.entity.js';
import { PERMISSION_CODES } from '../../shared/authorization/permission-codes.js';
import { SYSTEM_CODES } from '../../shared/authorization/system-codes.js';
import { ImagesController } from './images.controller.js';
import { VariantImagesController } from './variant-images.controller.js';

describe('Permisos de imágenes de productos y variantes', () => {
  const controllers = [ImagesController, VariantImagesController];
  const readMethods = ['list', 'download'] as const;
  const writeMethods = ['upload', 'setPrincipal', 'remove'] as const;

  const query = {
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawMany: vi.fn(),
  };
  const guard = new PermissionsGuard(new Reflector(), {
    createQueryBuilder: vi.fn().mockReturnValue(query),
  } as unknown as Repository<UserRole>);

  function context(
    controller: (typeof controllers)[number],
    method: (typeof readMethods)[number] | (typeof writeMethods)[number],
    authenticated = true,
  ): ExecutionContext {
    return {
      getHandler: () =>
        Object.getOwnPropertyDescriptor(controller.prototype, method)?.value,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => ({
          user: authenticated ? { id: 'user-1' } : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  function grant(code: string) {
    return { roleCode: 'OPERADOR', code, systemCode: SYSTEM_CODES.INVENTARIO };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    query.getRawMany.mockResolvedValue([]);
  });

  it('declara el permiso necesario en cada operación, incluso archivo y portada', () => {
    for (const controller of controllers) {
      for (const method of readMethods) {
        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSIONS_KEY,
            context(controller, method).getHandler(),
          ),
        ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
      }
      for (const method of writeMethods) {
        expect(
          Reflect.getMetadata(
            REQUIRED_PERMISSIONS_KEY,
            context(controller, method).getHandler(),
          ),
        ).toEqual([PERMISSION_CODES.PRODUCTS_UPDATE]);
      }
    }
  });

  it('sin permiso de lectura rechaza listados, archivos y escrituras', async () => {
    for (const controller of controllers) {
      for (const method of [...readMethods, ...writeMethods]) {
        await expect(
          guard.canActivate(context(controller, method)),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
    }
  });

  it('PRODUCTOS_LEER permite consultar pero no modificar ninguna galería', async () => {
    query.getRawMany.mockResolvedValue([grant(PERMISSION_CODES.PRODUCTS_READ)]);
    for (const controller of controllers) {
      for (const method of readMethods) {
        await expect(
          guard.canActivate(context(controller, method)),
        ).resolves.toBe(true);
      }
      for (const method of writeMethods) {
        await expect(
          guard.canActivate(context(controller, method)),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
    }
  });

  it('PRODUCTOS_EDITAR permite las mutaciones; sin sesión no permite ni leer', async () => {
    query.getRawMany.mockResolvedValue([
      grant(PERMISSION_CODES.PRODUCTS_UPDATE),
    ]);
    for (const controller of controllers) {
      for (const method of writeMethods) {
        await expect(
          guard.canActivate(context(controller, method)),
        ).resolves.toBe(true);
      }
      await expect(
        guard.canActivate(context(controller, 'download', false)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });
});
