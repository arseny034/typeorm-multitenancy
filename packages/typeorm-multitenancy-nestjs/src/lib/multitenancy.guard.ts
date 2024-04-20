import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { tenantIdStore } from './multitenancy.constants';

@Injectable()
export class MultitenancyGuard implements CanActivate {
  canActivate(_: ExecutionContext) {
    const tenantId = tenantIdStore.getStore();

    if (!tenantId) {
      throw new UnauthorizedException('x-tenant-id header is required');
    }

    return true;
  }
}
