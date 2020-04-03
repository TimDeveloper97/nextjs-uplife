import {property, Entity, model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class PostCardModel extends Entity {
  @property({required: true})
  address: string;

  @property({default: ''})
  name: string;

  constructor(data?: Partial<PostCardModel>) {
    const properties = getJsonSchema(PostCardModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
  }
}
