import fs = require('fs');
import path = require('path');
import https = require('https');
import Axios = require('axios');
import {Config} from '../config';
import {FileService} from './file.service';
import {Log} from '../utils';

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const StaticMap = Config.GoogleMap.StaticMap;

const TAG = 'GoogleMapService';

export namespace GoogleMapService {
  export const renderMapImage = async function({
    size,
    linePath,
    style,
  }: {
    size?: {width: number; height: number};
    linePath: {
      lat: number;
      lng: number;
    }[];
    style?: {
      color: string;
      weight: number;
    };
  }): Promise<string> {
    const filePath: string = path.join(Config.UploadService.TempDir, FileService.randomFileName('jpg'));
    try {
      FileService.makeDir(Config.UploadService.TempDir);
      const file = fs.createWriteStream(filePath);
      const response = await Axios.default.get(StaticMap.Url + '?' + mapStyle + '&' + getEndMarker(linePath), {
        params: {
          key: StaticMap.ApiKey,
          size: formatSize(size),
          path: [formatStyle(style), formatLinePath(linePath)].join('|'),
        },
        responseType: 'stream',
        httpsAgent: agent,
      });
      await new Promise(resolve => {
        response.data.pipe(file).on('finish', resolve);
      });
      Log.d(TAG, 'dowload completed: ' + filePath);
      return filePath;
    } catch (error) {
      Log.d(TAG, error);
      FileService.removeFile(filePath);
      return '';
    }
  };

  const formatSize = function(size?: {width: number; height: number}): string {
    return size ? `${size.width}x${size.height}` : '640x360'; //720x405'; //'600x250';
  };

  const formatStyle = function(style?: {color: string; weight: number}): string {
    if (!style) return 'color:0x0000ff|weight:4';
    return `color:${style.color}|weight:${style.weight}`;
  };

  const formatLinePath = function(linePath: {lat: number; lng: number}[]): string {
    const formatPath = linePath.map(item => `${item.lat},${item.lng}`);
    return formatPath.join('|');
  };

  const mapStyle =
    'maptype=roadmap&style=feature:poi.business|visibility:off&style=feature:poi.park|element:labels.text|visibility:off&style=feature:transit.station.bus|visibility:off&style=feature:transit.station.rail|visibility:off';

  const getEndMarker = function(linePath: {lat: number; lng: number}[] = []): string | undefined {
    if (linePath.length > 0) {
      return `markers=size:mid|color:red|${linePath[linePath.length - 1].lat},${linePath[linePath.length - 1].lng}`;
    }
  };
}
