import {DefaultCrudRepository} from '@loopback/repository';
import {Account} from '../../models';
import {PostAccountModel, PostCredentialModel} from '../../commons/requests';
import {Constructor} from '@loopback/core';
import {post, requestBody, HttpErrors} from '@loopback/rest';
import {PasswordHasher, resSpec} from '../../utils';
import {securityId} from '@loopback/security';
import {TokenService} from '@loopback/authentication';
import {AccountProfile} from '../../commons/types';
import {AppResponse} from '../../commons/app-response.model';

type ID = number | string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class = {new (...args: any[]): any};

export function AccountMixin<T extends Account>(
  E: Constructor<T>,
  endpoint: string = E.name.toLocaleLowerCase(),
): Class {
  class ControllerClass {
    constructor(
      public repository: DefaultCrudRepository<Account, ID>,
      public tokenService: TokenService,
      public option: {canLogin: boolean; canRegister: boolean} = {canLogin: true, canRegister: true},
    ) {
      option = {canLogin: true, canRegister: true, ...option};
    }

    @post(`api/${endpoint}/register`, resSpec(`${E.name}`, AppResponse, false))
    async create(@requestBody() credentialsReqData: PostAccountModel): Promise<AppResponse> {
      if (!this.option.canRegister) throw new HttpErrors.MethodNotAllowed('Api not allowed');

      const account = new E(credentialsReqData);
      account.password = await PasswordHasher.hashPassword(account.password);
      account.roles = account.getDefaultRole();

      try {
        const savedAccount = await this.repository.create(account);
        delete savedAccount.password;

        return new AppResponse();
      } catch (error) {
        // MongoError 11000 duplicate key
        if (error.code === 11000 && error.errmsg.includes('index: uniqueEmail')) {
          throw new HttpErrors.Conflict('Email value is already taken');
        } else {
          throw error;
        }
      }
    }

    @post(`/api/${endpoint}/login`, resSpec(`${E.name} token`, {token: 'string'}, false))
    async login(@requestBody() credentialsReqData: PostCredentialModel): Promise<AppResponse> {
      if (!this.option.canLogin) throw new HttpErrors.MethodNotAllowed('Api not allowed');

      const account = await this.verifyCredentials(credentialsReqData);

      const accountProfile = this.convertToAccountProfile(account);

      const token = await this.tokenService.generateToken(accountProfile);

      return new AppResponse({data: {token: token}});
    }

    async verifyCredentials(credentials: PostCredentialModel): Promise<Account> {
      const invalidCredentialsError = 'Invalid email or password.';

      const foundAccount = await this.repository.findOne({
        where: {email: credentials.email},
      });

      if (!foundAccount) {
        throw new HttpErrors.Unauthorized(invalidCredentialsError);
      }

      const passwordMatched = await PasswordHasher.comparePassword(credentials.password, foundAccount.password);

      if (!passwordMatched) {
        throw new HttpErrors.Unauthorized(invalidCredentialsError);
      }

      return foundAccount;
    }

    convertToAccountProfile(user: Account): AccountProfile {
      return {[securityId]: user.id, group: E.name};
    }
  }
  return ControllerClass;
}
