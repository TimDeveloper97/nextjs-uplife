import {model, property, Entity} from '@loopback/repository';

@model()
export class PostCredentialModel extends Entity {
  @property({require: true})
  email: string;
  @property({require: true})
  password: string;
}
