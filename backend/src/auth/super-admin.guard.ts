import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly allowedEmails = [
    'svzelenin@yandex.ru',
    'pallermo72@gmail.com',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userEmail = user?.email || user?.username;

    if (!user || !userEmail) {
      return false;
    }

    if (this.allowedEmails.includes(userEmail)) {
      return true;
    }

    throw new ForbiddenException(
      'Access denied. Super Admin privileges required.',
    );
  }
}
