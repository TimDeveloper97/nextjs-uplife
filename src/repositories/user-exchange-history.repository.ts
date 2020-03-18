import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {UserExchangeHistory} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class UserExchangeHistoryRepository extends TimeStampRepository<
  UserExchangeHistory,
  typeof UserExchangeHistory.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(UserExchangeHistory, dataSource);
  }
}
