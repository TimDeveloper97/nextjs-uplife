import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Card} from '../models';
import {TimeStampRepository} from './timestamp-repository';

export class CardRepository extends TimeStampRepository<Card, typeof Card.prototype.id> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Card, dataSource);
  }
}
