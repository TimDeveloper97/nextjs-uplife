import {Store, Product, Category} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {RespStoreFewInfoModel, RespCategoryInfoModel} from '../responses';
// import _ = require('lodash');
import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

@model()
export class RespProductModel extends Model {
  @property()
  id: string;
  @property()
  imgUrl: string;
  @property()
  name: string;
  @property()
  point: number;
  @property()
  quantity: number;
  @property()
  total: number;
  @property()
  dueDate: Date;
  @property()
  store?: RespStoreFewInfoModel;
  @property()
  category?: RespCategoryInfoModel;
  @property()
  userEnoughPoint?: boolean;

  constructor(product: Product, store?: Store, category?: Category, userPoint?: number) {
    super();
    this.id = product.id;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Product.Url, product.imgUrl);
    this.name = product.name;
    this.point = product.point;
    this.quantity = product.quantity;
    this.total = product.total;
    this.dueDate = product.dueDate;
    if (userPoint !== undefined) {
      this.userEnoughPoint = userPoint >= this.point;
    }
    if (store) {
      this.store = new RespStoreFewInfoModel(store);
    }
    if (category) {
      this.category = new RespCategoryInfoModel(category);
    }
  }
}
