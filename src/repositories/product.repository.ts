import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Product} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class ProductRepository extends TimeStampRepository<Product, typeof Product.prototype.id> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Product, dataSource);
  }
}
