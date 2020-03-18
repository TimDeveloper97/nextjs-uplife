import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {UserRefillHistory} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class UserRefillHistoryRepository extends TimeStampRepository<
  UserRefillHistory,
  typeof UserRefillHistory.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(UserRefillHistory, dataSource);
  }
}
