import {model, Model, property} from '@loopback/repository';
import {Admin} from '../../models';
import {Helper} from '../../utils';
import {Config} from '../../config';

@model()
export class RespAdminInfoModel extends Model {
  @property()
  name: string;

  @property()
  imgUrl: string;

  constructor(admin: Admin) {
    super();
    this.name = admin.name;
    this.imgUrl = Helper.toImageURL(Config.ImagePath.Admin.Url, admin.imgUrl);
  }
}
