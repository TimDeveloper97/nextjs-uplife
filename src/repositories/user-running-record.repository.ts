import {UserRunningRecord} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {TimeStampRepository} from './timestamp-repository';

export class UserRunningRecordRepository extends TimeStampRepository<UserRunningRecord, typeof UserRunningRecord.prototype.id> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(UserRunningRecord, dataSource);
  }
}
