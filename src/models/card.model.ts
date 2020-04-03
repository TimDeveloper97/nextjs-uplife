import {Timestamp} from './common/timestamp.model';
import {property, belongsTo, model} from '@loopback/repository';
import {User} from './user.model';

@model()
export class Card extends Timestamp {
  @property({id: true, mongodb: {dataType: 'ObjectID'}})
  id: string;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: string;

  @property({required: true})
  address: string;

  @property({required: true, default: ''})
  name: string;

  constructor(data?: Partial<Card>) {
    super(data);
  }
}
