import {model, property, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import {User} from './user.model';

@model()
export class UserStepHistory extends Timestamp {
  @property({id: true})
  id: string;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: String;

  @property({required: true})
  date: Date;

  @property({required: true, default: 0})
  step: number;

  constructor(data?: Partial<UserStepHistory>) {
    super(data);
  }
}
