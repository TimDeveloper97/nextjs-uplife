import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {UserStepHistory} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class UserStepHistoryRepository extends TimeStampRepository<
  UserStepHistory,
  typeof UserStepHistory.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(UserStepHistory, dataSource);
  }
}
