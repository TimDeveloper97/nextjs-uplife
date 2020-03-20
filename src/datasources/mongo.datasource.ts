import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {Datasource} from './datasource-config';

export class MongoDataSource extends juggler.DataSource {
  static dataSourceName = 'mongo';

  constructor(
    @inject('datasources.config.mongo', {optional: true})
    dsConfig: object = Datasource.mongo,
  ) {
    super(dsConfig);
  }
}
