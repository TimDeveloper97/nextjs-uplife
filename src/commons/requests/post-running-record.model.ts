import {model, property, Entity} from '@loopback/repository';
import {Geopoint} from '../../models';
import {parseJson} from '@loopback/rest';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

@model()
export class PostRunningRecordModel extends Entity {
  @property({type: Date, required: true})
  startTime: Date;

  @property({type: Date, required: true})
  endTime: Date;

  @property.array(Geopoint, {required: true})
  path: Geopoint[];

  @property({type: 'number', default: 0})
  totalStep?: Number;

  @property({type: 'number', default: 0})
  totalCalorie?: Number;

  @property({type: 'number', default: 0})
  totalDistance?: Number;

  @property({type: 'string', default: ''})
  recordImageUrl: string;

  @property.array(String)
  selfieImageUrl?: string[];

  @property({type: 'string', default: ' '})
  title: string;

  @property({type: 'string', default: ' '})
  description: string;

  constructor(data?: Partial<PostRunningRecordModel>) {
    const properties = getJsonSchema(PostRunningRecordModel).properties;
    console.log(getJsonSchema(PostRunningRecordModel));
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
    this.path = this.path || [];
    this.startTime = (this.startTime && new Date(this.startTime.toString())) || new Date();
    this.endTime = (this.endTime && new Date(this.endTime.toString())) || new Date();
    console.log(this.path);
    this.path = parseJson(this.path.toString());
    this.totalStep = this.totalStep ? parseInt(this.totalStep.toString()) : 0;
    this.totalCalorie = this.totalCalorie ? parseFloat(this.totalCalorie.toString()) : 0;
    this.totalDistance = this.totalDistance ? parseInt(this.totalDistance.toString()) : 0;
  }
}

@model()
export class PostEditRunningRecordModel extends Entity {
  @property({type: 'string', default: ' '})
  title: string;

  @property({type: 'string', default: ' '})
  description: string;

  @property.array(String)
  removeSelfieFile?: string[];

  constructor(data?: Partial<PostEditRunningRecordModel>) {
    const properties = getJsonSchema(PostEditRunningRecordModel).properties;
    const obj = ObjectUtils.patch(properties, data);
    super(obj);
    this.removeSelfieFile = this.removeSelfieFile || [];
    this.removeSelfieFile = parseJson(this.removeSelfieFile.toString());
  }
}
