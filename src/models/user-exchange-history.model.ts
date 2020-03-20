import {property, model, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import {Product} from './product.model';
import {User} from '.';

@model()
export class UserExchangeHistory extends Timestamp {
  @property({id: true})
  id: string;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: string;

  @belongsTo(() => Product, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  productId: string;
  product?: Product;

  @property()
  received: boolean;

  @property({required: true})
  dueDate: Date;

  @property()
  point: number;

  constructor(data?: Partial<UserExchangeHistory>) {
    super(data);
  }
}
