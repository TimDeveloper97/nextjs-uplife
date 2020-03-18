/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor} from '@loopback/core';
import {Entity} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ObjectUtils} from '../../utils';

export function ResMixin<T extends Constructor<Entity>>(supperClass: T) {
  return class extends supperClass {
    constructor(...args: any[]) {
      if (args && args.length > 0) {
        const properties = getJsonSchema(supperClass).properties;
        const obj = ObjectUtils.patch(properties, args[0]);
        super(obj);
      } else {
        super(...args);
      }
    }
  };
}
