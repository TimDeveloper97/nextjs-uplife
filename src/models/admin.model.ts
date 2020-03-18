import {Account} from './common/account.model';
import {property, model} from '@loopback/repository';

@model()
export class Admin extends Account {
  @property({type: 'string', default: ''})
  name: string;

  @property({default: 'default.png'})
  imgUrl: string;

  constructor(data?: Partial<Admin>) {
    super(data);
    this.roles = this.getDefaultRole();
  }

  getDefaultRole(): string[] {
    return ['admin'];
  }
}
