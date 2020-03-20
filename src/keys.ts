import {BindingKey} from '@loopback/context';
import {TokenService} from '@loopback/authentication';
import {PackageInfo} from './commons/types';
import {UploadService} from './services/upload.service';

export namespace PackageBindings {
  export const PACKAGE = BindingKey.create<PackageInfo>('application.package');
}

export namespace TokenServiceConstant {
  export const TOKEN_SECRET_VALUE = process.env.JWT_SECRET || 'jwtsecret';
  export const TOKEN_EXPIRES_IN_VALUE = 86400 * 7;
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>('authentication.jwt.secret');
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>('authentication.jwt.expires.in.seconds');
  export const TOKEN_SERVICE = BindingKey.create<TokenService>('services.authentication.jwt.tokenservice');
}

export namespace UploadServiceBindings {
  export const UPLOAD_SERVICE = BindingKey.create<UploadService>('services.uploadservice');
}
