import {RespStoreFewInfoModel, RespCategoryInfoModel} from '.';
import {UserExchangeHistory, Product, Store, Category} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';

// import _ = require('lodash');
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

  constructor(exchange: UserExchangeHistory, product: Product, store?: Store, category?: Category) {
    super();
    this.id = exchange.id;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Product.Url, product.imgUrl);
    this.name = product.name;
    this.point = exchange.point;
    this.dueDate = exchange.dueDate;
    this.isAvailable = !exchange.received && exchange.dueDate >= new Date();

    if (store) {
      this.store = new RespStoreFewInfoModel(store);
    }
    if (category) {
      this.category = new RespCategoryInfoModel(category);
    }
  }
}
