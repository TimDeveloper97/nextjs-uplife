import {property, Entity, model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class PostPointModel extends Entity {
  @property({required: true})
  point: number;

  constructor(data?: Partial<PostPointModel>) {
    const properties = getJsonSchema(PostPointModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
  }
}
