export { HateoasList, HateoasItem } from './hateoas.decorators';
export type { HateoasListOptions, HateoasItemOptions } from './hateoas.decorators';
export { HateoasInterceptor } from './hateoas.interceptor';

export interface PaginationParams {
  page: number;
  limit: number;
}
