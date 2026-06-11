import { SetMetadata } from '@nestjs/common';

interface LinkDef {
  href: string;
  method: string;
}

export interface HateoasListOptions<T> {
  basePath: string;
  itemLinks: (item: T) => Record<string, LinkDef>;
}

export interface HateoasItemOptions<T> {
  basePath: string;
  itemLinks: (item: T) => Record<string, LinkDef>;
}

export const HATEOAS_LIST_KEY = 'hateoas:list';
export const HATEOAS_ITEM_KEY = 'hateoas:item';

export const HateoasList = <T>(options: HateoasListOptions<T>) =>
  SetMetadata(HATEOAS_LIST_KEY, options);

export const HateoasItem = <T>(options: HateoasItemOptions<T>) =>
  SetMetadata(HATEOAS_ITEM_KEY, options);
