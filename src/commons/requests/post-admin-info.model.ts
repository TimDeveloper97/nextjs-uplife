import {model, property, Entity} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostAdminInfoModel extends Entity {
  @property({required: true})
  name: string;

  constructor(data?: Partial<PostAdminInfoModel>) {
    super(data);
    Validate.acountName(this.name);
  }
}
