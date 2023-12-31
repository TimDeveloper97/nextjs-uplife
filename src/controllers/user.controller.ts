import dateformat = require('dateformat');
//import Web3 from 'web3';
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
import {User, UserStepHistory, UserRefillHistory, UserExchangeHistory} from '../models';
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
  PostCardModel,
  PostPointModel,
} from '../commons/requests';
import {Config} from '../config';
import {Validate} from '../commons/validate';
import {UploadService, FileService, GoogleMapService, CoinService} from '../services';
import {RespCardModel} from '../commons/responses/resp-card.model';
import {PostCoinModel} from '../commons/requests/post-coin.model';
import {UserCoinHistory} from '../models/user-coin-history.model';

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
    return new AppResponse({data: await new RespUserInfoModel(user).loadCoin()});
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
    return new AppResponse({data: await new RespUserInfoModel(user).loadCoin()});
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
    let fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');
    if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');
    const fileName = FileService.getFileName(fileUploaded);
    fileUploaded = FileService.moveFile(fileUploaded, Config.ImagePath.User.Dir, fileName);

    try {
      if (fileUploaded) {
        await this.userRepository.updateById(currentUser.id, {imgUrl: fileName});
      } else {
        await this.userRepository.updateById(currentUser.id, {imgUrl: 'default.png'});
      }

      if (user.imgUrl !== 'default.png') {
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.User.Dir, fileName));
      }
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.User.Dir, fileName));
      throw error;
    }
    user = await this.userRepository.findById(currentUser.id);
    return new AppResponse({data: await new RespUserInfoModel(user).loadCoin()});
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
    Log.d('userGetStepHistory: stepHistoryList', data);
    return new AppResponse({data: {stepHistoryList: data}});
  }

  @post('/api/user/step', resSpec('User profile', RespUserInfoModel))
  @authenticate('jwt')
  async userAddStep(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() stepModel: PostStepListModel,
  ): Promise<AppResponse> {
    Log.d('userAddStep: stepList', stepModel.stepList);
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

    return new AppResponse({data: await new RespUserInfoModel(user).loadCoin()});
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

    const locations = await this.storeLocationRepository.find({include: [{relation: 'store'}]});

    let result: RespLocationRefillModel[] = locations.map(
      item => new RespLocationRefillModel(item, Helper.distanceLocation(lat, lng, item.lat, item.lng)),
    );
    //if (distance <= Config.MAX_NEAR_DISTANCE)
    result = result.sort((a, b) => {
      return (a._distance && b._distance && a._distance - b._distance) || 0;
    });
    Log.d('userGetStoreByLocation: listStore', result);
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
    const location = await this.storeLocationRepository
      .findById(storeLocationId, {include: [{relation: 'store'}]})
      .catch(err => {
        throw new AppResponse({code: 404});
      });

    const data = new RespLocationRefillDetailModel(location);

    if (data && lat !== undefined && lng !== undefined) {
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
    Log.d('userRefill: newRefillHistory', newRefillHistory);
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
    let data: RespProductModel[] = [];
    if (categoryName.toLocaleLowerCase() === 'all') {
      const products = await this.productRepository.find({
        where: {quantity: {gt: 0}},
        order: ['createAt DESC'],
        include: [{relation: 'category'}, {relation: 'store'}],
      });

      data = products.map(item => new RespProductModel(item, user.currentPoint));
    } else {
      const category = await this.categoryRepository.findOne({
        where: {name: {eq: categoryName.toLocaleLowerCase()}},
      });
      if (category !== null) {
        const products = await this.productRepository.find(
          {
            where: {categoryId: category.id, quantity: {gt: 0}},
            order: ['createAt DESC'],
            include: [{relation: 'category'}, {relation: 'store'}],
          },
          {
            strictObjectIDCoercion: false,
          },
        );
        data = products.map(item => new RespProductModel(item, user.currentPoint));
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
    let exchanges: UserExchangeHistory[] = [];
    switch (type.toLocaleLowerCase()) {
      case 'all':
        exchanges = await this.userRepository.exchangeHistory(user.id).find(
          {
            order: ['received ASC', 'createAt DESC'],
            include: [{relation: 'product', scope: {include: [{relation: 'store'}, {relation: 'category'}]}}],
          },
          {strictObjectIDCoercion: false},
        );
        break;
      case 'available':
        exchanges = await this.userRepository.exchangeHistory(user.id).find(
          {
            where: {received: false},
            order: ['createAt DESC'],
            include: [{relation: 'product', scope: {include: [{relation: 'store'}, {relation: 'category'}]}}],
          },
          {strictObjectIDCoercion: false},
        );
        break;
      case 'used':
        exchanges = await this.userRepository.exchangeHistory(user.id).find(
          {
            where: {received: true},
            order: ['createAt DESC'],
            include: [{relation: 'product', scope: {include: [{relation: 'store'}, {relation: 'category'}]}}],
          },
          {strictObjectIDCoercion: false},
        );
        break;
    }
    const results = exchanges.map(item => new RespExchangeModel(item));
    Log.d('userGetBuy: rewardList', results);
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

    const product = await this.productRepository.findById(exchange.productId, {
      include: [{relation: 'category'}, {relation: 'store'}],
    });

    return new AppResponse({
      data: {
        codeQR: exchange.id,
        product: new RespProductModel(product),
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
    Log.d('userPostRunningRecord: fileUploaded', fileUploaded);
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
        FileService.removeFile(
          Helper.getImageLocalPath(Config.ImagePath.RunningRecord.Dir, FileService.getFileName(fileDownloaded)),
        );
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
    Log.d('userEditRunningRecord: fileUploaded', fileUploaded);
    try {
      const postEditRunningRecordModel = new PostEditRunningRecordModel(request.body);
      Log.d('userEditRunningRecord: postEditRunningRecordModel', postEditRunningRecordModel);

      const currentRecord = await this.userRepository.runningRecord(currentUser.id).find({where: {id: recordId}});
      if (currentRecord.length === 0) throw new AppResponse({code: 401});

      let selfieImageUrl = currentRecord[0].selfieImageUrl || [];
      const removeFile: string[] = [];

      if (postEditRunningRecordModel.removeSelfieFile !== undefined) {
        postEditRunningRecordModel.removeSelfieFile = postEditRunningRecordModel.removeSelfieFile.map(item => {
          return item ? FileService.getFileName(item) : 'undefined';
        });
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
      const recordEdited = await this.userRepository.runningRecord(currentUser.id).find({where: {id: recordId}});
      Log.d('userDeleteRunningRecord: edited', count);
      return new AppResponse({code: 200, data: new RespRunningRecordModel(recordEdited[0])});
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

  @del('/api/user/runningrecord/{recordId}', resSpec('Result remove', {recordId: {type: 'string'}}))
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
    return new AppResponse({code: 200, data: {recordId: count.count ? recordId : ''}});
  }

  @post('/api/user/card', resSpec('Result add', RespCardModel))
  @authenticate('jwt')
  async userAddCard(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() postCardModel: PostCardModel,
  ) {
    postCardModel = new PostCardModel(postCardModel);
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const exists = await this.userRepository.card(currentUser.id).find({where: {address: postCardModel.address}});
    if (exists.length > 0) throw new AppResponse({code: 400, message: 'Card already exists'});

    if (!CoinService.isAddress(postCardModel.address))
      throw new AppResponse({code: 500, message: 'Invalid ethereum anddress'});

    const card = await this.userRepository.card(currentUser.id).create(postCardModel);
    return new AppResponse({data: new RespCardModel(card)});
  }

  @get('/api/user/card', resSpec('Card list', RespCardModel))
  @authenticate('jwt')
  async userGetCard(@inject(SecurityBindings.USER) currentUser: AccountProfile) {
    await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    const cards = await this.userRepository.card(currentUser.id).find();
    Log.d('userGetCard: cards', cards);
    const results = cards.map(item => new RespCardModel(item));
    Log.d('userGetCard: cardList', results);
    return new AppResponse({data: {cardList: results}});
  }

  @post('/api/user/exchangecoin', resSpec('Result exchange', RespUserInfoModel))
  @authenticate('jwt')
  async userExchangeCoin(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() postPointModel: PostPointModel,
  ) {
    postPointModel = new PostPointModel(postPointModel);
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });

    // Handle
    // exchange point to coin
    if (user.currentPoint < postPointModel.point)
      return new AppResponse({code: 406, message: 'Point exchange must lower point have'});

    user.currentPoint -= postPointModel.point;
    const coin = postPointModel.point / Config.COIN_RATE;
    const email = user.email;

    await CoinService.addUserCoin(email, coin).catch(err => {
      throw new AppResponse({code: 402});
    });
    this.userRepository.updateById(currentUser.id, user).catch(err => {
      throw new AppResponse({code: 500});
    });

    // update history
    const newCoinHistory = new UserCoinHistory();
    newCoinHistory.coin = coin;
    newCoinHistory.point = postPointModel.point;
    newCoinHistory.time = Helper.getDate();

    await this.userRepository.coinHistory(currentUser.id).create(newCoinHistory);

    return new AppResponse({data: await new RespUserInfoModel(user).loadCoin()});
  }

  @post('/api/user/withdraweth', resSpec('Result withdraw', RespUserInfoModel))
  @authenticate('jwt')
  async userWithdrawEth(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() postCoinModel: PostCoinModel,
  ) {
    postCoinModel = new PostCoinModel(postCoinModel);
    const user = await this.userRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });

    // Handle
    return CoinService.withdrawEth(user.email, postCoinModel.address, postCoinModel.coin);
  }
}
