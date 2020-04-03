/* eslint-disable @typescript-eslint/no-explicit-any */
import {User} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';
import {CoinService} from '../../services';

const userEmail = Symbol('email');

@model()
export class RespUserInfoModel extends Model {
  @property()
  name: string;
  @property()
  imgUrl: string;
  @property()
  currentPoint: number;
  @property()
  bottleVolumn: number;
  @property()
  coin: number;

  constructor(user: User) {
    super();
    (this as any)[userEmail] = user.email;
    this.name = user.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.User.Url, user.imgUrl);
    this.currentPoint = user.currentPoint;
    this.bottleVolumn = user.bottleVolumn;
    this.coin = 0;
    return this;
  }

  async loadCoin() {
    this.coin = await CoinService.getUserCoin((this as any)[userEmail]);
    return this;
  }
}
