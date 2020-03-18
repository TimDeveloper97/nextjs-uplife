import {model, property, Entity} from '@loopback/repository';
import {Validate} from '../validate';

@model()
export class PostStepModel extends Entity {
  @property({required: true})
  date: Date;
  @property({required: true})
  step: number;

  constructor(data?: Partial<PostStepModel>) {
    super(data);
    Validate.step(this.step);
  }
}

@model()
export class PostStepListModel extends Entity {
  @property.array(() => PostStepModel)
  stepList: PostStepModel[];

  constructor(data?: Partial<PostStepListModel>) {
    super(data);
  }
}
