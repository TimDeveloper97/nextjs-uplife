import {property, hasMany, model} from '@loopback/repository';
import {StoreLocation} from './store-location.model';
import {Account} from './common/account.model';
import {Product} from './product.model';

@model()
export class Store extends Account {
  @property({type: 'string', default: ''})
  name: string;

  @property({required: true, default: 'default.png'})
  imgUrl: string;

  @property({required: true, default: 'all day'})
  openingDays: string;

  @property({required: true, default: '24/24'})
  openingHours: string;

  @property({required: true, default: 'unknown'})
  typeStation: string;

  @property({required: true, default: 'unknown'})
  address: string;

  @hasMany(() => StoreLocation)
  locations?: StoreLocation[];

  @hasMany(() => Product)
  products?: Product[];

  getDefaultRole(): string[] {
    return ['store'];
  }

  constructor(data?: Partial<Store>) {
    super(data);
    this.roles = this.getDefaultRole();
  }
}
