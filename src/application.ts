import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import * as path from 'path';
import {MySequence} from './sequence';
import {TokenServiceConstant, TokenServiceBindings, PackageBindings, UploadServiceBindings} from './keys';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {
  AuthorizationComponent,
  AuthorizationTags,
  AuthorizationBindings,
  AuthorizationDecision,
} from '@loopback/authorization';
import {JWTAuthenticationStrategy} from './authentications/jwt-authentication-strategy';
import {JWTTokenService} from './services';
import {PackageInfo} from './commons/types';
import {AuthorizationProvider} from './authorizations/authorization.provider';
import {UploadService} from './services/upload.service';
import {OpenApiSpec} from './utils';

const pkg: PackageInfo = require('../package.json');

export class Application extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.api({
      openapi: '3.0.0',
      info: {title: pkg.name, version: pkg.version},
      paths: {},
      components: {securitySchemes: OpenApiSpec.SECURITY_SCHEME_SPEC},
      servers: [{url: '/'}],
    });

    this.setUpBindings();

    // Bind authentication component related elements
    this.component(AuthenticationComponent);
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Bind authorization component
    this.component(AuthorizationComponent);
    this.bind('authorizationProvider')
      .toProvider(AuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);
    // Set authorize-interceptior option
    this.configure(AuthorizationBindings.COMPONENT).to({
      precedence: AuthorizationDecision.DENY,
    });

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
      repositories: {
        dirs: ['repositories'],
        extensions: ['.repository.js'],
        nested: false,
      },
    };
  }

  setUpBindings(): void {
    // Body size
    this.bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS).to({
      json: {limit: '1MB'},
      text: {limit: '1MB'},
    });
    // PackageInfo
    this.bind(PackageBindings.PACKAGE).to(pkg);
    // TokenService
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(TokenServiceConstant.TOKEN_SECRET_VALUE);
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(TokenServiceConstant.TOKEN_EXPIRES_IN_VALUE);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTTokenService);
    // File service
    this.bind(UploadServiceBindings.UPLOAD_SERVICE).toClass(UploadService);
  }
}
