import {model, property, Model} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class RespCategoryInfoModel extends Model {
  @property({type: 'string'})
  name: string;

  constructor(data?: Partial<RespCategoryInfoModel>) {
    const properties = getJsonSchema(RespCategoryInfoModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
  }
}
