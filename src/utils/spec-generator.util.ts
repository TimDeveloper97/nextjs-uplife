import {SecuritySchemeObject, ReferenceObject} from '@loopback/openapi-v3';
import {OperationObject, RequestBodyObject} from 'openapi3-ts';
import {Entity} from '@loopback/repository';
import {Constructor} from '@loopback/core';

export type SecuritySchemeObjects = {
  [SecurityScheme: string]: SecuritySchemeObject | ReferenceObject;
};
export namespace OpenApiSpec {
  export const OPERATOR_SECURITY_SPEC = [{bearerAuth: []}];
  export const SECURITY_SCHEME_SPEC: SecuritySchemeObjects = {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  };
}

export function resSpec(description: string, object: Constructor<Entity> | object, auth = true): OperationObject {
  return {
    security: auth ? OpenApiSpec.OPERATOR_SECURITY_SPEC : undefined,
    responses: {
      '200': {
        description: description,
        content: {
          'application/json': {
            schema: object instanceof Function ? {'x-ts-type': object} : {type: 'object', properties: object},
          },
        },
      },
    },
  };
}

export const requestBodyFileUpload: RequestBodyObject = {
  description: 'multipart/form-data value.',
  required: true,
  content: {
    'multipart/form-data': {
      'x-parser': 'stream',
      schema: {
        type: 'object',
        properties: {
          avatar: {description: 'Image file'},
        },
      },
    },
  },
};
