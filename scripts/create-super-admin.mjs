import { AppDataSource } from '../dist/database/data-source.js';
import { Argon2PasswordHasherAdapter } from '../dist/shared/security/password/argon2-password-hasher.adapter.js';
import { Person } from '../dist/features/access-control/entities/person.entity.js';
import { Role } from '../dist/features/access-control/entities/roles.entity.js';
import { User } from '../dist/features/access-control/entities/user.entity.js';
import { UserRole } from '../dist/features/access-control/entities/user_roles.entity.js';
import { ROLE_CODES } from '../dist/shared/authorization/role-codes.js';
import { SYSTEM_CODES } from '../dist/shared/authorization/system-codes.js';
import { System } from '../dist/features/access-control/entities/system.entity.js';

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Falta definir ${name} en el entorno.`);
  return value.trim();
}

async function main() {
  const userData = {
    email: required('SUPER_ADMIN_EMAIL'),
    nickName: required('SUPER_ADMIN_NICK_NAME'),
    password: required('SUPER_ADMIN_PASSWORD'),
    firstName: required('SUPER_ADMIN_FIRST_NAME'),
    lastName: required('SUPER_ADMIN_LAST_NAME'),
    identityDocument: required('SUPER_ADMIN_IDENTITY_DOCUMENT'),
    dateOfBirth: required('SUPER_ADMIN_DATE_OF_BIRTH'),
  };

  if (userData.password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  }

  await AppDataSource.initialize();
  try {
    const created = await AppDataSource.transaction(async (manager) => {
      const emailNormalized = userData.email.toUpperCase();
      const existingUser = await manager.findOneBy(User, { emailNormalized });
      if (existingUser) {
        if (!process.argv.includes('--if-exists')) {
          throw new Error('Ya existe un usuario con ese correo.');
        }
        const activeRole = await manager.getRepository(UserRole)
          .createQueryBuilder('userRole')
          .innerJoin('userRole.role', 'role')
          .where('userRole.user_id = :userId', { userId: existingUser.id })
          .andWhere('role.code = :code', { code: ROLE_CODES.SUPER_ADMIN })
          .andWhere('userRole.valid_from <= CURRENT_DATE')
          .andWhere('(userRole.valid_until IS NULL OR userRole.valid_until >= CURRENT_DATE)')
          .getOne();
        if (!existingUser.active || !activeRole) {
          throw new Error('El usuario existente no es un superadministrador activo con rol vigente.');
        }
        return false;
      }
      const roleRepository = manager.getRepository(Role);
      let system = await manager.findOneBy(System, {
        code: SYSTEM_CODES.ACCESS_CONTROL,
      });
      if (!system) {
        system = await manager.save(manager.create(System, {
          code: SYSTEM_CODES.ACCESS_CONTROL,
          name: 'Control de acceso',
          description: 'Administración de usuarios y permisos',
        }));
      }
      const role =
        (await roleRepository.findOneBy({ code: ROLE_CODES.SUPER_ADMIN })) ??
        (await roleRepository.save(
          roleRepository.create({
            code: ROLE_CODES.SUPER_ADMIN,
            name: 'Super administrador',
            description: 'Rol de super administrador',
            system,
          }),
        ));

      const person = await manager.save(
        manager.create(Person, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          identityDocument: userData.identityDocument,
          dateOfBirth: userData.dateOfBirth,
        }),
      );
      const user = await manager.save(
        manager.create(User, {
          email: userData.email,
          emailNormalized,
          nickName: userData.nickName,
          nickNameNormalized: userData.nickName.toUpperCase(),
          passwordHash: await new Argon2PasswordHasherAdapter().hash(
            userData.password,
          ),
          emailVerificationToken: null,
          persona: person,
        }),
      );

      await manager.save(
        manager.create(UserRole, {
          user,
          role,
          validFrom: new Date().toISOString().slice(0, 10),
          validUntil: null,
        }),
      );
      return true;
    });

    console.log(created ? 'Usuario super-admin creado.' : 'El super-admin ya existe; no se modificó.');
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
