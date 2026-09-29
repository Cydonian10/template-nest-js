import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { LoginSchema } from '../dto/login.dto.js';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const result = LoginSchema.safeParse(request.body);
    if (!result.success) {
      throw new BadRequestException(
        result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        ),
      );
    }
    request.body = result.data;
    return super.canActivate(context);
  }
}
