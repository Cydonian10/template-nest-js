import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import { UserRole } from '../../features/access-control/entities/user_roles.entity.js';
import { PERMISSION_CODES } from '../../shared/authorization/permission-codes.js';
import { ROLE_CODES } from '../../shared/authorization/role-codes.js';
import { SYSTEM_CODES } from '../../shared/authorization/system-codes.js';
import {
  REQUIRED_PERMISSION_SYSTEM_KEY,
  REQUIRED_PERMISSIONS_KEY,
  RequirePermissionsInSystem,
} from '../decorators/require-permissions.decorator.js';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  it('el decorador guarda el código y el sistema requeridos para futuros catálogos', () => {
    class Catalogo {
      @RequirePermissionsInSystem(
        SYSTEM_CODES.INVENTARIO,
        PERMISSION_CODES.PRODUCTS_READ,
      )
      listar() {}
    }

    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, Catalogo.prototype.listar),
    ).toEqual([PERMISSION_CODES.PRODUCTS_READ]);
    expect(
      Reflect.getMetadata(
        REQUIRED_PERMISSION_SYSTEM_KEY,
        Catalogo.prototype.listar,
      ),
    ).toBe(SYSTEM_CODES.INVENTARIO);
  });

  const getAllAndOverride = vi.fn();
  const getRawMany = vi.fn();
  const queryBuilder = {
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawMany,
  };
  const createQueryBuilder = vi.fn().mockReturnValue(queryBuilder);
  const guard = new PermissionsGuard(
    { getAllAndOverride } as unknown as Reflector,
    { createQueryBuilder } as unknown as Repository<UserRole>,
  );
  const context = (user?: { id: string }, body?: unknown) =>
    ({
      getHandler: () => vi.fn(),
      getClass: () => class UsersController {},
      switchToHttp: () => ({ getRequest: () => ({ user, body }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions'
        ? [PERMISSION_CODES.USERS_READ, PERMISSION_CODES.USERS_CREATE]
        : false,
    );
  });

  it('omite las rutas públicas y las que no exigen permisos', async () => {
    getAllAndOverride.mockReturnValueOnce(true);
    await expect(guard.canActivate(context())).resolves.toBe(true);
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions' ? undefined : false,
    );
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('devuelve 401 sin usuario autenticado', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('devuelve 403 si falta alguno de los permisos', async () => {
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.USERS_READ,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'assignment.user_id = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'role.rolePermissions',
      'grant',
      'grant.active = :active',
      { active: true },
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'grant.permission',
      'permission',
      'permission.code IN (:...required)',
      {
        required: [PERMISSION_CODES.USERS_READ, PERMISSION_CODES.USERS_CREATE],
      },
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'role.system',
      'scope',
      'scope.id = system.id',
    );
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'permission.system',
      'system',
      'system.active = true AND system.code IN (:...systemCodes)',
      { systemCodes: [SYSTEM_CODES.ACCESS_CONTROL] },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(assignment.valid_until IS NULL OR assignment.valid_until >= :today)',
      {
        today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      },
    );
  });

  it('autoriza solo si están todos los permisos exigidos', async () => {
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.USERS_READ,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.USERS_CREATE,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
    ]);
    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });

  it('valida UNIDADES_CREAR en INVENTARIO, no en otro sistema', async () => {
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions'
        ? [PERMISSION_CODES.UNIDADES_CREATE]
        : false,
    );
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.UNIDADES_CREATE,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'permission.system',
      'system',
      'system.active = true AND system.code IN (:...systemCodes)',
      { systemCodes: [SYSTEM_CODES.INVENTARIO] },
    );

    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.UNIDADES_CREATE,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });

  it('reutiliza PRODUCTOS_LEER y PRODUCTOS_EDITAR de INVENTARIO sin concederlos desde otro sistema', async () => {
    const lectura = PERMISSION_CODES.PRODUCTS_READ;
    const escritura = PERMISSION_CODES.PRODUCTS_UPDATE;

    for (const requerido of [lectura, escritura]) {
      getAllAndOverride.mockImplementation((key: string) =>
        key === 'requiredPermissions'
          ? [requerido]
          : key === 'requiredPermissionSystem'
            ? SYSTEM_CODES.INVENTARIO
            : false,
      );

      await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: requerido,
          systemCode: SYSTEM_CODES.ACCESS_CONTROL,
        },
      ]);
      await expect(
        guard.canActivate(context({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'permission.system',
        'system',
        'system.active = true AND system.code IN (:...systemCodes)',
        { systemCodes: [SYSTEM_CODES.INVENTARIO] },
      );

      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: requerido === lectura ? escritura : lectura,
          systemCode: SYSTEM_CODES.INVENTARIO,
        },
      ]);
      await expect(
        guard.canActivate(context({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);

      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: requerido,
          systemCode: SYSTEM_CODES.INVENTARIO,
        },
      ]);
      await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
        true,
      );
    }
  });

  it('permite consultar existencias sin ALMACENES_LEER y rechaza un permiso de otro sistema', async () => {
    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions'
        ? [PERMISSION_CODES.EXISTENCIAS_READ]
        : false,
    );
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.ALMACENES_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.EXISTENCIAS_READ,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.EXISTENCIAS_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });

  it('editar mínimos no concede lectura ni otros permisos, y lectura no concede edición', async () => {
    for (const required of [
      PERMISSION_CODES.EXISTENCIAS_READ,
      PERMISSION_CODES.ALMACENES_UPDATE,
      PERMISSION_CODES.COMPRAS_READ,
    ]) {
      getAllAndOverride.mockImplementation((key: string) =>
        key === 'requiredPermissions' ? [required] : false,
      );
      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO,
          systemCode: SYSTEM_CODES.INVENTARIO,
        },
      ]);
      await expect(
        guard.canActivate(context({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }

    getAllAndOverride.mockImplementation((key: string) =>
      key === 'requiredPermissions'
        ? [PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMO]
        : false,
    );
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.EXISTENCIAS_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deniega compras sin el permiso correspondiente en INVENTARIO', async () => {
    for (const required of [
      PERMISSION_CODES.COMPRAS_CREATE,
      PERMISSION_CODES.COMPRAS_READ,
    ]) {
      getAllAndOverride.mockImplementation((key: string) =>
        key === 'requiredPermissions' ? [required] : false,
      );
      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: required,
          systemCode: SYSTEM_CODES.ACCESS_CONTROL,
        },
      ]);
      await expect(
        guard.canActivate(context({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
        'permission.system',
        'system',
        'system.active = true AND system.code IN (:...systemCodes)',
        { systemCodes: [SYSTEM_CODES.INVENTARIO] },
      );
      getRawMany.mockResolvedValue([
        {
          roleCode: 'OPERADOR',
          code: required,
          systemCode: SYSTEM_CODES.INVENTARIO,
        },
      ]);
      await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
        true,
      );
    }
  });

  it('exige ambos permisos de Inventario para el informe del proveedor', async () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRED_PERMISSIONS_KEY) {
        return [
          PERMISSION_CODES.PROVEEDORES_READ,
          PERMISSION_CODES.COMPRAS_READ,
        ];
      }
      if (key === REQUIRED_PERMISSION_SYSTEM_KEY)
        return SYSTEM_CODES.INVENTARIO;
      return false;
    });
    for (const code of [
      PERMISSION_CODES.PROVEEDORES_READ,
      PERMISSION_CODES.COMPRAS_READ,
    ]) {
      getRawMany.mockResolvedValue([
        { roleCode: 'OPERADOR', code, systemCode: SYSTEM_CODES.INVENTARIO },
      ]);
      await expect(
        guard.canActivate(context({ id: 'user-1' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.PROVEEDORES_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.COMPRAS_READ,
        systemCode: SYSTEM_CODES.ACCESS_CONTROL,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.PROVEEDORES_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.COMPRAS_READ,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });

  it('autoriza a SUPER_ADMIN sin asignaciones de permisos', async () => {
    getRawMany.mockResolvedValue([
      { roleCode: ROLE_CODES.SUPER_ADMIN, code: null },
    ]);

    await expect(guard.canActivate(context({ id: 'user-1' }))).resolves.toBe(
      true,
    );
  });
  it('exige solo el permiso del tipo del cuerpo y rechaza tipos desconocidos', async () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'permissionByBodyType')
        return {
          salida: PERMISSION_CODES.SALIDAS_CREATE,
          traslado: PERMISSION_CODES.TRASLADOS_CREATE,
          ajuste: PERMISSION_CODES.AJUSTES_CREATE,
        };
      return key === 'requiredPermissions' ? undefined : false;
    });
    getRawMany.mockResolvedValue([
      {
        roleCode: 'OPERADOR',
        code: PERMISSION_CODES.SALIDAS_CREATE,
        systemCode: SYSTEM_CODES.INVENTARIO,
      },
    ]);
    await expect(
      guard.canActivate(context({ id: 'user-1' }, { tipo: 'salida' })),
    ).resolves.toBe(true);
    expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
      'grant.permission',
      'permission',
      'permission.code IN (:...required)',
      { required: [PERMISSION_CODES.SALIDAS_CREATE] },
    );
    await expect(
      guard.canActivate(context({ id: 'user-1' }, { tipo: 'ajuste' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guard.canActivate(context({ id: 'user-1' }, { tipo: 'ingreso' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      guard.canActivate(context({ id: 'user-1' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
