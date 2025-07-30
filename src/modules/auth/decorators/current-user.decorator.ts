import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthUserContext } from '@/modules/auth/auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
