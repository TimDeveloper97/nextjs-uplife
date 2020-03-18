import {Provider} from '@loopback/core';
import {Authorizer, AuthorizationMetadata, AuthorizationContext, AuthorizationDecision} from '@loopback/authorization';
import {securityId} from '@loopback/security';
import {DefaultCrudRepository} from '@loopback/repository';
import {Account} from '../models';
import {HttpErrors} from '@loopback/rest';
import {RoleKeys} from '../commons/constants';

export class AuthorizationProvider implements Provider<Authorizer> {
  constructor() {}

  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(authorizationCtx: AuthorizationContext, metadata: AuthorizationMetadata) {
    const requestRole = metadata.allowedRoles;
    if (!requestRole || requestRole.length === 0 || requestRole[0] === RoleKeys.ANY) return AuthorizationDecision.ALLOW;

    if (!authorizationCtx.principals || authorizationCtx.principals.length <= 0)
      throw new HttpErrors.InternalServerError('Not authenticated.');

    const id = authorizationCtx.principals[0][securityId];
    const group = authorizationCtx.principals[0].group;
    const repository = authorizationCtx.invocationContext.getSync<DefaultCrudRepository<Account, number | string>>(
      `repositories.${group}Repository`,
      {optional: true},
    );
    if (!id || !group || !repository) return AuthorizationDecision.DENY;

    const account = await repository.findById(id);
    if (!account || !account.roles) return AuthorizationDecision.DENY;

    for (const role in requestRole) {
      if (!account.roles.includes(requestRole[role])) return AuthorizationDecision.DENY;
    }

    return AuthorizationDecision.ALLOW;
  }
}
