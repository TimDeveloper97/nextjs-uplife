import {model, Entity, property} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostUserInfoModel extends Entity {
  @property({required: true})
  name: string;

  constructor(data?: Partial<PostUserInfoModel>) {
    super(data);
    Validate.acountName(this.name);
  }
}
