import {HasManyRepositoryFactory, repository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Category, Product} from '../models';
import {ProductRepository} from './product.repository';
import {TimeStampRepository} from './timestamp-repository';

export class CategoryRepository extends TimeStampRepository<Category, typeof Category.prototype.id> {
  public products: HasManyRepositoryFactory<Product, typeof Category.prototype.id>;
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository(ProductRepository) productRepository: ProductRepository,
  ) {
    super(Category, dataSource);
    this.products = this.createHasManyRepositoryFactoryFor('products', async () => productRepository);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.startUp();
  }

  static isStartup = true;
  static categories = ['drink', 'food', 'pie', 'ticket', 'other'];

  private async startUp() {
    if (CategoryRepository.isStartup) {
      await Promise.all(
        CategoryRepository.categories.map(async item => {
          const category = await this.findOne({where: {name: item}});
          if (!category) await this.create(new Category({name: item}));
        }),
      );
      CategoryRepository.isStartup = false;
    }
  }
}
