import {model, Entity, property} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostLocationRefillModel extends Entity {
  @property({required: true, default: 'unknown'})
  address: string;
  @property({required: true})
  lat: number;
  @property({required: true})
  lng: number;
  @property({required: true})
  bottleVolumn: number;
  @property({default: 0})
  currentWatter: number;
  @property({required: true})
  refillPrice: number;

  constructor(data?: Partial<PostLocationRefillModel>) {
    super(data);
    Validate.latLng(this.lat, this.lng);
    Validate.bottle(this.bottleVolumn);
    Validate.currentWater(this.bottleVolumn, this.currentWatter);
    Validate.price(this.refillPrice);
  }
}
