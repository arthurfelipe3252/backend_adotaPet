import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@shared/domain/enums/permission.enum';
import { PERMISSIONS_KEY } from '@shared/infra/decorators/require-permissions.decorator';
import type { Request } from 'express';

interface JwtUser {
  permissions?: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request & { user: JwtUser }>();
    const user = request.user;
    if (!user?.permissions) return false;

    return required.every((p) => user.permissions!.includes(p));
  }
}
