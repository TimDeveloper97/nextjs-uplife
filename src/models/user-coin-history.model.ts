import {model, property, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import { User } from './user.model';

@model()
export class UserCoinHistory extends Timestamp {
  @property({id: true})
  id: string;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: string;

  @property()
  time: Date;
  @property()
  coin: number;
  @property()
  point: number;

  constructor(data?: Partial<UserCoinHistory>) {
    super(data);
  }
}
