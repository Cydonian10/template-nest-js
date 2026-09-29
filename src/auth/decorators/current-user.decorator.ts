import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

export const CurrentUser = createParamDecorator(
  (key: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    return key ? request.user?.[key] : request.user;
  },
);
