import {model, property, hasMany} from '@loopback/repository';
import {Product} from '.';
import {Timestamp} from './common/timestamp.model';

@model()
export class Category extends Timestamp {
  @property({id: true, mongodb: {dataType: 'ObjectID'}})
  id: string;

  @property({required: true})
  name: string;

  @hasMany(() => Product)
  products?: Product[];

  constructor(data?: Partial<Category>) {
    super(data);
  }
}
