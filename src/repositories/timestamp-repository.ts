import {DefaultCrudRepository, Entity, juggler} from '@loopback/repository';
import {Timestamp} from '../models/common/timestamp.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
export class TimeStampRepository<T extends Timestamp, ID, Relations extends object = {}> extends DefaultCrudRepository<
  T,
  ID,
  Relations
> {
  constructor(public entityClass: typeof Entity & {prototype: T}, public dataSource: juggler.DataSource) {
    super(entityClass, dataSource);
  }

  async create(entity: any, options?: any) {
    entity.createAt = new Date();
    entity.updateAt = new Date();
    return super.create(entity, options);
  }

  async updateAll(data: any, where?: any, options?: any) {
    data.updateAt = new Date();
    return super.updateAll(data, where, options);
  }

  async replaceById(id: any, data: any, options?: any) {
    data.updateAt = new Date();
    return super.replaceById(id, data, options);
  }
}
