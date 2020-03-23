/* eslint-disable @typescript-eslint/no-explicit-any */
import {AccountMixin} from './common/account.mixin';
import {Admin} from '../models';
import {AdminRepository, UserRepository, StoreRepository, UserRunningRecordRepository} from '../repositories';
import {repository, DefaultCrudRepository, Entity} from '@loopback/repository';
import {TokenService, authenticate} from '@loopback/authentication';
import {TokenServiceBindings, UploadServiceBindings} from '../keys';
import {inject} from '@loopback/context';
import {get, post, requestBody, Request, RestBindings, Response, HttpErrors, RequestContext} from '@loopback/rest';
import {resSpec, requestBodyFileUpload, Helper, Log} from '../utils';
import {RespAdminInfoModel} from '../commons/responses/resp-admin.model';
import {SecurityBindings} from '@loopback/security';
import {AccountProfile} from '../commons/types';
import {AppResponse} from '../commons/app-response.model';
import {PostAdminInfoModel} from '../commons/requests';
import {FileService} from '../services/file.service';
import {Config} from '../config';
import {UploadService} from '../services';

export class AdminController extends AccountMixin<Admin>(Admin) {
  constructor(
    @repository(UserRunningRecordRepository) public runningRecordRepository: UserRunningRecordRepository,
    @repository(StoreRepository) public storeRepository: StoreRepository,
    @repository(UserRepository) public userRepository: UserRepository,
    @repository(AdminRepository) public adminRepository: AdminRepository,
    @inject(TokenServiceBindings.TOKEN_SERVICE) public tokenService: TokenService,
    @inject(UploadServiceBindings.UPLOAD_SERVICE) public uploadService: UploadService,
  ) {
    super(adminRepository, tokenService, {canRegister: false});
  }

  @get('/api/admin/info', resSpec('Admin profile', RespAdminInfoModel))
  @authenticate('jwt')
  async adminGetInfo(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    const admin = await this.adminRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    return new AppResponse({data: new RespAdminInfoModel(admin)});
  }

  @post('/api/admin/info', resSpec('Admin profile', RespAdminInfoModel))
  @authenticate('jwt')
  async adminEditInfo(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody() userInfo: PostAdminInfoModel,
  ): Promise<AppResponse> {
    userInfo = new PostAdminInfoModel(userInfo);
    const user = await this.adminRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    await this.adminRepository
      .updateById(currentUser.id, {
        name: userInfo.name,
      })
      .catch(err => {
        throw new AppResponse({code: 500});
      });
    user.name = userInfo.name;
    return new AppResponse({data: new RespAdminInfoModel(user)});
  }

  @post('/api/admin/avatar', resSpec('Admin profile', RespAdminInfoModel))
  @authenticate('jwt')
  async adminUploadAvatar(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @requestBody(requestBodyFileUpload) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<AppResponse> {
    let user = await this.adminRepository.findById(currentUser.id).catch(err => {
      throw new AppResponse({code: 401});
    });
    let fileUploaded = await this.uploadService.uploadImage(request, response, 'avatar');
    if (!fileUploaded) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');
    const fileName = FileService.getFileName(fileUploaded);
    fileUploaded = FileService.moveFile(fileUploaded, Config.ImagePath.Admin.Dir, fileName);

    try {
      if (fileUploaded) {
        await this.adminRepository.updateById(currentUser.id, {imgUrl: fileName});
      } else {
        await this.adminRepository.updateById(currentUser.id, {imgUrl: 'default.png'});
      }

      if (user.imgUrl !== 'default.png') {
        FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Admin.Dir, fileName));
      }
    } catch (error) {
      FileService.removeFile(Helper.getImageLocalPath(Config.ImagePath.Admin.Dir, fileUploaded));
    }
    user = await this.adminRepository.findById(currentUser.id);
    return new AppResponse({data: new RespAdminInfoModel(user)});
  }

  @get('/api/admin/token', resSpec('Admin token', {group: {type: 'string'}, id: {type: 'string'}}))
  @authenticate('jwt')
  async adminToken(@inject(SecurityBindings.USER) currentUser: AccountProfile): Promise<AppResponse> {
    return new AppResponse({data: currentUser});
  }

  @post('/api/admin/image/clean', resSpec('Clean result', {}))
  @authenticate('jwt')
  async adminCleanImage(
    @inject(SecurityBindings.USER) currentUser: AccountProfile,
    @inject.context() context: RequestContext,
  ): Promise<AppResponse> {
    const count: any = {};
    await Promise.all(
      Object.keys(Config.ImagePath).map(async imagePathKey => {
        const files: string[] = FileService.readDir((Config.ImagePath as any)[imagePathKey as any].Dir);
        const hasEntity: {[property: string]: boolean} = {};

        const dataRepository = context.getSync<DefaultCrudRepository<Entity, number | string>>(
          `repositories.${(Config.ImagePath as any)[imagePathKey as any].Repository}Repository`,
          {optional: true},
        );

        if (!dataRepository) return;

        const datas = await dataRepository.find();
        let images = datas.map(
          (data): string => (data as any)[(Config.ImagePath as any)[imagePathKey as any].Property],
        );

        images = images.reduce((prev: any, cur: any, idx, arr): string[] => {
          prev = prev.concat(cur);
          return prev;
        }, []);

        Log.d(`adminCleanImage: ${imagePathKey} dbImages`, images);

        let unitCount = 0;
        files.forEach(file => {
          if (file.includes('default')) {
            (hasEntity as any)[file as any] = true;
            return;
          }
          (hasEntity as any)[file as any] = images.includes(file as any) ? true : (unitCount = unitCount + 1) && false;
        });

        count[imagePathKey as any] = unitCount;
        Log.d(`adminCleanImage: ${imagePathKey} hasEntity`, hasEntity);

        await Promise.all(
          files.map(async file => {
            if (!(hasEntity as any)[file as any])
              FileService.removeFile(
                Helper.getImageLocalPath((Config.ImagePath as any)[imagePathKey as any].Dir, file),
              );
          }),
        );
      }),
    );

    Log.d(`adminCleanImage: count`, count);
    return new AppResponse();
  }
}
