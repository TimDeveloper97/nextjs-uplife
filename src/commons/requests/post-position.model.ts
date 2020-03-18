import {model, property, Entity} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostPositionModel extends Entity {
  @property()
  lat: number;
  @property()
  lng: number;

  constructor(data?: Partial<PostPositionModel>) {
    super(data);
    Validate.latLng(this.lat, this.lng);
  }
}
