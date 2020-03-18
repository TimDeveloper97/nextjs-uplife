import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

@model()
export class RespTokenModel extends Model {
  @property()
  token: string;
}
