import dateformat = require('dateformat');
import {repository} from '@loopback/repository';
import {post, param, get, requestBody, Request, RestBindings, Response, HttpErrors, del, put} from '@loopback/rest';
import {
  UserRepository,
  StoreRepository,
  StoreLocationRepository,
  ProductRepository,
  CategoryRepository,
  UserExchangeHistoryRepository,
} from '../repositories';
import {resSpec, requestBodyFileUpload, Helper, Log} from '../utils';
import {inject} from '@loopback/core';
import {authenticate, TokenService} from '@loopback/authentication';
import {AppResponse} from '../commons/app-response.model';
import {TokenServiceBindings, UploadServiceBindings} from '../keys';
import {AccountMixin} from './common/account.mixin';
import {User, UserStepHistory, UserRefillHistory, Store, Category, UserExchangeHistory} from '../models';
import {SecurityBindings} from '@loopback/security';
import {AccountProfile} from '../commons/types';
import {
  RespUserInfoModel,
  RespStepHistoryModel,
  RespLocationRefillModel,
  RespLocationRefillDetailModel,
  RespProductModel,
  RespExchangeModel,
  RespRunningRecordModel,
} from '../commons/responses';
import {
  PostUserInfoModel,
  PostStepListModel,
  PostStepModel,
  PostBottleModel,
  PostPositionModel,
  PostRunningRecordModel,
  PostEditRunningRecordModel,
} from '../commons/requests';
import {Config} from '../config';
import {Validate} from '../commons/validate';
import {UploadService, FileService, GoogleMapService} from '../services';

export class UserController extends AccountMixin<User>(User) {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(StoreLocationRepository) public storeLocationRepository: StoreLocationRepository,
    @repository(StoreRepository) public storeRepository: StoreRepository,
    @repository(ProductRepository) public productRepository: ProductRepository,
    @repository(CategoryRepository) public categoryRepository: CategoryRepository,
    @repository(UserExchangeHistoryRepository) public userExchangeHistoryRepository: UserExchangeHistoryRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public tokenService: TokenService,
    @inject(UploadServiceBindings.UPLOAD_SERVICE) public uploadService: UploadService,
  ) {
    super(userRepository, tokenService);
  }

  @get('/api/user/info', resSpec('User profile', RespUserInfoModel))
  @authenticate('jwt')
  async userGetInfo(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    return new AppResponse({data: new RespUserInfoModel(user)});
  }

  @post('/api/user/info', resSpec('User profile', RespUserInfoModel))
  @authenticate('jwt')
  async userEditInfo(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() userInfo: PostUserInfoModel,
  ): Promise<AppResponse> {
    userInfo = new PostUserInfoModel(userInfo);
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    await this.userRepository
      .updateById(currentUser.id, {
        name: userInfo.name,
      })
      .catch(err => {
        throw new AppResponse({code: 500});
      });
    user.name = userInfo.name;
    return new AppResponse({data: new RespUserInfoModel(user)});
  }

  @post('/api/user/avatar', resSpec('User profile', RespUserInfoModel))
  @authenticate('jwt')
  async userUploadAvatar(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody(requestBodyFileUpload) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<AppResponse> {
    let user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const fileName = currentUser.id + '.jpg';
    let fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');
    if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');
    fileUploaded = FileService.moveFile(fileUploaded, Config.ImagePath.User.Dir, fileName);

    try {
      if (fileUploaded) {
        await this.userRepository.updateById(currentUser.id, {imgUrl: fileName}).catch(err => {
          throw new AppResponse({code: 500});
        });
      } else {
        await this.userRepository.updateById(currentUser.id, {imgUrl: 'default.png'}).catch(err => {
          throw new AppResponse({code: 500});
        });
      }

      if (user.imgUrl !== 'default.png') {
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.User.Dir, fileName));
      }
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.User.Dir, fileUploaded));
    }
    user = await this.userRepository.findById(currentUser.id);
    return new AppResponse({data: new RespUserInfoModel(user)});
  }

  @get('/api/user/token', resSpec('User token', {group: {type: 'string'}, id: {type: 'string'}}))
  @authenticate('jwt')
  async userToken(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    return new AppResponse({data: currentUser});
  }

  @get('/api/user/step', resSpec('User step history list', RespStepHistoryModel))
  @authenticate('jwt')
  async userGetStepHistory(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('type') type: string,
  ): Promise<AppResponse> {
    const date = Helper.getDate();
    const data: RespStepHistoryModel[] = [];

    switch (type) {
      case 'day':
        await this.userRepository
          .stepHistory(currentUser.id)
          .find(
            {
              fields: {date: true, step: true},
              where: {
                and: [
                  {
                    date: {
                      gt: new Date(date.getTime() - Config.MILLISEC_PER_DAY * Config.MAX_STEP_HISTORY_RESPONSE_NUMBER),
                    },
                  },
                  {date: {lte: date}},
                ],
              },
              order: ['date DESC'],
            },
            {strictObjectIDCoercion: false},
          )
          .then(value => {
            let valueIdx = 0;
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < Config.MAX_STEP_HISTORY_RESPONSE_NUMBER; i++) {
              const _date = new Date(date.getTime() - Config.MILLISEC_PER_DAY * i);
              const time = dateformat(_date, Config.STEP_COUNT_DATE_TIME_FORMAT);
              if (
                valueIdx < value.length &&
                value[valueIdx].date.getMonth() === _date.getMonth() &&
                value[valueIdx].date.getDay() === _date.getDay()
              ) {
                data.push(new RespStepHistoryModel(time, value[valueIdx].step));
                valueIdx++;
              } else {
                data.push(new RespStepHistoryModel(time));
              }
            }
          });
        break;
      case 'month':
        for (let i = 0; i < 12; i++) {
          data.push(new RespStepHistoryModel((i + 1).toString()));
        }
        await this.userRepository
          .stepHistory(currentUser.id)
          .find(
            {
              fields: {date: true, step: true},
              where: {
                and: [{date: {gte: new Date(date.getFullYear() + '-1')}}, {date: {lte: date}}],
              },
            },
            {strictObjectIDCoercion: false},
          )
          .then(value => {
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < value.length; i++) {
              const month = value[i].date.getMonth();
              data[month].addStep(value[i].step);
            }
          });
        break;
    }
    console.log(data);
    return new AppResponse({data: {stepHistoryList: data}});
  }

  @post('/api/user/step', resSpec('User profile', RespUserInfoModel))
  @authenticate('jwt')
  async userAddStep(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() stepModel: PostStepListModel,
  ): Promise<AppResponse> {
    console.log(stepModel.stepList);
    if (stepModel.stepList === undefined || stepModel.stepList.length === 0) {
      throw new AppResponse({code: 400});
    }
    stepModel.stepList.forEach(value => {
      value = new PostStepModel(value);
    });

    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < stepModel.stepList.length; i++) {
      const currDate = Helper.getDate(stepModel.stepList[i].date);
      let deltaStep = stepModel.stepList[i].step;

      const stepCountHistories = await this.userRepository
        .stepHistory(user.id)
        .find({where: {date: currDate}}, {strictObjectIDCoercion: false});
      if (stepCountHistories.length > 0) {
        deltaStep -= stepCountHistories[0].step;
        await this.userRepository.stepHistory(user.id).patch(
          {
            step: stepModel.stepList[i].step,
          },
          {date: currDate},
          {strictObjectIDCoercion: false},
        );
      } else {
        const stepCountHistory = new UserStepHistory();
        stepCountHistory.step = deltaStep;
        stepCountHistory.date = currDate;
        await this.userRepository.stepHistory(user.id).create(stepCountHistory, {
          strictObjectIDCoercion: false,
        });
      }
      user.stepTemp = user.stepTemp + deltaStep;
    }

    if (user.stepTemp >= Config.STEPCOUNT_PER_POINT) {
      user.currentPoint = user.currentPoint + Math.floor(user.stepTemp / Config.STEPCOUNT_PER_POINT);
      user.stepTemp = user.stepTemp % Config.STEPCOUNT_PER_POINT;
    }

    await this.userRepository.updateById(user.id, {
      currentPoint: user.currentPoint,
      stepTemp: user.stepTemp,
    });

    return new AppResponse({data: new RespUserInfoModel(user)});
  }

  @get('/api/user/store', resSpec('List refill location', RespLocationRefillModel))
  @authenticate('jwt')
  async userGetStoreByLocation(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.number('lat') lat: number,
    @param.query.number('lng') lng: number,
  ): Promise<AppResponse> {
    Validate.latLng(lat, lng);

    // const detaLatLng = Helper.getDeltaLatLng(Config.MAX_NEAR_DISTANCE);
    // const fromLat = lat - detaLatLng;
    // const fromLng = lng - detaLatLng;
    // const toLat = lat + detaLatLng;
    // const toLng = lng + detaLatLng;

    // const stores = await this.find({
    //   where: {
    //     and: [
    //       {lat: {gte: fromLat}},
    //       {lng: {gte: fromLng}},
    //       {lat: {lte: toLat}},
    //       {lng: {lte: toLng}},
    //     ],
    //   },
    // });

    const locations = await this.storeLocationRepository.find();
    //console.log(locations);

    let result: RespLocationRefillModel[] = [];

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < locations.length; i++) {
      const store = await this.storeRepository.findById(locations[i].storeId);
      const distance = Helper.distanceLocation(lat, lng, locations[i].lat, locations[i].lng);
      const storeRes = new RespLocationRefillModel(store, locations[i], distance);
      storeRes._distance = distance;
      //if (distance <= Config.MAX_NEAR_DISTANCE) {
      //console.log(storeRes);
      result.push(storeRes);
    }
    result = result.sort((a, b) => {
      return (a._distance && b._distance && a._distance - b._distance) || 0;
    });
    //console.log(result);
    result = result.slice(
      0,
      (result.length >= Config.MAX_REFILL_LOCATION_RESPONSE_NUMBER && Config.MAX_REFILL_LOCATION_RESPONSE_NUMBER) ||
        result.length,
    );

    return new AppResponse({data: {listStore: result}});
  }

  @get('/api/user/store/{storeLocationId}', resSpec('Detail refill location', RespLocationRefillDetailModel))
  @authenticate('jwt')
  async userGetStoreDetail(
    @param.path.string('storeLocationId') storeLocationId: string,
    @param.query.number('lat') lat: number,
    @param.query.number('lng') lng: number,
  ): Promise<AppResponse> {
    const location = await this.storeLocationRepository.findById(storeLocationId).catch(err => {
      throw new AppResponse({code: 404});
    });

    const store = await this.storeRepository.findById(location.storeId);
    const data = new RespLocationRefillDetailModel(store, location);

    if (data && lat && lng) {
      data.setDistance(Helper.distanceLocation(lat, lng, location.lat, location.lng));
    }
    return new AppResponse({data: data});
  }

  @get('/api/user/bottle', resSpec('Detail refill location', {isValidBottle: {type: 'boolean'}}))
  @authenticate('jwt')
  async userGetBottle(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    return new AppResponse({
      data: {isValidBottle: user.bottleVolumn !== 0},
    });
  }

  @post('/api/user/bottle', resSpec('Edit bottle result', {}))
  @authenticate('jwt')
  async userPostBottle(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() bottle: PostBottleModel,
  ): Promise<AppResponse> {
    bottle = new PostBottleModel(bottle);
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    await this.userRepository.updateById(user.id, {bottleVolumn: bottle.bottleVolumn}).catch(err => {
      throw new AppResponse({code: 500});
    });
    return new AppResponse();
  }

  @post('/api/user/refill/{storeLocationId}', resSpec('Refill result', {}))
  @authenticate('jwt')
  async userRefill(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('storeLocationId') storeLocationId: string,
    @requestBody() position: PostPositionModel,
  ): Promise<AppResponse> {
    position = new PostPositionModel(position);
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const location = await this.storeLocationRepository.findById(storeLocationId);
    const store = await this.storeRepository.findById(location.storeId).catch(err => {
      throw new AppResponse({code: 400, message: 'Invalid store'});
    });
    const distance = Helper.distanceLocation(position.lat, position.lng, location.lat, location.lng);
    if (distance > Config.MAX_REFILL_DISTANCE) {
      throw new AppResponse({
        code: 400,
        message: 'You should go to store to refill',
      });
    }
    if (user.bottleVolumn <= 0) {
      throw new AppResponse({
        code: 400,
        message: 'You should have bottle to refill',
      });
    }
    const currDate = Helper.getDate();
    const refillHistory = await this.userRepository.refillHistory(currentUser.id).find(
      {
        where: {
          and: [
            {createAt: {gt: currDate}},
            {
              createAt: {
                lt: new Date(currDate.getTime() + Config.MILLISEC_PER_DAY),
              },
            },
          ],
        },
      },
      {
        strictObjectIDCoercion: false,
      },
    );
    //console.log(refillHistory);
    if (refillHistory) {
      if (refillHistory.length > 5) {
        throw new AppResponse({
          code: 400,
          message: 'Max refill',
        });
      }
    }
    const newRefillHistory = await this.userRepository.refillHistory(user.id).create(
      new UserRefillHistory({
        storeId: store.id,
        storeLocationId: location.id,
        lat: position.lat,
        lng: position.lng,
      }),
    );
    console.log(newRefillHistory);
    await this.userRepository.updateById(user.id, {
      currentPoint: user.currentPoint + Config.POINT_PER_REFILL,
    });
    return new AppResponse();
  }

  @get('/api/user/product', resSpec('Product list', RespProductModel))
  @authenticate('jwt')
  async userGetProductByCategoryName(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('categoryName') categoryName: string,
  ): Promise<AppResponse> {
    if (categoryName === undefined) {
      throw new AppResponse({code: 400});
    }
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const data = [];
    if (categoryName.toLocaleLowerCase() === 'all') {
      const products = await this.productRepository.find({
        where: {quantity: {gt: 0}},
        order: ['createAt DESC'],
      });

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < products.length; i++) {
        const store = await this.storeRepository.findById(products[i].storeId).catch(err => {
          return new Store();
        });
        const category = await this.categoryRepository.findById(products[i].categoryId).catch(err => {
          return new Category();
        });
        const result: RespProductModel = new RespProductModel(products[i], store, category);
        data.push(result);
      }
    } else {
      const category = await this.categoryRepository.findOne({
        where: {name: {eq: categoryName.toLocaleLowerCase()}},
      });
      if (category !== null) {
        const products = await this.categoryRepository.products(category.id).find(
          {where: {quantity: {gt: 0}}, order: ['createAt DESC']},
          {
            strictObjectIDCoercion: false,
          },
        );
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < products.length; i++) {
          const store = await this.storeRepository.findById(products[i].storeId);
          const result = new RespProductModel(products[i], store, category, user.currentPoint);
          data.push(result);
        }
      }
    }
    return new AppResponse({data: {productList: data}});
  }

  @post('/api/user/buy/{productId}', resSpec('Buy result', {}))
  @authenticate('jwt')
  async userBuyProduct(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('productId') productId: string,
  ): Promise<AppResponse> {
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const product = await this.productRepository.findById(productId).catch(err => {
      throw new AppResponse({code: 400, message: 'Invalid product'});
    });
    if (product.quantity <= 0) {
      throw new AppResponse({code: 400, message: 'Invalid product'});
    }
    if (user.currentPoint >= product.point) {
      const exchangeHistory = new UserExchangeHistory({
        productId: productId,
        point: product.point,
        received: false,
        dueDate: new Date(new Date().getTime() + Config.MAX_EXCHANGE_DUEDATE * Config.MILLISEC_PER_DAY),
      });
      await this.userRepository.updateById(user.id, {
        currentPoint: user.currentPoint - product.point,
      });
      await this.productRepository
        .updateById(product.id, {
          quantity: product.quantity - 1,
        })
        .catch(err => {
          throw new AppResponse({code: 500});
        });
      await this.userRepository
        .exchangeHistory(user.id)
        .create(exchangeHistory)
        .catch(err => {
          throw new AppResponse({code: 500});
        });
      return new AppResponse();
    } else {
      throw new AppResponse({code: 400, message: 'Not enough point'});
    }
  }

  @get('/api/user/reward', resSpec('User reward list', RespExchangeModel))
  @authenticate('jwt')
  async userGetBuy(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.string('type') type: string,
  ): Promise<AppResponse> {
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    let exchanges;
    switch (type.toLocaleLowerCase()) {
      case 'all':
        exchanges = await this.userRepository.exchangeHistory(user.id).find(
          {
            order: ['received ASC', 'createAt DESC'],
          },
          {strictObjectIDCoercion: false},
        );
        break;
      case 'available':
        exchanges = await this.userRepository
          .exchangeHistory(user.id)
          .find({where: {received: false}, order: ['createAt DESC']}, {strictObjectIDCoercion: false});
        break;
      case 'used':
        exchanges = await this.userRepository
          .exchangeHistory(user.id)
          .find({where: {received: true}, order: ['createAt DESC']}, {strictObjectIDCoercion: false});
        break;
    }
    const results = [];
    if (exchanges && exchanges.length > 0) {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < exchanges.length; i++) {
        const product = await this.productRepository.findById(exchanges[i].productId);
        const store = await this.storeRepository.findById(product.storeId).catch(err => {
          return new Store();
        });
        const category = await this.categoryRepository.findById(product.categoryId).catch(err => {
          return new Category();
        });
        product.point = exchanges[i].point;
        const result: RespExchangeModel = new RespExchangeModel(exchanges[i], product, store, category);
        results.push(result);
      }
    }
    console.log(results);
    return new AppResponse({data: {rewardList: results}});
  }

  @get(
    '/api/user/reward/{exchangeId}',
    resSpec('Reward info', {
      codeQR: {type: 'string'},
      product: {
        $ref: '#/components/schemas/RespProductModel',
      },
    }),
  )
  @authenticate('jwt')
  async userGetBuyDetail(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('exchangeId') exchangeId: string,
  ) {
    if (exchangeId === undefined) {
      throw new AppResponse({code: 400});
    }
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const exchange = await this.userExchangeHistoryRepository
      .findById(exchangeId, {}, {strictObjectIDCoercion: false})
      .catch(err => {
        throw new AppResponse({code: 404, message: 'Not found exchange'});
      });
    if (!Helper.compareId(user.id, exchange.userId)) {
      throw new AppResponse({code: 400, message: 'You are not the owner'});
    }
    if (exchange.dueDate < new Date() || exchange.received) {
      throw new AppResponse({code: 400, message: 'Reward was received'});
    }

    const product = await this.productRepository.findById(exchange.productId);
    const store = await this.storeRepository.findById(product.storeId).catch(err => {
      return undefined;
    });
    const category = await this.categoryRepository.findById(product.categoryId).catch(err => {
      return undefined;
    });

    return new AppResponse({
      data: {
        codeQR: exchange.id,
        product: new RespProductModel(product, store, category),
      },
    });
  }

  @post('/api/user/runningrecord', resSpec('Post running result', {}))
  @authenticate('jwt')
  async userPostRunningRecord(
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
              startTime: {description: 'Start time of record, ex: 2020-03-03T20:00:00.000Z', type: 'string'},
              endTime: {description: 'End time of record, ex: 2020-03-03T20:00:00.000Z', type: 'string'},
              selfie: {description: 'Selfie images (type file)'},
              path: {
                description: 'Record path (json object, ex: [{"lat": 0, "lng": 0}, {"lat": 1, "lng": 1}])',
                type: 'string',
                // type: 'array',
                // items: {$ref: '#/components/schemas/Geopoint'},
              },
              totalStep: {description: 'Total step', type: 'integer'},
              totalCalorie: {description: 'Total calorie (calo)', type: 'integer'},
              totalDistance: {description: 'Total distance (meter)', type: 'integer'},
              title: {description: 'Title running record', type: 'string'},
              description: {description: 'Description running record', type: 'string'},
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    let fileDownloaded = '';
    let fileUploaded = await this.uploadService.uploadImages(request, response, 'selfie');
    if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing selfie field.');
    await Promise.all(
      fileUploaded.map(
        async (item): Promise<void> => {
          FileService.moveFile(item, Config.ImagePath.UserSelfie.Dir, FileService.getFileName(item));
        },
      ),
    );
    fileUploaded = fileUploaded.map(item => FileService.getFileName(item));
    Log.d('userPostRunningRecord', fileUploaded);
    try {
      Log.d('userPostRunningRecord: request body', request.body);
      const postRunningRecord = new PostRunningRecordModel(request.body);
      Log.d('userPostRunningRecord: postRunningRecord', postRunningRecord);
      if (fileUploaded) {
        postRunningRecord.selfieImageUrl = fileUploaded;
      } else {
        postRunningRecord.selfieImageUrl = [];
      }
      if (postRunningRecord.path.length >= 2) {
        fileDownloaded = await GoogleMapService.renderMapImage({linePath: postRunningRecord.path});
        fileDownloaded = FileService.moveFile(
          fileDownloaded,
          Config.ImagePath.RunningRecord.Dir,
          FileService.getFileName(fileDownloaded),
        );
        postRunningRecord.recordImageUrl = FileService.getFileName(fileDownloaded);
      }

      await this.userRepository.runningRecord(currentUser.id).create(postRunningRecord);
      return new AppResponse();
    } catch (error) {
      await Promise.all(
        fileUploaded.map(
          async (item): Promise<void> => {
            FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.UserSelfie.Dir, item));
          },
        ),
      );
      if (fileDownloaded)
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.UserSelfie.Dir, fileDownloaded));
      throw error;
    }
  }

  @get('/api/user/runningrecord', resSpec('Running record list', RespRunningRecordModel))
  @authenticate('jwt')
  async userGetMyRunningRecord(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.query.integer('page') page: Number,
  ) {
    if (!page || page < 0) page = 0;
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const runningRecords = await this.userRepository
      .runningRecord(currentUser.id)
      .find({skip: 10 * page.valueOf(), limit: 10});
    return new AppResponse({
      code: 200,
      data: {runningRecordList: runningRecords.map(item => new RespRunningRecordModel(item))},
    });
  }

  @get('/api/user/{userId}/runningrecord', resSpec('Running record list', RespRunningRecordModel))
  @authenticate('jwt')
  async userGetRunningRecord(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('userId') userId: string,
    @param.query.integer('page') page: Number,
    @param.query.dateTime('fromDate') fromDate: Date,
    @param.query.dateTime('toDate') toDate: Date,
  ) {
    if (!page || page < 0) page = 0;
    await this.userRepository.findById(userId).catch(err => {
      throw new AppResponse({code: 401});
    });
    const runningRecords = await this.userRepository.runningRecord(userId).find({skip: 10 * page.valueOf(), limit: 10});
    return new AppResponse({
      code: 200,
      data: {runningRecordList: runningRecords.map(item => new RespRunningRecordModel(item))},
    });
  }

  @put('/api/user/runningrecord/{recordId}', resSpec('Result edit', RespRunningRecordModel))
  @authenticate('jwt')
  async userEditRunningRecord(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('recordId') recordId: string,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              selfie: {description: 'Selfie images will be added (type file)'},
              title: {description: 'Title running record', type: 'string'},
              description: {description: 'Description running record', type: 'string'},
              removeSelfieFile: {
                description: 'Selfie files will be removed, ex: ["filename.png", "filename.png", ...]',
                type: 'string',
              },
            },
          },
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    let fileUploaded = await this.uploadService.uploadImages(request, response, 'selfie');
    await Promise.all(
      fileUploaded.map(
        async (item): Promise<void> => {
          FileService.moveFile(item, Config.ImagePath.UserSelfie.Dir, FileService.getFileName(item));
        },
      ),
    );
    fileUploaded = fileUploaded.map(item => FileService.getFileName(item));
    Log.d('userEditRunningRecord', fileUploaded);
    try {
      const postEditRunningRecordModel = new PostEditRunningRecordModel(request.body);
      Log.d('userEditRunningRecord: postEditRunningRecordModel', postEditRunningRecordModel);

      const currentRecord = await this.userRepository
        .runningRecord(currentUser.id)
        .find({where: {id: recordId}})
        .catch(err => {
          throw new AppResponse({code: 401});
        });
      let selfieImageUrl = currentRecord[0].selfieImageUrl || [];
      const removeFile: string[] = [];

      if (postEditRunningRecordModel.removeSelfieFile !== undefined) {
        selfieImageUrl = selfieImageUrl.filter(value => {
          if ((postEditRunningRecordModel.removeSelfieFile || []).includes(value)) {
            removeFile.push(value);
            return false;
          }
          return true;
        });
      }

      if (fileUploaded) {
        fileUploaded.forEach(item => {
          selfieImageUrl.push(item);
        });
      }

      await Promise.all(
        removeFile.map(
          async (item): Promise<void> => {
            FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.UserSelfie.Dir, item));
          },
        ),
      );

      const count = await this.userRepository.runningRecord(currentUser.id).patch(
        {
          title: postEditRunningRecordModel.title,
          description: postEditRunningRecordModel.description,
          selfieImageUrl: selfieImageUrl,
        },
        {id: recordId},
      );
      Log.d('userDeleteRunningRecord: edited', count);
      return new AppResponse({code: 200, data: count});
    } catch (error) {
      await Promise.all(
        fileUploaded.map(
          async (item): Promise<void> => {
            FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.UserSelfie.Dir, item));
          },
        ),
      );
      throw error;
    }
  }

  @del('/api/user/runningrecord/{recordId}', resSpec('Result remove', {}))
  @authenticate('jwt')
  async userDeleteRunningRecord(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @param.path.string('recordId') recordId: string,
  ) {
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const count = await this.userRepository.runningRecord(currentUser.id).delete({id: recordId});
    Log.d('userDeleteRunningRecord: count', count);
    return new AppResponse({code: 200, data: count && count.count === 1 ? {recordId: recordId} : count});
  }
}
