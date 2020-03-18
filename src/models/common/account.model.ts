import {Timestamp} from './timestamp.model';
import {property} from '@loopback/repository';

export abstract class Account extends Timestamp {
  @property({type: 'string', id: true, mongodb: {dataType: 'ObjectID'}})
  id: string;

  @property({
    type: 'string',
    required: true,
    index: {unique: true, name: 'uniqueEmail', key: 1},
  })
  email: string;

  @property({type: 'string', required: true})
  password: string;

  @property.array(String)
  roles: string[];

  constructor(data?: Partial<Account>) {
    super(data);
  }

  abstract getDefaultRole(): string[];
}
