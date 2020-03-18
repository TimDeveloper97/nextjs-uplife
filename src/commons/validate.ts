import {AppResponse} from './app-response.model';

const regexPassword = '[a-zA-Z0-9!@#$%^&*_+ ]{8,}';
const regexAccName = '[a-zA-Z0-9 -]{6,}';
const regexProduct = '[a-zA-Z0-9 -]{6,}';

export namespace Validate {
  export const password = function(mpassword: string) {
    if (!new RegExp(regexPassword).test(mpassword)) {
      throw new AppResponse({
        code: 400,
        message: 'Password must be minimum 8 characters in (a-zA-Z0-9!@#$%^&*_+ )',
      });
    }
  };
  export const step = function(number: number) {
    if (Number.isNaN(number) || !Number.isInteger(number) || number < 0) {
      throw new AppResponse({code: 400, message: 'Invalid step'});
    }
  };
  export const latLng = function(lat?: number, lng?: number) {
    if (lat === undefined || lng === undefined || lat < -180 || lng < -180 || lat > 180 || lng > 180) {
      throw new AppResponse({code: 400, message: 'Invalid lat lng'});
    }
  };
  export const acountName = function(name: string) {
    if (!new RegExp(regexAccName).test(name)) {
      throw new AppResponse({
        code: 400,
        message: 'Name must be minimum 6 characters in (a-zA-Z0-9 -)',
      });
    }
  };
  export const productName = function(name: string) {
    if (!new RegExp(regexProduct).test(name)) {
      throw new AppResponse({
        code: 400,
        message: 'Name must be minimum 6 characters in (a-zA-Z0-9 -)',
      });
    }
  };
  export const price = function(number: number) {
    number = Number.parseFloat(number + '');
    if (Number.isNaN(number) || number < 0) {
      throw new AppResponse({code: 400, message: 'Invalid price'});
    }
    return number;
  };
  export const point = function(number: number) {
    number = Number.parseInt(number + '');
    if (Number.isNaN(number) || number < 0) {
      throw new AppResponse({code: 400, message: 'Invalid point'});
    }
    return number;
  };
  export const bottle = function(number: number) {
    number = Number.parseInt(number + '');
    if (Number.isNaN(number) || number <= 0) {
      throw new AppResponse({code: 400, message: 'Invalid bottle volumn'});
    }
    return number;
  };
  export const currentWater = function(bottleVolumn: number, mcurrentWater: number) {
    bottleVolumn = Number.parseInt(bottleVolumn + '');
    mcurrentWater = Number.parseInt(mcurrentWater + '');
    if (Number.isNaN(bottleVolumn) || Number.isNaN(bottleVolumn) || bottleVolumn < mcurrentWater) {
      throw new AppResponse({code: 400, message: 'Invalid current water'});
    }
    return mcurrentWater;
  };
  export const total = function(number: number) {
    number = Number.parseInt(number + '');
    if (Number.isNaN(number) || number <= 0) {
      throw new AppResponse({code: 400, message: 'Invalid total'});
    }
    return number;
  };
  export const quantity = function(mtotal: number, mquantity: number) {
    mtotal = Number.parseInt(mtotal + '');
    mquantity = Number.parseInt(mquantity + '');
    if (Number.isNaN(mtotal) || Number.isNaN(mquantity) || mtotal < mquantity || mquantity < 0) {
      throw new AppResponse({code: 400, message: 'Invalid quantity'});
    }
    return mquantity;
  };
  export const duedate = function(date: Date) {
    date = new Date(date);
    if (date.getTime === undefined || isNaN(date.getTime())) {
      throw new AppResponse({code: 400, message: 'Invalid due date'});
    }
    return date;
  };
}
