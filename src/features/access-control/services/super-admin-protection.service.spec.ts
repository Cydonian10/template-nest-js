import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { Role } from '../entities/roles.entity.js';
import { UserRole } from '../entities/user_roles.entity.js';
import { SuperAdminProtectionService } from './super-admin-protection.service.js';

describe('SuperAdminProtectionService', () => {
  const findOne = vi.fn();
  const query = {
    innerJoin: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getRawOne: vi.fn(),
  };
  const manager = { findOne, createQueryBuilder: vi.fn(() => query) } as unknown as EntityManager;
  const service = new SuperAdminProtectionService();
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    vi.clearAllMocks();
    findOne.mockImplementation(async (entity: object) => entity === Role
      ? { id: 'role-id' }
      : { id: 'assignment-id', validFrom: today, validUntil: null, user: { active: true, persona: { active: true } } });
    query.getRawOne.mockResolvedValue({ count: '0' });
  });

  it('rechaza quitar la última asignación vigente a un SuperAdmin activo', async () => {
    await expect(service.ensureCanRemoveAssignment(manager, 'user-id', 'assignment-id')).rejects.toBeInstanceOf(ConflictException);
    expect(findOne).toHaveBeenCalledWith(Role, { where: { code: 'SUPER_ADMIN' }, lock: { mode: 'pessimistic_write' } });
    expect(query.andWhere).toHaveBeenCalledWith('assignment.id != :assignmentId', { assignmentId: 'assignment-id' });
  });

  it('permite retirarla si queda otra asignación vigente, incluso del mismo usuario', async () => {
    query.getRawOne.mockResolvedValue({ count: '1' });
    await expect(service.ensureCanRemoveAssignment(manager, 'user-id', 'assignment-id')).resolves.toBeUndefined();
  });

  it('permite retirar una asignación vencida', async () => {
    findOne.mockImplementation(async (entity: object) => entity === Role
      ? { id: 'role-id' }
      : { id: 'assignment-id', validFrom: today, validUntil: '2020-01-01', user: { active: true, persona: { active: true } } });
    await expect(service.ensureCanRemoveAssignment(manager, 'user-id', 'assignment-id')).resolves.toBeUndefined();
    expect(findOne).toHaveBeenCalledWith(UserRole, expect.objectContaining({ where: { id: 'assignment-id', user: { id: 'user-id' } } }));
  });
});
