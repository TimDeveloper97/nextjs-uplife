import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {StoreLocation, Store} from '../models';
import {TimeStampRepository} from './timestamp-repository';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {StoreRepository} from './store.repository';
import {Getter} from '@loopback/context';

export class StoreLocationRepository extends TimeStampRepository<StoreLocation, typeof StoreLocation.prototype.id> {
  public readonly store: BelongsToAccessor<Store, typeof StoreLocation.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter('StoreRepository') storeRepositoryGetter: Getter<StoreRepository>,
  ) {
    super(StoreLocation, dataSource);
    this.store = this.createBelongsToAccessorFor('store', storeRepositoryGetter);

    this.registerInclusionResolver('store', this.store.inclusionResolver);
  }
}
