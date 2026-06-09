import { SetMetadata } from '@nestjs/common';
import { HATEOAS_ITEM_KEY, type HateoasItemOptions } from './hateoas.interceptor';

export const HateoasItem = <T>(options: HateoasItemOptions<T>) =>
  SetMetadata(HATEOAS_ITEM_KEY, options);
