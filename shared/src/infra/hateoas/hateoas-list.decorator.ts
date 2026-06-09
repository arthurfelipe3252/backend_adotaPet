import { SetMetadata } from '@nestjs/common';
import { HATEOAS_LIST_KEY, type HateoasListOptions } from './hateoas.interceptor';

export const HateoasList = <T>(options: HateoasListOptions<T>) =>
  SetMetadata(HATEOAS_LIST_KEY, options);
