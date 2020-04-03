import {property, Model, model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class RespCardModel extends Model {
  @property()
  id: string;

  @property()
  address: string;

  @property()
  name: string;

  constructor(data?: Partial<RespCardModel>) {
    const properties = getJsonSchema(RespCardModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
  }
}
