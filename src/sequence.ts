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
    try {
      const {request, response} = context;
      const route = this.findRoute(request);
      if (request.url.startsWith('/api')) {
        Log.i(TAG, request.method + ' ' + request.url);
      }
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
        const message = (err.details && err.details[0] && err.details[0].message) || err.message;
        const data = new AppResponse({code: err.statusCode, message: message});
        Log.e(TAG, data);
        this.send(context.response, data);
      } else {
        Log.e(TAG, err);
        this.reject(context, err);
      }
    }
  }
}
