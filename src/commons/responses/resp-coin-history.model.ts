import {Model} from '@loopback/rest';
import {model, property} from '@loopback/repository';

@model()
export class RespCoinHistoryModel extends Model {
  @property()
  time: string;
  @property()
  coin: number;
  @property()
  point: number;

  constructor(time: string, coin: number, point: number) {
    super();
    this.time = time;
    this.coin = coin;
    this.point = point;
  }
}
