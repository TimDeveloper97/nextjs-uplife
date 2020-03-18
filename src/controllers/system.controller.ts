import {Request, RestBindings, get} from '@loopback/rest';
import {inject} from '@loopback/context';
import {resSpec} from '../utils/spec-generator.util';

const PING_RESPONSE = {
  greeting: {type: 'string'},
  yourIP: {type: 'string'},
  date: {type: 'string'},
  url: {type: 'string'},
  headers: {
    type: 'object',
    properties: {
      'Content-Type': {type: 'string'},
    },
    additionalProperties: true,
  },
};

export class SystemController {
  clientIP: string;

  constructor(@inject(RestBindings.Http.REQUEST) private req: Request) {
    // x-forwarded-for: client, proxy1, proxy2, proxy3
    const proxy = req.headers['x-forwarded-for'];
    this.clientIP =
      (proxy ? (proxy + '').split(',').pop() : '') || req.connection.remoteAddress || req.socket.remoteAddress || '';
  }

  @get('/ping', resSpec('Ping response', PING_RESPONSE, false))
  ping(): object {
    return {
      greeting: 'Hello from my server',
      yourIP: this.clientIP,
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }
}
