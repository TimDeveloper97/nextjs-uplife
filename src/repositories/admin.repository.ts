import {TimeStampRepository} from './timestamp-repository';
import {Admin} from '../models';
import {MongoDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {Log, PasswordHasher} from '../utils';

export class AdminRepository extends TimeStampRepository<Admin, typeof Admin.prototype.id> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Admin, dataSource);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.startUp();
  }

  static isStartup = true;
  static accounts = [{email: 'admin@uplife.com', password: '123456', name: 'Uplife'}];

  private async startUp() {
    if (AdminRepository.isStartup) {
      await Promise.all(
        AdminRepository.accounts.map(async item => {
          const admin = await this.findOne({where: {email: item.email}});
          if (!admin) {
            Log.d('AdminRepository: init', item);
            await this.create(new Admin({...item, password: await PasswordHasher.hashPassword(item.password)}));
          }
        }),
      );
      AdminRepository.isStartup = false;
    }
  }
}
