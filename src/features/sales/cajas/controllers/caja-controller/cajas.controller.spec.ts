import { CajasController } from './cajas.controller.js';

describe('CajasController', () => {
  it('responde con un mensaje al crear una caja', () => {
    const controller = new CajasController();

    expect(controller.create({ nombre: 'Caja principal' })).toEqual({
      mensaje: 'Creando cajas',
    });
  });
});
