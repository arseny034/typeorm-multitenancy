import { CanActivate, Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { Reflector } from '@nestjs/core';

import { NonTenantScope } from './decorators/non-tenant-scope.decorator';
import { MultitenancyMiddleware } from './multitenancy.middleware';

@Injectable()
export class MultitenancyGuard implements CanActivate {
  private readonly reflector = new Reflector();

  canActivate(context: ExecutionContext) {
    const [isNonTenantScopeClass, isNonTenantScopeHandler] =
      this.reflector.getAll(NonTenantScope, [
        context.getClass(),
        context.getHandler(),
      ]);

    if (isNonTenantScopeClass || isNonTenantScopeHandler) {
      return true;
    }

    return MultitenancyMiddleware.getCurrentTenantId() !== undefined;
  }
}
