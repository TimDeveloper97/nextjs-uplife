import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {StoreLocation} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class StoreLocationRepository extends TimeStampRepository<StoreLocation, typeof StoreLocation.prototype.id> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(StoreLocation, dataSource);
  }
}
