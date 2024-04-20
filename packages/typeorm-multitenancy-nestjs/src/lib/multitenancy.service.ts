import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { MultitenantDataSource } from 'typeorm-multitenancy';

import {
  TENANT_ID_EXTRACTOR_TOKEN,
  TENANT_REPO_TOKEN,
} from './multitenancy.constants';
import { withTenant } from './utils/with-tenant';

@Injectable()
export class MultitenancyService<T extends ObjectLiteral>
  implements OnApplicationBootstrap
{
  constructor(
    @Inject(TENANT_REPO_TOKEN)
    private readonly tenantsRepository: Repository<T>,
    @Inject(TENANT_ID_EXTRACTOR_TOKEN)
    private readonly extractTenantId: (tenant: T) => string,
    @InjectDataSource() private readonly dataSource: MultitenantDataSource,
  ) {}

  async onApplicationBootstrap() {
    const tenants = await this.tenantsRepository.find();
    const tenantNames = tenants.map(this.extractTenantId);
    await this.dataSource.addTenants(tenantNames);
  }

  async rescan() {
    await withTenant(this.dataSource.getDefaultTenantId(), async () => {
      const connectedTenantIds = new Set(this.dataSource.getTenantIds());
      const actualTenants = await this.tenantsRepository.find();

      const tenantIdsToCreate: string[] = [];

      for (const tenant of actualTenants) {
        const tenantId = this.extractTenantId(tenant);

        if (connectedTenantIds.has(tenantId)) {
          connectedTenantIds.delete(tenantId);
        } else {
          tenantIdsToCreate.push(tenantId);
        }
      }

      await Promise.all([
        this.dataSource.addTenants(tenantIdsToCreate),
        this.dataSource.removeTenants([...connectedTenantIds]),
      ]);
    });
  }
}
