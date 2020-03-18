import {property, model, Model} from '@loopback/repository';

const ResponseMap: {[process: string]: string} = {
  200: 'Success',
  401: 'Unauthorized',
  402: 'PaymentRequired',
  403: 'Forbidden',
  404: 'NotFound',
  405: 'MethodNotAllowed',
  406: 'NotAcceptable',
  407: 'ProxyAuthenticationRequired',
  408: 'RequestTimeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'LengthRequired',
  412: 'PreconditionFailed',
  413: 'PayloadTooLarge',
  414: 'URITooLong',
  415: 'UnsupportedMediaType',
  416: 'RangeNotSatisfiable',
  417: 'ExpectationFailed',
  418: 'ImATeapot',
  421: 'MisdirectedRequest',
  422: 'UnprocessableEntity',
  423: 'Locked',
  424: 'FailedDependency',
  425: 'UnorderedCollection',
  426: 'UpgradeRequired',
  428: 'PreconditionRequired',
  429: 'TooManyRequests',
  431: 'RequestHeaderFieldsTooLarge',
  451: 'UnavailableForLegalReasons',
  500: 'InternalServerError',
  501: 'NotImplemented',
  502: 'BadGateway',
  503: 'ServiceUnavailable',
  504: 'GatewayTimeout',
  505: 'HTTPVersionNotSupported',
  506: 'VariantAlsoNegotiates',
  507: 'InsufficientStorage',
  508: 'LoopDetected',
  509: 'BandwidthLimitExceeded',
  510: 'NotExtended',
  511: 'NetworkAuthenticationRequired',
};

@model()
export class AppResponse extends Model {
  @property({type: 'number'})
  code?: number;
  @property({type: 'string'})
  message?: string;
  @property({type: 'object'})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;

  constructor(data?: Partial<AppResponse>) {
    super(data);
    this.code = (data && data.code) || 200;
    this.message = (data && data.message) || '';
    this.data = (data && data.data) || undefined;

    if (this.message === '') {
      this.message = ResponseMap[this.code] || (this.code < 200 ? 'RequestError' : 'ServerError');
    }
  }
}
