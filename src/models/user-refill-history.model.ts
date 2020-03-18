import {model, property, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import {StoreLocation} from './store-location.model';
import {User} from './user.model';
import {Store} from './store.model';

@model()
export class UserRefillHistory extends Timestamp {
  @property({id: true})
  id: string;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: string;

  @belongsTo(() => Store, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  storeId: string;

  @belongsTo(() => StoreLocation, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  storeLocationId: string;

  @property({required: true})
  lat: number;

  @property({required: true})
  lng: number;

  constructor(data?: Partial<UserRefillHistory>) {
    super(data);
  }
}
