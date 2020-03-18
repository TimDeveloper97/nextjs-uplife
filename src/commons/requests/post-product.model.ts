import {model, property, Entity} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostProductModel extends Entity {
  @property({default: 'other'})
  categoryName: string;
  @property()
  imgUrl?: string;
  @property({required: true})
  name: string;
  @property({required: true, default: 0})
  point: number;
  @property({required: true})
  dueDate: Date;
  @property({required: true, default: 0})
  quantity: number;

  constructor(data?: Partial<PostProductModel>) {
    super(data);
    Validate.productName(this.name);
    this.point = Validate.point(this.point);
    this.dueDate = Validate.duedate(this.dueDate);
    this.quantity = Validate.quantity(this.quantity, this.quantity);
  }
}

@model()
export class PostProductEditModel extends Entity {
  @property({default: 'other'})
  categoryName: string;
  @property()
  imgUrl?: string;
  @property({required: true})
  name: string;
  @property({required: true, default: 0})
  point: number;
  @property({required: true})
  dueDate: Date;

  constructor(data?: Partial<PostProductModel>) {
    super(data);
    Validate.productName(this.name);
    this.point = Validate.point(this.point);
    this.dueDate = Validate.duedate(this.dueDate);
  }
}
