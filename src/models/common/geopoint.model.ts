import {model, Model, property} from '@loopback/repository';

@model()
export class Geopoint extends Model {
  @property({type: 'number'})
  lat: number;
  
  @property({type: 'number'})
  lng: number;

  constructor(data?: Partial<Geopoint>) {
    super(data);
  }
}
