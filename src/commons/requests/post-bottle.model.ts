import {model, property, Entity} from '@loopback/repository';
import {Validate} from '../validate';

@model({settings: {strict: false}})
export class PostBottleModel extends Entity {
  @property({required: true})
  bottleVolumn: number;

  constructor(data?: Partial<PostBottleModel>) {
    super(data);
    Validate.bottle(this.bottleVolumn);
  }
}
