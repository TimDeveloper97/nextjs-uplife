import {repository} from '@loopback/repository';
import {post, param, get, requestBody, Request, RestBindings, Response, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {TokenServiceBindings, UploadServiceBindings} from '../keys';
import {authenticate, TokenService} from '@loopback/authentication';
import {StoreRepository} from '../repositories/store.repository';
import {
  CategoryRepository,
  UserExchangeHistoryRepository,
  UserRepository,
  StoreLocationRepository,
  ProductRepository,
} from '../repositories';
import {resSpec, requestBodyFileUpload, Helper} from '../utils';
import {Store, Product, StoreLocation} from '../models';
import {AccountMixin} from './common/account.mixin';
import {AppResponse} from '../commons/app-response.model';
import {SecurityBindings} from '@loopback/security';
import {AccountProfile} from '../commons/types';
import {RespStoreInfoModel, RespProductModel, RespUserInfoModel} from '../commons/responses';
import {
  PostStoreInfoModel,
  PostProductModel,
  PostProductEditModel,
  PostLocationRefillModel,
  PostQRCodeModel,
} from '../commons/requests';
import {UploadService} from '../services/upload.service';
import {FileService} from '../services';
import {Config} from '../config';

export class StoreController extends AccountMixin<Store>(Store) {
  constructor(
    @repository(ProductRepository) public productRepository: ProductRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(StoreRepository) public storeRepository: StoreRepository,
    @repository(StoreLocationRepository) public storeLocationRepository: StoreLocationRepository,
    @repository(CategoryRepository) public categoryRepository: CategoryRepository,
    @repository(UserExchangeHistoryRepository) public exchangeHistoryRepository: UserExchangeHistoryRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public tokenService: TokenService,
    @inject(UploadServiceBindings.UPLOAD_SERVICE) public uploadService: UploadService,
  ) {
    super(storeRepository, tokenService);
  }

  @get('/api/store/info', resSpec('Store profile', RespStoreInfoModel))
  @authenticate('jwt')
  async storeGetInfo(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    const store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    return new AppResponse({data: new RespStoreInfoModel(store)});
  }

  @post('/api/store/info', resSpec('Store profile', RespStoreInfoModel))
  @authenticate('jwt')
  async storeEditInfo(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() storeInfo: PostStoreInfoModel,
  ): Promise<AppResponse> {
    storeInfo = new PostStoreInfoModel(storeInfo);
    let store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    await this.storeRepository.updateById(currentUser.id, storeInfo).catch(err => {
      throw new AppResponse({code: 500});
    });
    store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    return new AppResponse({data: new RespStoreInfoModel(store)});
  }

  @post('/api/store/avatar', resSpec('Store profile', RespStoreInfoModel))
  @authenticate('jwt')
  async storeUploadAvatar(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody(requestBodyFileUpload) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<AppResponse> {
    let store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    let fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');
    if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');
    const fileName = FileService.getFileName(fileUploaded);
    fileUploaded = FileService.moveFile(fileUploaded, Config.ImagePath.Store.Dir, fileName);

    try {
      if (fileUploaded) {
        await this.userRepository.updateById(currentUser.id, {imgUrl: fileName});
      } else {
        await this.userRepository.updateById(currentUser.id, {imgUrl: 'default.png'});
      }

      if (store.imgUrl !== 'default.png') {
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Store.Dir, fileName));
      }
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Store.Dir, fileUploaded));
    }
    store = await this.storeRepository.findById(currentUser.id);
    return new AppResponse({data: new RespStoreInfoModel(store)});
  }

  @get('/api/store/token', resSpec('Store profile', RespStoreInfoModel))
  @authenticate('jwt')
  async storeToken(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    return new AppResponse({data: currentUser});
  }

  @get('/api/store/product', resSpec('Store profile', RespStoreInfoModel))
  @authenticate('jwt')
  async storeGetProduct(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('name') name: string,
  ): Promise<AppResponse> {
    let data: RespProductModel[] = [];
    const store = await this.storeRepository.findById(currentUser.id);

    const products = await this.storeRepository.products(store.id).find(
      {
        where: (name && {name: {like: name}}) || undefined,
        order: ['createAt DESC'],
        include: [{relation: 'category'}, {relation: 'store'}],
      },
      {
        strictObjectIDCoercion: false,
      },
    );
    data = products.map(item => new RespProductModel(item));
    return new AppResponse({data: data});
  }

  @post('/api/store/product', resSpec('Create result', {}))
  @authenticate('jwt')
  async storeAddProduct(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              avatar: {description: 'Image file'},
              categoryName: {description: 'Category name', type: 'string'},
              name: {description: 'Product name', type: 'string'},
              point: {description: 'Point', type: 'integer'},
              dueDate: {description: 'Duedate, ex: 2020-03-03T20:00:00.000Z', type: 'string'},
              quantity: {description: 'Quantity', type: 'integer'},
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<AppResponse> {
    const store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });

    const fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');
    //if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');

    try {
      const productpos = new PostProductModel(request.body);

      productpos.imgUrl = fileUploaded || 'default.png';

      const category = await this.categoryRepository.findOne({
        where: {name: productpos.categoryName.toLocaleLowerCase()},
      });
      if (category === null) {
        throw new AppResponse({code: 400, message: 'Category not found'});
      }
      delete productpos.categoryName;
      const product = new Product(productpos);
      product.categoryId = category.id;
      product.total = product.quantity;

      await this.storeRepository.products(store.id).create(product);
      return new AppResponse();
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Product.Dir, fileUploaded));
      throw error;
    }
  }

  @post('/api/store/product/{productId}', resSpec('Edit result', {}))
  @authenticate('jwt')
  async storeEditProduct(
    @param.path.string('productId') productId: string,
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              avatar: {description: 'Image file'},
              name: {description: 'Product name', type: 'string'},
              point: {description: 'Point', type: 'integer'},
              dueDate: {description: 'Duedate, ex: 2020-03-03T20:00:00.000Z', type: 'string'},
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<AppResponse> {
    const store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');

    try {
      const productpos = new PostProductEditModel(request.body);

      const product = await this.productRepository.findById(productId).catch(err => {
        throw new AppResponse({code: 404, message: 'Not found product'});
      });
      if (!product || product.storeId !== store.id) {
        throw new AppResponse({code: 404, message: 'Not found product'});
      }

      productpos.imgUrl = fileUploaded || product.imgUrl;

      const category = await this.categoryRepository.findOne({
        where: {name: productpos.categoryName.toLocaleLowerCase()},
      });
      if (category === null) {
        throw new AppResponse({code: 400, message: 'Category not found'});
      }
      await this.productRepository.updateById(productId, {
        imgUrl: productpos.imgUrl,
        name: productpos.name,
        point: productpos.point,
        dueDate: productpos.dueDate,
      });

      if (product.imgUrl !== productpos.imgUrl && product.imgUrl !== 'default.png') {
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Product.Dir, product.imgUrl));
      }
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Product.Dir, fileUploaded));
    }
    return new AppResponse();
  }

  @get(
    '/api/store/location',
    resSpec('List store location', {
      locationList: {type: 'array', items: {$ref: '#/components/schemas/StoreLocation'}},
    }),
  )
  @authenticate('jwt')
  async storeGetLocation(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('address') address: string,
  ) {
    const data: StoreLocation[] = await this.storeRepository.locations(currentUser.id).find(
      {
        where: (address && {address: address}) || undefined,
        // fields: {createAt: false, updateAt: false, storeId: false},
      },
      {
        strictObjectIDCoercion: false,
      },
    );
    return new AppResponse({data: {locationList: data}});
  }

  @post('/api/store/location', resSpec('Add result', {}))
  @authenticate('jwt')
  async storeAddLocation(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() storeLocation: PostLocationRefillModel,
  ) {
    storeLocation = new PostLocationRefillModel(storeLocation);
    if (storeLocation.refillPrice === undefined) {
      throw new AppResponse({code: 400, message: 'RefillPrice invalid'});
    }
    const store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    storeLocation.currentWatter = storeLocation.bottleVolumn;
    const newStoreLocation = new StoreLocation(storeLocation);
    await this.storeRepository.locations(store.id).create(newStoreLocation);

    return new AppResponse();
  }

  @post('/api/store/location/{storeLocationId}', resSpec('Edit result', {}))
  @authenticate('jwt')
  async storeEditLocation(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('storeLocationId') storeLocationId: string,
    @requestBody() storeLocation: PostLocationRefillModel,
  ) {
    storeLocation = new PostLocationRefillModel(storeLocation);
    const store = await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });

    const location = await this.storeLocationRepository.findById(storeLocationId).catch(err => {
      throw new AppResponse({code: 404});
    });

    if (location.storeId !== store.id) {
      throw new AppResponse({code: 400, message: 'Location invalid'});
    }

    await this.storeLocationRepository.updateById(storeLocationId, {
      address: storeLocation.address,
      bottleVolumn: storeLocation.bottleVolumn,
      currentWatter: storeLocation.currentWatter,
      lat: storeLocation.lat,
      lng: storeLocation.lng,
      refillPrice: storeLocation.refillPrice,
    });

    return new AppResponse();
  }

  @get(
    '/api/store/exchange',
    resSpec('Exchange info', {
      userInfo: {$ref: '#/components/schemas/RespUserInfoModel'},
      product: {$ref: '#/components/schemas/RespProductModel'},
    }),
  )
  @authenticate('jwt')
  async storeCheckExchange(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('code') code: string,
  ) {
    if (!code) {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    }
    await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 404});
    });
    const exchange = await this.exchangeHistoryRepository.findById(code).catch(err => {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    });
    if (exchange.received) {
      throw new AppResponse({code: 400, message: 'QRcode is used'});
    }
    const user = await this.userRepository.findById(exchange.userId).catch(err => {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    });
    const product = await this.productRepository
      .findById(exchange.productId, {include: [{relation: 'category'}, {relation: 'store'}]})
      .catch(err => {
        throw new AppResponse({code: 400, message: 'Product not found'});
      });

    if (product.storeId !== currentUser.id) {
      throw new AppResponse({code: 400, message: 'QRcode invalid with store'});
    }
    return new AppResponse({
      data: {
        userInfo: new RespUserInfoModel(user),
        product: new RespProductModel(product),
      },
    });
  }

  @post(
    '/api/store/exchange',
    resSpec('Exchange info', {
      userInfo: {type: {$ref: '#/components/schemas/RespUserInfoModel'}},
      product: {type: {$ref: '#/components/schemas/RespProductModel'}},
    }),
  )
  @authenticate('jwt')
  async storeExchanging(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() code: PostQRCodeModel,
  ) {
    code = new PostQRCodeModel(code);
    if (!code) {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    }
    await this.storeRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 404});
    });
    const exchange = await this.exchangeHistoryRepository.findById(code.codeQR).catch(err => {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    });
    if (exchange.received) {
      throw new AppResponse({code: 400, message: 'QRcode is used'});
    }
    const user = await this.userRepository.findById(exchange.userId).catch(err => {
      throw new AppResponse({code: 400, message: 'QRcode invalid'});
    });
    const product = await this.productRepository
      .findById(exchange.productId, {include: [{relation: 'category'}, {relation: 'store'}]})
      .catch(err => {
        throw new AppResponse({code: 400, message: 'Product not found'});
      });

    if (product.storeId !== currentUser.id) {
      throw new AppResponse({code: 400, message: 'QRcode invalid with store'});
    }
    await this.exchangeHistoryRepository.updateById(exchange.id, {
      received: true,
    });
    return new AppResponse({
      data: {
        userInfo: new RespUserInfoModel(user),
        product: new RespProductModel(product),
      },
    });
  }
}
