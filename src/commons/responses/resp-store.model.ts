import {Store} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

@model()
export class RespStoreFewInfoModel extends Model {
  @property()
  id: string;
  @property()
  name: string;
  @property()
  imgUrl: string;
  @property()
  address: string;

  constructor(store: Store) {
    super();
    this.id = store.id;
    this.name = store.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Store.Url, store.imgUrl);
    this.address = store.address;
  }
}

@model()
export class RespStoreInfoModel extends Model {
  @property()
  name: string;
  @property()
  imgUrl: string;
  @property()
  openingDays: string;
  @property()
  openingHours: string;
  @property()
  typeStation: string;
  @property()
  address: string;

  constructor(store: Store) {
    super();
    this.name = store.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Store.Url, store.imgUrl);
    this.openingDays = store.openingDays;
    this.openingHours = store.openingHours;
    this.typeStation = store.typeStation;
    this.address = store.address;
  }
}
