import {model, property, belongsTo} from '@loopback/repository';
import {Store} from './store.model';
import {Category} from './category.model';
import {Timestamp} from './common/timestamp.model';

@model()
export class Product extends Timestamp {
  @property({type: 'string', id: true, mongodb: {dataType: 'ObjectID'}})
  id: string;

  @belongsTo(() => Store, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  storeId: string;
  store?: Store;

  @belongsTo(() => Category, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  categoryId: string;
  category?: Category;

  @property({default: 'default.png'})
  imgUrl: string;

  @property({required: true})
  name: string;

  @property({required: true, default: 0})
  point: number;

  @property({required: true})
  dueDate: Date;

  @property({required: true, default: 0})
  quantity: number;

  @property({required: true, default: 0})
  total: number;

  constructor(data?: Partial<Product>) {
    super(data);
  }
}
