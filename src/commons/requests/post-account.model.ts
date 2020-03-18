import {model, property, Entity} from '@loopback/repository';

@model()
export class PostAccountModel extends Entity {
  @property({required: true, jsonSchema: {format: 'email'}})
  email: string;
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 8,
      format: 'regex',
      pattern: '[a-zA-Z0-9!@#$%^&*_+ ]{8,}',
    },
  })
  password: string;
  @property({
    type: 'string',
    required: true,
    jsonSchema: {minLength: 6, format: 'regex', pattern: '[a-zA-Z0-9 -]{6,}'},
  })
  name: string;

  constructor(data?: Partial<PostAccountModel>) {
    super(data);
  }
}
