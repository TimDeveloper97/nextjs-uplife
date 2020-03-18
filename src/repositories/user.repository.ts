import {HasManyRepositoryFactory, repository, juggler} from '@loopback/repository';
import {User, UserStepHistory, UserRefillHistory, UserExchangeHistory, UserRunningRecord} from '../models';
import {inject} from '@loopback/core';
import {TimeStampRepository} from './timestamp-repository';
import {UserStepHistoryRepository} from './user-step-history.repository';
import {UserRefillHistoryRepository} from './user-refill-history.repository';
import {UserExchangeHistoryRepository} from './user-exchange-history.repository';
import {UserRunningRecordRepository} from './user-running-record.repository';

export class UserRepository extends TimeStampRepository<User, typeof User.prototype.id> {
  public stepHistory: HasManyRepositoryFactory<UserStepHistory, typeof User.prototype.id>;
  public refillHistory: HasManyRepositoryFactory<UserRefillHistory, typeof User.prototype.id>;
  public exchangeHistory: HasManyRepositoryFactory<UserExchangeHistory, typeof User.prototype.id>;
  public runningRecord: HasManyRepositoryFactory<UserRunningRecord, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: juggler.DataSource,
    @repository(UserStepHistoryRepository)
    userStepHistoryRepository: UserStepHistoryRepository,
    @repository(UserRefillHistoryRepository)
    userRefillHistoryRepository: UserRefillHistoryRepository,
    @repository(UserExchangeHistoryRepository)
    userExchangeHistoryRepository: UserExchangeHistoryRepository,
    @repository(UserRunningRecordRepository)
    userRunningRecordRepository: UserRunningRecordRepository,
  ) {
    super(User, dataSource);
    this.stepHistory = this.createHasManyRepositoryFactoryFor('stepHistory', async () => userStepHistoryRepository);
    this.refillHistory = this.createHasManyRepositoryFactoryFor(
      'refillHistory',
      async () => userRefillHistoryRepository,
    );
    this.exchangeHistory = this.createHasManyRepositoryFactoryFor(
      'exchangeHistory',
      async () => userExchangeHistoryRepository,
    );
    this.runningRecord = this.createHasManyRepositoryFactoryFor(
      'runningRecord',
      async () => userRunningRecordRepository,
    );
  }
}
