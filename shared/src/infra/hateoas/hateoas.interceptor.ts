import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import type { Request } from 'express';
import {
  HATEOAS_ITEM_KEY,
  HATEOAS_LIST_KEY,
  type HateoasItemOptions,
  type HateoasListOptions,
} from './hateoas.decorators';

interface LinkDef {
  href: string;
  method: string;
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

    const req = context.switchToHttp().getRequest<Request & { query: Record<string, string> }>();

    return next.handle().pipe(
      map((data) => {
        if (listOptions) return this.wrapList(data, listOptions, req);
        if (itemOptions) return this.wrapItem(data, itemOptions);
        return data;
      }),
    );
  }

  private wrapList(
    data: unknown,
    options: HateoasListOptions<unknown>,
    req: Request & { query: Record<string, string> },
  ) {
    const page = Number(req.query._page ?? 1);
    const limit = Number(req.query._size ?? 10);

    let rows: unknown[];
    let total: number;

    if (
      data &&
      typeof data === 'object' &&
      'rows' in data &&
      'total' in data
    ) {
      const paginated = data as { rows: unknown[]; total: number };
      rows = paginated.rows;
      total = paginated.total;
    } else if (Array.isArray(data)) {
      rows = data;
      total = data.length;
    } else {
      return data;
    }

    const totalPages = Math.ceil(total / limit);
    const base = options.basePath;

    const items = rows.map((item) => ({
      ...(item as object),
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
        self: { href: `${base}?_page=${page}&_size=${limit}`, method: 'GET' },
        first: { href: `${base}?_page=1&_size=${limit}`, method: 'GET' },
        last: { href: `${base}?_page=${totalPages}&_size=${limit}`, method: 'GET' },
        next:
          page < totalPages
            ? { href: `${base}?_page=${page + 1}&_size=${limit}`, method: 'GET' }
            : null,
        prev:
          page > 1
            ? { href: `${base}?_page=${page - 1}&_size=${limit}`, method: 'GET' }
            : null,
        create: { href: base, method: 'POST' },
      },
    };
  }

  private wrapItem(data: unknown, options: HateoasItemOptions<unknown>) {
    if (!data) return data;
    return {
      ...(data as object),
      _links: options.itemLinks(data),
    };
  }
}
