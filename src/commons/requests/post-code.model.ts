import {model, property, Entity} from '@loopback/repository';

@model()
export class PostQRCodeModel extends Entity {
  @property({required: true})
  codeQR: string;

  constructor(data?: Partial<PostQRCodeModel>) {
    super(data);
  }
}
