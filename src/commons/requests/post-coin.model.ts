import {property, Entity, model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class PostCoinModel extends Entity {
  @property({required: true})
  coin: number;

  @property({required: true})
  address: string;

  constructor(data?: Partial<PostCoinModel>) {
    const properties = getJsonSchema(PostCoinModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
  }
}
