import {Store, StoreLocation} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {model, Model, property} from '@loopback/repository';

@model()
export class RespLocationRefillModel extends Model {
  @property()
  id: string;
  @property()
  imgUrl: string;
  @property()
  address: string;
  @property()
  distance: string;
  @property()
  _distance?: number;
  @property()
  lat: number;
  @property()
  lng: number;

  constructor(store: Store, location: StoreLocation, distance: number) {
    super();
    this.id = location.id;
    this.address = location.address;
    this.lat = location.lat;
    this.lng = location.lng;

    this.imgUrl = Helper.toImageURL(Config.ImagePath.Store.Url, store.imgUrl);
    this.distance = Helper.distanceToString(distance);
  }
}

@model()
export class RespLocationRefillDetailModel extends Model {
  @property()
  id: string;
  @property()
  name: string;
  @property()
  imgUrl: string;
  @property()
  address: string;
  @property()
  openingDays: string;
  @property()
  openingHours: string;
  @property()
  refillPrice: number;
  @property()
  typeStation: string;
  @property()
  lat: number;
  @property()
  lng: number;
  @property()
  isValidPlace?: boolean;
  @property()
  distance?: string;

  constructor(store: Store, location: StoreLocation, distance?: number) {
    super();
    this.id = location.id;
    this.address = location.address;
    this.lat = location.lat;
    this.lng = location.lng;

    this.name = store.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Store.Url, store.imgUrl);
    this.openingDays = store.openingDays;
    this.openingHours = store.openingHours;
    this.refillPrice = location.refillPrice;
    this.typeStation = store.typeStation;

    this.distance = (distance !== undefined && Helper.distanceToString(distance)) || undefined;
    this.isValidPlace = (distance !== undefined && distance <= Config.MAX_REFILL_DISTANCE && true) || false;
  }

  setDistance(distance: number) {
    this.distance = (distance !== undefined && Helper.distanceToString(distance)) || undefined;
    this.isValidPlace = (distance !== undefined && distance <= Config.MAX_REFILL_DISTANCE && true) || false;
  }
}
