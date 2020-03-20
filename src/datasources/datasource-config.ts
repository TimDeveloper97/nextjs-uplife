import {Log} from '../utils';
import * as mongoInit from './mongo.datasource.json';

export namespace Datasource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function initDatasource(defaultInit: any, name: string): object {
    const datasource = defaultInit;
    datasource.url = process.env[`${name.toUpperCase()}_URL`] || datasource.url;
    datasource.host = process.env[`${name.toUpperCase()}_HOST`] || datasource.host;
    datasource.port = process.env[`${name.toUpperCase()}_PORT`] || datasource.port;
    datasource.user = process.env[`${name.toUpperCase()}_USER`] || datasource.user;
    datasource.password = process.env[`${name.toUpperCase()}_PASSWORD`] || datasource.password;
    datasource.database = process.env[`${name.toUpperCase()}_DATABASE`] || datasource.database;
    return datasource;
  }
  export const mongo: object = initDatasource(mongoInit, 'mongo');

  Log.i('Datasource: mongo', mongo);
}
