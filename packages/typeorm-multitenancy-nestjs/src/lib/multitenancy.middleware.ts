import { Injectable, NestMiddleware } from '@nestjs/common';

import { TENANT_ID_HEADER, tenantIdStore } from './multitenancy.constants';

@Injectable()
export class MultitenancyMiddleware implements NestMiddleware {
  use(
    request: { headers: Record<string, string | undefined> },
    _: unknown,
    next: () => void,
  ) {
    const tenantId = request.headers[TENANT_ID_HEADER];

    if (tenantId) {
      return tenantIdStore.run(tenantId, next);
    }

    next();
  }
}
