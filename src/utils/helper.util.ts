import path = require('path');
import {Config} from '../config';
import {URL} from 'url';

export namespace Helper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const compareId = function(idOne: string | any, idTwo: string | any) {
    return idOne === idTwo || '' + idOne === '' + idTwo;
  };

  export const getDate = function(currDate?: Date): Date {
    currDate = (currDate && new Date(currDate)) || new Date();
    currDate.setHours(6, 0, 0, 0);
    return currDate;
  };

  export const toImageURL = function(folder: string, file: string): string {
    if (!file) return '';
    return new URL(path.join(Config.HOST, folder, '' + file)).toString();
  };

  export const getImageLocalPath = function(folderPath: string, file: string) {
    return path.join(folderPath, '' + file);
  };

  export const getDeltaLatLng = function(distance: number) {
    return (distance * 180) / Math.PI / Config.EARTH_RADIUS;
  };

  export const distanceToString = function(distance: number) {
    if (distance < 1000) {
      return Math.round(distance) + ' m';
    } else {
      return (distance / 1000).toFixed(2) + ' km';
    }
  };

  export const distanceLocation = function(latSrc: number, lngSrc: number, latDes: number, lngDes: number) {
    const dLat = (latDes - latSrc) * (Math.PI / 180);
    const dLng = (lngDes - lngSrc) * (Math.PI / 180);
    const latSrcToRad = latSrc * (Math.PI / 180);
    const laDesToRad = latDes * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(latSrcToRad) * Math.cos(laDesToRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = Config.EARTH_RADIUS * c;
    return distance;
  };
}
