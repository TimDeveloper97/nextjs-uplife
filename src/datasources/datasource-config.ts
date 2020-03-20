import {Log} from '../utils';

export namespace Datasource {
  function initDatasource(defaultInitPath: string, name: string): object {
    const datasource = require(defaultInitPath);
    datasource.url = process.env[`${name.toUpperCase()}_URL`] || datasource.url;
    datasource.host = process.env[`${name.toUpperCase()}_HOST`] || datasource.host;
    datasource.port = process.env[`${name.toUpperCase()}_PORT`] || datasource.port;
    datasource.user = process.env[`${name.toUpperCase()}_USER`] || datasource.user;
    datasource.password = process.env[`${name.toUpperCase()}_PASSWORD`] || datasource.password;
    datasource.database = process.env[`${name.toUpperCase()}_DATABASE`] || datasource.database;
    return datasource;
  }
  export const mongo: object = initDatasource('./mongo.datasource.json', 'mongo');

  Log.i('Datasource: mongo', mongo);
}
