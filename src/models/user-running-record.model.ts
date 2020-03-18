import {model, property, belongsTo} from '@loopback/repository';
import {Timestamp} from './common/timestamp.model';
import {Geopoint} from './common/geopoint.model';
import {User} from './user.model';

@model()
export class UserRunningRecord extends Timestamp {
  @property({type: 'string', id: true, mongodb: {dataType: 'ObjectID'}})
  id: string;

  @property({type: Date, required: true})
  startTime: Date;

  @property({type: Date, required: true})
  endTime: Date;

  @belongsTo(() => User, undefined, {type: 'string', mongodb: {dataType: 'ObjectID'}})
  userId: string;

  @property.array(Geopoint, {required: true})
  path: Geopoint[];

  @property({type: 'number', default: 0})
  totalStep?: Number;

  @property({type: 'number', default: 0})
  totalCalorie?: Number;

  @property({type: 'number', default: 0})
  totalDistance?: Number;

  @property({type: 'string', default: ''})
  recordImageUrl?: string;

  @property.array(String, {default: []})
  selfieImageUrl?: string[];

  @property({type: 'string', default: ''})
  title?: string;

  @property({type: 'string', default: ''})
  description?: string;

  constructor(data?: Partial<UserRunningRecord>) {
    super(data);
  }
}
