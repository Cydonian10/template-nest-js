// import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
// import { FindPermissionByRol } from './find-permision-by-rol.query.js';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Permission } from '../../../entities/permission.entity.js';

// @QueryHandler(FindPermissionByRol)
// export class FindAllRolesHandler implements IQueryHandler<FindPermissionByRol> {
//   constructor(
//     @InjectRepository(Permissions)
//     private readonly permissionRepo: Repository<Permission>,
//   ) {}

//   execute(query: FindPermissionByRol): Promise<{
//     // id: string;
//     // name: string;
//     // systemCode: string;
//     // systemName: string;
//     // systemId: string;
//     // resourceCode: string;
//     // actionCode: string;
//     // code: string;
//   }> {
//     // this.permissionRepo;
//     // return {};
//   }
// }
