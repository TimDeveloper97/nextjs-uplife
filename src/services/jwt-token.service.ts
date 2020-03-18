import {inject} from '@loopback/context';
import {HttpErrors} from '@loopback/rest';
import {TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '../keys';
import {promisify} from 'util';
import {securityId} from '@loopback/security';
import {AccountProfile} from '../commons/types';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTTokenService implements TokenService {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET) private jwtSecret: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN) private jwtExpiresIn: string,
  ) {}

  async verifyToken(token: string): Promise<AccountProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    let accountProfile: AccountProfile;

    try {
      const decodedToken = await verifyAsync(token, this.jwtSecret);
      accountProfile = Object.assign(
        {id: '', [securityId]: '', group: ''},
        {
          id: decodedToken.id,
          [securityId]: decodedToken.id,
          group: decodedToken.group,
        },
      );
    } catch (error) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : ${error.message}`,
      );
    }

    return accountProfile;
  }

  async generateToken(accountProfile: AccountProfile): Promise<string> {
    if (!accountProfile) {
      throw new HttpErrors.Unauthorized(
        `Error generating token : userProfile is null`,
      );
    }
    const tokenInfo = {
      id: accountProfile[securityId],
      group: accountProfile.group,
    };
    // Generate a JSON Web Token
    let token: string;
    try {
      token = await signAsync(tokenInfo, this.jwtSecret, {
        expiresIn: Number(this.jwtExpiresIn),
      });
    } catch (error) {
      throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }

    return token;
  }
}
