import {inject} from '@loopback/context';
import {HttpErrors, Request} from '@loopback/rest';
import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '../keys';
import {AccountProfile} from '../commons/types';

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    private tokenService: TokenService,
  ) {}

  async authenticate(request: Request): Promise<AccountProfile | undefined> {
    const token = this.extractCredentials(request);
    const userProfile: AccountProfile = await this.tokenService.verifyToken(token);
    return userProfile;
  }

  extractCredentials(request: Request): string {
    if (!request.headers.authorization) {
      throw new HttpErrors.Unauthorized(`Authorization header not found.`);
    }

    let authHeaderValue = request.headers.authorization;
    if (authHeaderValue.startsWith('Bearer')) {
      authHeaderValue = authHeaderValue.slice(7, authHeaderValue.length);
      // throw new HttpErrors.Unauthorized(`Authorization header is not of type Bearer.`);
    }

    const parts = authHeaderValue.split(' ');
    if (parts.length !== 2 && parts.length !== 1) {
      throw new HttpErrors.Unauthorized(`Authorization header must follow the pattern: 'Bearer token'.`);
    }

    const token = parts[1] || parts[0];
    return token;
  }
}
