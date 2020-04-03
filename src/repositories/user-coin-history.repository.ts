import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {UserCoinHistory} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class UserCoinHistoryRepository extends TimeStampRepository<
  UserCoinHistory,
  typeof UserCoinHistory.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(UserCoinHistory, dataSource);
  }
}
