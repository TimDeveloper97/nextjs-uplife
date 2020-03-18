import path = require('path');
import sharp = require('sharp');
import multer = require('multer');
import {FileService} from './file.service';
import {promisify} from 'util';
import {HttpErrors} from '@loopback/rest';
import {Request, Response} from 'express-serve-static-core';
import {FileFilterCallback} from 'multer';
import {Config} from '../config';

const IMAGE_TYPE = ['.png', '.jpg', '.jpeg'];

export class UploadService {
  private static tempStorage: multer.StorageEngine;

  constructor() {
    if (!UploadService.tempStorage) {
      FileService.makeDir(Config.UploadService.TempDir);
      UploadService.tempStorage = multer.diskStorage({
        destination: Config.UploadService.TempDir,
        filename: this.randomFileName,
      });
    }
  }

  async uploadImage(req: Request, res: Response, fieldName: string): Promise<string> {
    const upload = promisify(
      multer({
        storage: UploadService.tempStorage,
        fileFilter: this.imageFilter,
        limits: {fileSize: Config.UploadService.MaxFileSize},
      }).single(fieldName),
    );
    await upload(req, res);
    // console.log('\n\n');
    // console.log(req.file);
    const tempUploadedFile = req.file && req.file.filename;
    if (!tempUploadedFile) return tempUploadedFile;
    return path.join(Config.UploadService.TempDir, tempUploadedFile);
  }

  async uploadImages(req: Request, res: Response, fieldName: string): Promise<string[]> {
    const upload = promisify(
      multer({
        storage: UploadService.tempStorage,
        fileFilter: this.imageFilter,
        limits: {fileSize: Config.UploadService.MaxFileSize},
      }).array(fieldName),
    );
    await upload(req, res);
    // console.log('\n\n');
    // console.log(req.files);
    const tempUploadedFiles: string[] = (req.files as Express.Multer.File[]).map((file): string => file.filename);
    if (!tempUploadedFiles) return tempUploadedFiles;
    return tempUploadedFiles.map((item: string): string => path.join(Config.UploadService.TempDir, item));
  }

  async resizeImage(src: string) {
    const buffer = await sharp(src)
      .resize(256, 256)
      .toBuffer();
    await sharp(buffer).toFile(src);
  }

  private imageFilter(req: Express.Request, file: Express.Multer.File, callback: FileFilterCallback) {
    // console.log(req);
    // console.log(file);
    // console.log(req.files);
    const err =
      (file.mimetype && file.mimetype.startsWith('image') && IMAGE_TYPE.includes(path.extname(file.originalname))
        ? null
        : new HttpErrors.UnsupportedMediaType('File must be image type.')) || null;
    // (file.size <= 4 * 1024 * 1024 * 1024 ? null : new HttpErrors.UnprocessableEntity('File too large'));

    callback(err, err ? false : true);
  }

  private randomFileName(
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) {
    const filename = FileService.randomFileName(path.extname(file.originalname));
    callback(null, filename);
  }
}
