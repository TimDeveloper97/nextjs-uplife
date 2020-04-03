import {HasManyRepositoryFactory, repository, juggler} from '@loopback/repository';
import {User, UserStepHistory, UserRefillHistory, UserExchangeHistory, UserRunningRecord, Card} from '../models';
import {inject} from '@loopback/core';
import {CardRepository} from './card.repository';
import {TimeStampRepository} from './timestamp-repository';
import {UserStepHistoryRepository} from './user-step-history.repository';
import {UserRefillHistoryRepository} from './user-refill-history.repository';
import {UserExchangeHistoryRepository} from './user-exchange-history.repository';
import {UserRunningRecordRepository} from './user-running-record.repository';
import {Getter} from '@loopback/context';
import {UserCoinHistory} from '../models/user-coin-history.model';
import {UserCoinHistoryRepository} from './user-coin-history.repository';

export class UserRepository extends TimeStampRepository<User, typeof User.prototype.id> {
  public readonly card: HasManyRepositoryFactory<Card, typeof User.prototype.id>;
  public readonly stepHistory: HasManyRepositoryFactory<UserStepHistory, typeof User.prototype.id>;
  public readonly refillHistory: HasManyRepositoryFactory<UserRefillHistory, typeof User.prototype.id>;
  public readonly exchangeHistory: HasManyRepositoryFactory<UserExchangeHistory, typeof User.prototype.id>;
  public readonly runningRecord: HasManyRepositoryFactory<UserRunningRecord, typeof User.prototype.id>;
  public readonly coinHistory: HasManyRepositoryFactory<UserCoinHistory, typeof User.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: juggler.DataSource,
    @repository.getter('CardRepository')
    cardRepositoryGetter: Getter<CardRepository>,
    @repository.getter('UserStepHistoryRepository')
    userStepHistoryRepositoryGetter: Getter<UserStepHistoryRepository>,
    @repository.getter('UserRefillHistoryRepository')
    userRefillHistoryRepositoryGetter: Getter<UserRefillHistoryRepository>,
    @repository.getter('UserExchangeHistoryRepository')
    userExchangeHistoryRepositoryGetter: Getter<UserExchangeHistoryRepository>,
    @repository.getter('UserRunningRecordRepository')
    userRunningRecordRepositoryGetter: Getter<UserRunningRecordRepository>,
    @repository.getter('UserCoinHistoryRepository')
    userCoinHistoryRepositoryGetter: Getter<UserCoinHistoryRepository>,
  ) {
    super(User, dataSource);
    this.card = this.createHasManyRepositoryFactoryFor('card', cardRepositoryGetter);
    this.stepHistory = this.createHasManyRepositoryFactoryFor('stepHistory', userStepHistoryRepositoryGetter);
    this.coinHistory = this.createHasManyRepositoryFactoryFor('coinHistory', userCoinHistoryRepositoryGetter);
    this.refillHistory = this.createHasManyRepositoryFactoryFor('refillHistory', userRefillHistoryRepositoryGetter);
    this.exchangeHistory = this.createHasManyRepositoryFactoryFor(
      'exchangeHistory',
      userExchangeHistoryRepositoryGetter,
    );
    this.runningRecord = this.createHasManyRepositoryFactoryFor('runningRecord', userRunningRecordRepositoryGetter);
  }
}
