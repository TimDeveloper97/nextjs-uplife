import {UserProfile} from '@loopback/security';

export type PackageInfo = {
  name: string;
  version: string;
  description: string;
};

export interface AccountProfile extends UserProfile {
  group?: string;
}
