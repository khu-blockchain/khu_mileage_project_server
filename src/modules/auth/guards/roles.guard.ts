import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthUserContext } from '@/modules/auth/auth.types';
import { Role } from '@/modules/auth/constants/role.constants';
import { ROLES_KEY } from '@/modules/auth/decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: AuthUserContext } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles.some((role) => role === user.role);
  }
}
