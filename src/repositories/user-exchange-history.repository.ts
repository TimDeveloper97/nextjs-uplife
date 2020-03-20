import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {UserExchangeHistory, User, Product} from '../models';
import {TimeStampRepository} from './timestamp-repository';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {Getter} from '@loopback/context';
import {UserRepository} from './user.repository';
import {ProductRepository} from './product.repository';

export class UserExchangeHistoryRepository extends TimeStampRepository<
  UserExchangeHistory,
  typeof UserExchangeHistory.prototype.id
> {
  public readonly user: BelongsToAccessor<User, typeof UserExchangeHistory.prototype.id>;
  public readonly product: BelongsToAccessor<Product, typeof UserExchangeHistory.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter('UserRepository') userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('ProductRepository') productRepositoryGetter: Getter<ProductRepository>,
  ) {
    super(UserExchangeHistory, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter);

    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
