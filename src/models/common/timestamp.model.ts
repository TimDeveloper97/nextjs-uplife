import {Entity, property, model} from '@loopback/repository';

@model()
export class Timestamp extends Entity {
  @property({type: Date, hidden: true})
  createAt: Date;

  @property({type: Date, hidden: true})
  updateAt: Date;

  constructor(data?: Partial<Timestamp>) {
    super(data);
  }
}
