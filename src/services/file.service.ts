import fs = require('fs');
import path = require('path');
import crypto = require('crypto');

export namespace FileService {
  export const readDir = function(dirPath: string): string[] {
    return fs.existsSync(dirPath) ? fs.readdirSync(dirPath) : [];
  };

  export const getFileName = function(filePath: string): string {
    return path.basename(filePath);
  };

  export const moveFile = function(src: string, des: string, filename: string): string {
    if (!fs.existsSync(des)) fs.mkdirSync(des, {recursive: true});
    if (fs.existsSync(src)) fs.renameSync(src, path.join(des, filename));
    return path.join(des, filename);
  };

  export const removeFile = function(src: string) {
    if (fs.existsSync(src)) fs.unlinkSync(src);
  };

  export const makeDir = function(dirPath: string) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, {recursive: true});
  };

  export const randomFileName = function(extname: string): string {
    const name = crypto.randomBytes(16).toString('Hex');
    const date = new Date();
    const filename = name + '-' + date.getTime() + (extname ? (extname.startsWith('.') ? extname : '.' + extname) : '');
    return filename;
  };
}
