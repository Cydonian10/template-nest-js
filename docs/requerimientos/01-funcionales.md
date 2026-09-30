# Requisitos funcionales

## Índice

- [Autenticación](#autenticación)
- [Usuarios y personas](#usuarios-y-personas)
- [Menús](#menús)
- [Módulos](#módulos)
- [Sistemas](#sistemas)
- [Roles](#roles)
- [Permisos](#permisos)

## Autenticación

### RF-AUTH-001

- El sistema permitirá iniciar sesión con credenciales válidas.

### RF-AUTH-002

- El sistema permitirá recuperar y restablecer la contraseña de un usuario.

## Usuarios y personas

### RF-USER-003

- El sistema permitirá registrar usuarios junto con la información de su persona asociada.

### RF-USER-004

- El sistema permitirá editar la información de los usuarios y de sus personas asociadas, incluida la contraseña del usuario, que se almacenará únicamente como hash.

### RF-USER-005

- El sistema permitirá activar o desactivar usuarios y sus personas asociadas de forma independiente.

### RF-USER-006

- El sistema permitirá listar usuarios junto con la información de sus personas asociadas.

## Menús

### RF-MENU-007

- El sistema permitirá registrar menús.

### RF-MENU-008

- El sistema permitirá eliminar un menú siempre que no esté asociado a un rol.

### RF-MENU-009

- El sistema permitirá editar menús.

### RF-MENU-010

- El sistema permitirá listar menús.

### RF-MENU-011

- El sistema permitirá asignar menús a módulos.

### RF-MENU-012

- El sistema permitirá desactivar menús.

## Módulos

### RF-MOD-013

- El sistema permitirá registrar módulos.

### RF-MOD-014

- El sistema permitirá eliminar un módulo siempre que no esté asociado a un sistema.

### RF-MOD-015

- El sistema permitirá editar módulos.

### RF-MOD-016

- El sistema permitirá listar módulos.

### RF-MOD-017

- El sistema permitirá asignar módulos a sistemas.

### RF-MOD-018

- El sistema permitirá desactivar módulos.

## Sistemas

### RF-SYS-019

- El sistema permitirá registrar sistemas.

### RF-SYS-020

- El sistema permitirá eliminar un sistema siempre que no tenga módulos asociados.

### RF-SYS-021

- El sistema permitirá editar sistemas.

### RF-SYS-022

- El sistema permitirá listar sistemas.

### RF-SYS-023

- El sistema permitirá desactivar sistemas.

## Roles

### RF-ROLE-024

- El sistema permitirá registrar roles y generar un código único a partir del nombre según el modelo de roles.

### RF-ROLE-025

- El sistema permitirá eliminar un rol siempre que no esté asignado a ningún usuario ni tenga permisos o menús asociados.

### RF-ROLE-026

- El sistema permitirá editar el nombre y la descripción de roles sin modificar automáticamente su código.

### RF-ROLE-027

- El sistema permitirá listar roles.

### RF-ROLE-028

- El sistema permitirá asignar roles a usuarios y retirar asignaciones existentes, sin dejar al sistema sin un SuperAdmin vigente.

### RF-ROLE-029

- El sistema permitirá definir fechas de vigencia al asignar un rol a un usuario; la fecha final no podrá preceder a la inicial.

### RF-ROLE-030

- El sistema permitirá asignar roles sin fecha de vencimiento.

### RF-ROLE-034

- El sistema permitirá asignar permisos a roles y retirar esas asignaciones.

### RF-ROLE-035

- El sistema permitirá asignar menús a roles y retirar esas asignaciones.

### RF-ROLE-036

- Al listar roles, el sistema mostrará las asignaciones de usuarios, permisos y menús sin exponer datos sensibles de usuarios.

## Permisos

### RF-PERM-031

- El sistema permitirá registrar permisos.

### RF-PERM-032

- El sistema permitirá listar permisos.

### RF-PERM-033

- El sistema permitirá ejecutar un seed idempotente para crear o actualizar los permisos administrados por la aplicación sin borrar permisos adicionales.
