import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

export const HATEOAS_LIST_KEY = 'hateoas:list';
export const HATEOAS_ITEM_KEY = 'hateoas:item';

export interface LinkDef {
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

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const listOptions = this.reflector.get<HateoasListOptions<unknown>>(
      HATEOAS_LIST_KEY,
      context.getHandler(),
    );
    const itemOptions = this.reflector.get<HateoasItemOptions<unknown>>(
      HATEOAS_ITEM_KEY,
      context.getHandler(),
    );

    if (!listOptions && !itemOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (listOptions) {
          return this.wrapList(data as PaginatedResult<unknown>, listOptions, request);
        }
        if (itemOptions) {
          return this.wrapItem(data, itemOptions);
        }
        return data;
      }),
    );
  }

  private wrapList(
    data: PaginatedResult<unknown>,
    options: HateoasListOptions<unknown>,
    request: Request,
  ) {
    const page = Number(request.query['_page'] ?? 1);
    const limit = Number(request.query['_size'] ?? 10);
    const total = data?.total ?? 0;
    const rows = data?.rows ?? (Array.isArray(data) ? data : []);
    const totalPages = Math.ceil(total / limit);

    const items = rows.map((item) => ({
      ...(item as Record<string, unknown>),
      _links: options.itemLinks(item),
    }));

    return {
      data: items,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
      _links: {
        self: { href: `${options.basePath}?_page=${page}&_size=${limit}`, method: 'GET' },
        first: { href: `${options.basePath}?_page=1&_size=${limit}`, method: 'GET' },
        last: { href: `${options.basePath}?_page=${totalPages}&_size=${limit}`, method: 'GET' },
        next:
          page < totalPages
            ? { href: `${options.basePath}?_page=${page + 1}&_size=${limit}`, method: 'GET' }
            : null,
        prev:
          page > 1
            ? { href: `${options.basePath}?_page=${page - 1}&_size=${limit}`, method: 'GET' }
            : null,
        create: { href: options.basePath, method: 'POST' },
      },
    };
  }

  private wrapItem(data: unknown, options: HateoasItemOptions<unknown>) {
    return {
      ...(data as object),
      _links: options.itemLinks(data),
    };
  }
}
