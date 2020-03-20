import {property, model, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import {Store} from './store.model';
import {ACCOUNT_STATE} from './common/account.model';

@model()
export class StoreLocation extends Timestamp {
  @property({id: true})
  id: string;

  @belongsTo(() => Store, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  storeId: string;
  store?: Store;

  @property({required: true, default: 'unknown'})
  address: string;

  @property({required: true, default: 0})
  lat: number;

  @property({required: true, default: 0})
  lng: number;

  @property({required: true, default: 0})
  bottleVolumn: number;

  @property({required: true, default: 0})
  currentWatter: number;

  @property({required: true, default: 0})
  refillPrice: number;

  @property({required: true, default: ACCOUNT_STATE.ACTIVE})
  state: string;

  constructor(data?: Partial<StoreLocation>) {
    super(data);
  }
}
