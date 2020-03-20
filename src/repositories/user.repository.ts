import {HasManyRepositoryFactory, repository, juggler} from '@loopback/repository';
import {User, UserStepHistory, UserRefillHistory, UserExchangeHistory, UserRunningRecord} from '../models';
import {inject} from '@loopback/core';
import {TimeStampRepository} from './timestamp-repository';
import {UserStepHistoryRepository} from './user-step-history.repository';
import {UserRefillHistoryRepository} from './user-refill-history.repository';
import {UserExchangeHistoryRepository} from './user-exchange-history.repository';
import {UserRunningRecordRepository} from './user-running-record.repository';
import {Getter} from '@loopback/context';

export class UserRepository extends TimeStampRepository<User, typeof User.prototype.id> {
  public readonly stepHistory: HasManyRepositoryFactory<UserStepHistory, typeof User.prototype.id>;
  public readonly refillHistory: HasManyRepositoryFactory<UserRefillHistory, typeof User.prototype.id>;
  public readonly exchangeHistory: HasManyRepositoryFactory<UserExchangeHistory, typeof User.prototype.id>;
  public readonly runningRecord: HasManyRepositoryFactory<UserRunningRecord, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: juggler.DataSource,
    @repository.getter('UserStepHistoryRepository')
    userStepHistoryRepositoryGetter: Getter<UserStepHistoryRepository>,
    @repository.getter('UserRefillHistoryRepository')
    userRefillHistoryRepositoryGetter: Getter<UserRefillHistoryRepository>,
    @repository.getter('UserExchangeHistoryRepository')
    userExchangeHistoryRepositoryGetter: Getter<UserExchangeHistoryRepository>,
    @repository.getter('UserRunningRecordRepository')
    userRunningRecordRepositoryGetter: Getter<UserRunningRecordRepository>,
  ) {
    super(User, dataSource);
    this.stepHistory = this.createHasManyRepositoryFactoryFor('stepHistory', userStepHistoryRepositoryGetter);
    this.refillHistory = this.createHasManyRepositoryFactoryFor('refillHistory', userRefillHistoryRepositoryGetter);
    this.exchangeHistory = this.createHasManyRepositoryFactoryFor(
      'exchangeHistory',
      userExchangeHistoryRepositoryGetter,
    );
    this.runningRecord = this.createHasManyRepositoryFactoryFor('runningRecord', userRunningRecordRepositoryGetter);
  }
}
