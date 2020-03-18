import {genSalt, hash, compare} from 'bcryptjs';

export namespace PasswordHasher {
  export const hashPassword = async function(password: string): Promise<string> {
    const salt = await genSalt(10);
    return hash(password, salt);
  };

  export const comparePassword = async function(providedPass: string, storePass: string): Promise<boolean> {
    return compare(providedPass, storePass);
  };
}
