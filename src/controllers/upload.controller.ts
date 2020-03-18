import {post, Request, Response, RequestBodyObject, requestBody, RestBindings, HttpErrors} from '@loopback/rest';
import {inject} from '@loopback/core';
import {UploadServiceBindings} from '../keys';
import {UploadService} from '../services/upload.service';

const requestBodyFileUpload: RequestBodyObject = {
  description: 'multipart/form-data value.',
  required: true,
  content: {
    'multipart/form-data': {
      'x-parser': 'stream',
      schema: {
        type: 'object',
        properties: {
          avatar: {description: 'Image file', type: 'file', deprecated: true},
        },
      },
    },
  },
};

export class UploadController {
  constructor(@inject(UploadServiceBindings.UPLOAD_SERVICE) public uploadService: UploadService) {}

  @post('uploads/avatar')
  async uploadAvatar(
    @requestBody(requestBodyFileUpload) req: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<object> {
    const tempFileName = await this.uploadService.uploadImages(req, res, 'avatar');
    if (!tempFileName) throw new HttpErrors.UnprocessableEntity('Missing avatar field.');
    // await this.uploadService.resizeImage(tempFileName);
    return {imgUrl: tempFileName};
  }
}
