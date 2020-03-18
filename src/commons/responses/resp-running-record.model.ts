import {Model} from '@loopback/rest';
import {Geopoint} from '../../models';
import {Helper} from '../../utils';
import {model, property} from '@loopback/repository';
import {Config} from '../../config';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class RespRunningRecordModel extends Model {
  @property({type: 'string'})
  id: string;

  @property({type: Date})
  createAt: Date;

  @property({type: Date})
  updateAt: Date;

  @property({type: Date})
  startTime: Date;

  @property({type: Date})
  endTime: Date;

  @property({type: 'string'})
  userId: string;

  @property.array(Geopoint)
  path: Geopoint[];

  @property({type: 'number', default: 0})
  totalStep?: Number;

  @property({type: 'number', default: 0})
  totalCalorie?: Number;

  @property({type: 'number', default: 0})
  totalDistance?: Number;

  @property({type: 'string', default: ''})
  recordImageUrl: string;

  @property.array(String, {default: []})
  selfieImageUrl: string[];

  @property({type: 'string', default: ''})
  title: string;

  @property({type: 'string', default: ''})
  description: string;

  constructor(data?: Partial<RespRunningRecordModel>) {
    const properties = getJsonSchema(RespRunningRecordModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
    this.recordImageUrl = Helper.toImageURL(Config.ImagePath.RunningRecord.Url, this.recordImageUrl);
    this.selfieImageUrl = this.selfieImageUrl.map(item => Helper.toImageURL(Config.ImagePath.UserSelfie.Url, item));
    this.totalStep = this.totalStep ? parseInt(this.totalStep.toString()) : 0;
    this.totalCalorie = this.totalCalorie ? parseFloat(this.totalCalorie.toString()) : 0;
    this.totalDistance = this.totalDistance ? parseInt(this.totalDistance.toString()) : 0;
  }
}
