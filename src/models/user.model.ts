import {model, property, hasMany} from '@loopback/repository';
import {Account} from './common/account.model';
import {UserStepHistory} from './user-step-history.model';
import {UserRefillHistory} from './user-refill-history.model';
import {UserExchangeHistory} from './user-exchange-history.model';
import {UserRunningRecord} from './user-running-record.model';

// @model({
//   settings: {
//     indexes: {
//       uniqueEmail: {
//         keys: {
//           email: 1,
//           password: 2,
//         },
//         options: {
//           unique: true,
//         },
//       },
//     },
//   },
// })
@model()
export class User extends Account {
  @property({default: 'default.png'})
  imgUrl: string;

  @property({required: true, default: 0})
  currentPoint: number;

  @property({required: true, default: 0})
  stepTemp: number;

  @property({required: true, default: 0})
  bottleVolumn: number;

  @hasMany(() => UserStepHistory)
  stepHistory?: UserStepHistory[];

  @hasMany(() => UserRefillHistory)
  refillHistory?: UserRefillHistory[];

  @hasMany(() => UserExchangeHistory)
  exchangeHistory?: UserExchangeHistory[];

  @hasMany(() => UserRunningRecord)
  runningRecord?: UserRunningRecord[];

  @property({type: 'string', default: ''})
  name: string;

  constructor(data?: Partial<User>) {
    super(data);
    this.roles = this.getDefaultRole();
  }

  getDefaultRole() {
    return ['user'];
  }
}
