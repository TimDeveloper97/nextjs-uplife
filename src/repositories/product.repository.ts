import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Product, Category} from '../models';
import {TimeStampRepository} from './timestamp-repository';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {CategoryRepository} from './category.repository';
import {Getter} from '@loopback/context';
import {StoreRepository} from './store.repository';

export class ProductRepository extends TimeStampRepository<Product, typeof Product.prototype.id> {
  public readonly category: BelongsToAccessor<Category, typeof Product.prototype.id>;
  public readonly store: BelongsToAccessor<Category, typeof Product.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter('StoreRepository') storeRepositoryGetter: Getter<StoreRepository>,
    @repository.getter('CategoryRepository') categoryRepositoryGetter: Getter<CategoryRepository>,
  ) {
    super(Product, dataSource);
    this.store = this.createBelongsToAccessorFor('store', storeRepositoryGetter);
    this.category = this.createBelongsToAccessorFor('category', categoryRepositoryGetter);

    this.registerInclusionResolver('store', this.store.inclusionResolver);
    this.registerInclusionResolver('category', this.category.inclusionResolver);
  }
}
