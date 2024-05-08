import { CanActivate, Injectable } from '@nestjs/common';

import { MultitenancyMiddleware } from './multitenancy.middleware';

@Injectable()
export class MultitenancyGuard implements CanActivate {
  canActivate() {
    return MultitenancyMiddleware.getCurrentTenantId() !== undefined;
  }
}
