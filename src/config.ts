import path = require('path');

export namespace Config {
  export const HOST = process.env.PUBLIC_URL || 'http://localhost:3000/';

  export const EARTH_RADIUS = 6371000;
  export const MAX_NEAR_DISTANCE = 10000;
  export const MAX_REFILL_DISTANCE = 100;

  export const STEPCOUNT_PER_POINT = 20;
  export const POINT_PER_REFILL = 5;
  export const CALORIES_PER_STEP = 0.04;
  export const DISTANCE_PER_STEP = 0.762;

  export const MAX_EXCHANGE_DUEDATE = 15;

  export const MILLISEC_PER_DAY = 86400000;
  export const STEP_COUNT_DATE_TIME_FORMAT = 'dd/mm';

  export const TOKEN_EXPIRES = 86400 * 7;

  export const MAX_STEP_HISTORY_RESPONSE_NUMBER = 30;
  export const MAX_REFILL_LOCATION_RESPONSE_NUMBER = 10;

  export const UploadService = {
    MaxFileSize: 10 * 1024 * 1024, //10MB
    TempDir: path.join(__dirname, '../private', 'temp'),
  };

  export const ImagePath = {
    User: {
      Url: 'image/user',
      Dir: path.join(__dirname, '../public/image/user'),
      Repository: 'User',
      Property: 'imgUrl',
    },
    Admin: {
      Url: 'image/admin',
      Dir: path.join(__dirname, '../public/image/admin'),
      Repository: 'Admin',
      Property: 'imgUrl',
    },
    Store: {
      Url: 'image/store',
      Dir: path.join(__dirname, '../public/image/store'),
      Repository: 'Store',
      Property: 'imgUrl',
    },
    Product: {
      Url: 'image/product',
      Dir: path.join(__dirname, '../public/image/product'),
      Repository: 'Product',
      Property: 'imgUrl',
    },
    RunningRecord: {
      Url: 'image/runingrecord',
      Dir: path.join(__dirname, '../public/image/runingrecord'),
      Repository: 'UserRunningRecord',
      Property: 'recordImageUrl',
    },
    UserSelfie: {
      Url: 'image/selfie',
      Dir: path.join(__dirname, '../public/image/selfie'),
      Repository: 'UserRunningRecord',
      Property: 'selfieImageUrl',
    },
  };

  export const GoogleMap = {
    StaticMap: {
      ApiKey: 'AIzaSyAYSij7BvdFokbUrhN87IhGHxo5PdBIG2M',
      Url: 'https://maps.googleapis.com/maps/api/staticmap',
    },
  };
}
