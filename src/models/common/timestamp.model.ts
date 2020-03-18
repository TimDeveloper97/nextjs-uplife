import {Entity, property} from '@loopback/repository';

export class Timestamp extends Entity {
  @property({type: Date, hidden: true})
  createAt: Date;

  @property({type: Date, hidden: true})
  updateAt: Date;

  constructor(data?: Partial<Timestamp>) {
    super(data);
  }
}
