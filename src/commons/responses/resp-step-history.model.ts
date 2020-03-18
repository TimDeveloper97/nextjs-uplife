import {Config} from '../../config';
import {Helper} from '../../utils/helper.util';
import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

@model()
export class RespStepHistoryModel extends Model {
  @property()
  time: string;
  @property()
  step: number;
  @property()
  calories: number;
  @property()
  distance: string;

  constructor(time: string, step?: number) {
    super();
    this.time = time;
    this.step = (step && step) || 0;
    this.calories = this.step * Config.CALORIES_PER_STEP;
    this.distance = Helper.distanceToString(this.step * Config.DISTANCE_PER_STEP);
  }

  addStep(step: number) {
    this.step += step;
    this.calories = this.step * Config.CALORIES_PER_STEP;
    this.distance = Helper.distanceToString(this.step * Config.DISTANCE_PER_STEP);
  }
}
