import { ConflictException } from '@nestjs/common';
import type { EntityManager, Repository } from 'typeorm';
import type { UnitOfWork } from '../../../../shared/database/unit-of-work.js';
import { ResourceNotFoundException } from '../../../../shared/exceptions/resource-not-found.exception.js';
import { Menu } from '../../entities/menu.entity.js';
import { RoleMenu } from '../../entities/role_menu.entity.js';
import { SystemModule } from '../../entities/module.entity.js';
import { CreateMenuSchema } from '../../dto/menu/create-menu.dto.js';
import { UpdateMenuSchema } from '../../dto/menu/update-menu.dto.js';
import { MenuResponseDto } from '../../dto/menu/menu-response.dto.js';
import { CreateMenuCommand } from './create-menu/create-menu.command.js';
import { CreateMenuHandler } from './create-menu/create-menu.handler.js';
import { UpdateMenuCommand } from './update-menu/update-menu.command.js';
import { UpdateMenuHandler } from './update-menu/update-menu.handler.js';
import { SetMenuActiveCommand } from './set-menu-active/set-menu-active.command.js';
import { SetMenuActiveHandler } from './set-menu-active/set-menu-active.handler.js';
import { DeleteMenuCommand } from './delete-menu/delete-menu.command.js';
import { DeleteMenuHandler } from './delete-menu/delete-menu.handler.js';

describe('Comandos de menús', () => {
  const module = { id: 'module-id' } as SystemModule;
  const findOneBy = vi.fn();
  const findOne = vi.fn();
  const exists = vi.fn();
  const save = vi.fn(async (menu: Menu) => menu);
  const remove = vi.fn(async () => undefined);
  const create = vi.fn((data: object) => data);
  const manager = { findOne, exists, remove } as unknown as EntityManager;
  const unitOfWork = {
    execute: vi.fn((work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager),
    ),
  } as unknown as UnitOfWork;
  const menuRepo = {
    findOneBy,
    findOne,
    save,
    create,
  } as unknown as Repository<Menu>;
  const moduleRepo = { findOneBy } as unknown as Repository<SystemModule>;

  beforeEach(() => {
    vi.clearAllMocks();
    findOneBy.mockResolvedValue(module);
    findOne.mockResolvedValue({ id: 'menu-id', module, active: true });
    exists.mockResolvedValue(false);
  });

  it('crea un menú activo en un módulo existente', async () => {
    const data = {
      moduleId: module.id,
      name: 'Inicio',
      path: '/inicio',
      description: 'Página principal',
    };
    const result = await new CreateMenuHandler(menuRepo, moduleRepo).execute(
      new CreateMenuCommand(data),
    );
    expect(create).toHaveBeenCalledWith({
      module,
      name: data.name,
      path: data.path,
      description: data.description,
      active: true,
    });
    expect(result).toMatchObject({ module, active: true });
  });

  it('limita la creación anidada al sistema dueño del módulo', async () => {
    const data = {
      moduleId: module.id,
      name: 'Inicio',
      path: '/inicio',
      description: 'Inicio',
    };
    findOneBy.mockResolvedValueOnce(null);
    await expect(
      new CreateMenuHandler(menuRepo, moduleRepo).execute(
        new CreateMenuCommand(data, 'otro-sistema'),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(findOneBy).toHaveBeenCalledWith({
      id: module.id,
      system: { id: 'otro-sistema' },
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('valida campos, existencia del módulo y cambios reales', async () => {
    expect(
      CreateMenuSchema.safeParse({
        moduleId: module.id,
        name: '',
        path: '',
        description: '',
      }).success,
    ).toBe(false);
    expect(UpdateMenuSchema.safeParse({}).success).toBe(false);
    findOneBy.mockResolvedValue(null);
    await expect(
      new CreateMenuHandler(menuRepo, moduleRepo).execute(
        new CreateMenuCommand({
          moduleId: 'missing',
          name: 'Inicio',
          path: '/',
          description: 'Inicio',
        }),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('permite cambiar el módulo y refleja el nuevo ID en la respuesta', async () => {
    const updatedModule = { id: 'new-module-id' } as SystemModule;
    findOneBy.mockResolvedValue(updatedModule);
    const result = await new UpdateMenuHandler(menuRepo, moduleRepo).execute(
      new UpdateMenuCommand('menu-id', {
        moduleId: updatedModule.id,
        name: 'Nuevo',
      }),
    );
    expect(result.module).toBe(updatedModule);
    expect(MenuResponseDto.from(result).moduleId).toBe(updatedModule.id);
  });

  it('activa y desactiva sin guardar de nuevo cuando ya tiene el estado solicitado', async () => {
    const handler = new SetMenuActiveHandler(menuRepo);
    const inactive = { id: 'menu-id', active: false } as Menu;
    findOneBy.mockResolvedValue(inactive);
    await handler.execute(new SetMenuActiveCommand('menu-id', true));
    expect(save).toHaveBeenCalledWith(inactive);
    expect(inactive.active).toBe(true);
    vi.clearAllMocks();
    await handler.execute(new SetMenuActiveCommand('menu-id', true));
    expect(save).not.toHaveBeenCalled();
    await handler.execute(new SetMenuActiveCommand('menu-id', false));
    expect(inactive.active).toBe(false);
  });

  it('no elimina menús con roles asociados', async () => {
    exists.mockResolvedValue(true);
    await expect(
      new DeleteMenuHandler(unitOfWork).execute(
        new DeleteMenuCommand('menu-id'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(exists).toHaveBeenCalledWith(RoleMenu, {
      where: { menu: { id: 'menu-id' } },
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('elimina un menú sin roles en una transacción', async () => {
    await new DeleteMenuHandler(unitOfWork).execute(
      new DeleteMenuCommand('menu-id'),
    );
    expect(findOne).toHaveBeenCalledWith(Menu, {
      where: { id: 'menu-id' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(remove).toHaveBeenCalled();
  });
});
