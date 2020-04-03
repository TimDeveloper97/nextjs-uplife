import {inject} from '@loopback/context';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import {
  AuthenticationBindings,
  AuthenticateFn,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  USER_PROFILE_NOT_FOUND,
} from '@loopback/authentication';
import {AppResponse} from './commons/app-response.model';
import {Log} from './utils';

const SequenceActions = RestBindings.SequenceActions;

const TAG = 'Sequence';

export class MySequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
  ) {}

  async handle(context: RequestContext) {
    const {request, response} = context;
    const url = request.method + ' ' + request.url;
    try {
      const route = this.findRoute(request);
      if (request.url.startsWith('/api')) Log.i(TAG, url);
      await this.authenticateRequest(request);
      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (err) {
      if (err.code === AUTHENTICATION_STRATEGY_NOT_FOUND || err.code === USER_PROFILE_NOT_FOUND) {
        Object.assign(err, {statusCode: 401});
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        Object.assign(err, {statusCode: 422, message: 'File too large'});
      }
      if (err && err.statusCode && typeof err.statusCode === 'number') {
        context.response.status(err.statusCode);
        let message = (err.details && err.details[0] && err.details[0].message) || err.message;
        if (err.details && err.details[0] && err.details[0].path)
          message = err.details[0].path.replace('.', '') + ' ' + message;
        const data = new AppResponse({code: err.statusCode, message: message});
        Log.e(TAG, url, data);
        this.send(response, data);
      } else {
        Log.e(TAG, url, err);
        if (err && err.code && typeof err.code === 'number') {
          context.response.status(err.code);
          this.send(response, err);
        }
        else this.reject(context, err);
      }
    }
  }
}
