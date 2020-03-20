import {repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {ProductRepository} from './product.repository';
import {Store, Product, StoreLocation} from '../models';
import {StoreLocationRepository} from './store-location.repository';
import {TimeStampRepository} from './timestamp-repository';
import {Getter} from '@loopback/context';

export class StoreRepository extends TimeStampRepository<Store, typeof Store.prototype.id> {
  public readonly locations: HasManyRepositoryFactory<StoreLocation, typeof StoreLocation.prototype.id>;
  public readonly products: HasManyRepositoryFactory<Product, typeof Store.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter(StoreLocationRepository) storeLocationRepositoryGetter: Getter<StoreLocationRepository>,
    @repository.getter(ProductRepository) productRepositoryGetter: Getter<ProductRepository>,
  ) {
    super(Store, dataSource);
    this.locations = this.createHasManyRepositoryFactoryFor('locations', storeLocationRepositoryGetter);
    this.products = this.createHasManyRepositoryFactoryFor('products', productRepositoryGetter);
  }
}
