import {AuthorizationContext, AuthorizationDecision} from '@loopback/authorization';
import {UserProfile, securityId} from '@loopback/security';

// Instance level authorization
export async function compareId(authorizationCtx: AuthorizationContext) {
  let currentUser: UserProfile;
  if (authorizationCtx.principals.length > 0) {
    const {name, email} = authorizationCtx.principals[0];
    const id = authorizationCtx.principals[0][securityId];
    currentUser = {[securityId]: id, name: name, email: email};
  } else {
    return AuthorizationDecision.DENY;
  }
  // Admin is full power
  if (currentUser.name && currentUser.name.toLowerCase() === 'admin') {
    return AuthorizationDecision.ALLOW;
  }
  // Get userId from patch
  const userId = authorizationCtx.invocationContext.args[0];
  return userId === currentUser[securityId] ? AuthorizationDecision.ALLOW : AuthorizationDecision.DENY;
}
