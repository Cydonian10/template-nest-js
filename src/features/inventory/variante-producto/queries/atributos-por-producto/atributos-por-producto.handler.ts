import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AtributoPorProductoQuery } from './atributos-por-producto.query.js';

@QueryHandler(AtributoPorProductoQuery)
export class AtributosPorProductoHandler implements IQueryHandler<AtributoPorProductoQuery> {
  execute(query: AtributoPorProductoQuery): Promise<any> {
    throw new Error('Method not implemented.');

    // listar todos los atributos con productoId null o si tien un valor
    // response
    // {
    //     productId: string | null
    //     atributoId: string
    //     atributo: strin
    // }
    // {
    //     productId: 'aksdjfakdjf-kasjñdfk-asdf'
    //     atributoId: 'askdjfakjdf-adfadf-akdjfañdj'
    //     atributo: talla
    // }
    // {
    //     productId: null
    //     atributoId: 'askdjfakjdf-adfadf-akdjfañdj'
    //     atributo: talla
    // }
  }
}
