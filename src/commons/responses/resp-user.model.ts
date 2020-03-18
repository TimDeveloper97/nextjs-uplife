import {User} from '../../models';
import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

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

  constructor(user: User) {
    super();
    this.name = user.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.User.Url, user.imgUrl);
    this.currentPoint = user.currentPoint;
    this.bottleVolumn = user.bottleVolumn;
  }
}
