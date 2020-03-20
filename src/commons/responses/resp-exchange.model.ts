import {RespStoreFewInfoModel, RespCategoryInfoModel} from '.';
import {UserExchangeHistory} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';

import {model, property, Model} from '@loopback/repository';

@model()
export class RespExchangeModel extends Model {
  @property()
  id: string;
  @property()
  imgUrl: string;
  @property()
  name: string;
  @property()
  point: number;
  @property()
  dueDate: Date;
  @property()
  store?: RespStoreFewInfoModel;
  @property()
  category?: RespCategoryInfoModel;
  @property()
  isAvailable: boolean;

  constructor(exchange: UserExchangeHistory) {
    super();
    this.id = exchange.id;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Product.Url, exchange.product ? exchange.product.imgUrl : '');
    this.name = exchange.product ? exchange.product.name : '';
    this.point = exchange.point;
    this.dueDate = exchange.dueDate;
    this.isAvailable = !exchange.received && exchange.dueDate >= new Date();
    this.store = exchange.product && exchange.product.store && new RespStoreFewInfoModel(exchange.product.store);
    this.category =
      exchange.product && exchange.product.category && new RespCategoryInfoModel(exchange.product.category);
  }
}
