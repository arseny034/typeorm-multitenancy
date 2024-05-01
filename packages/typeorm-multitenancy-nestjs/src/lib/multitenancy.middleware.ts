import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantIdGetter {
  (request: any): string | null;
}

export interface MultitenancyMiddlewareConstructor<
  C extends typeof MultitenancyMiddleware,
> {
  new (): InstanceType<C>;
}

@Injectable()
export class MultitenancyMiddleware implements NestMiddleware {
  protected static tenantIdStorage = new AsyncLocalStorage<string>();

  static create<C extends typeof MultitenancyMiddleware>(
    this: C,
    getter: TenantIdGetter,
  ): MultitenancyMiddlewareConstructor<C> {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/37142
    return class extends this {
      constructor() {
        super();

        this.getter = getter;
      }
    };
  }

  static fromHeader<C extends typeof MultitenancyMiddleware>(
    this: C,
    header: string,
  ): MultitenancyMiddlewareConstructor<C> {
    return this.create(
      (request: { headers: Record<string, string | undefined> }) =>
        request.headers[header] ?? null,
    );
  }

  static getCurrentTenantId() {
    return MultitenancyMiddleware.tenantIdStorage.getStore();
  }

  protected getter!: TenantIdGetter;

  use(request: unknown, _: unknown, next: (error?: unknown) => void) {
    const tenantId = this.getter(request);

    if (tenantId) {
      MultitenancyMiddleware.tenantIdStorage.run(tenantId, next);
      return;
    }

    next();
  }
}
