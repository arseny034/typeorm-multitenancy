import { DataSource, DataSourceOptions } from 'typeorm';

export type MultitenantDataSourceOptions = DataSourceOptions & {
  getTenantId: () => string | null;
};

export interface MultitenantDataSource extends DataSource {
  getTenantIds(): string[];
  getDefaultTenantId(): string;
  addTenants(tenantIds: string[]): Promise<void>;
  addTenant(tenantIds: string): Promise<void>;
  removeTenants(tenantIds: string[]): Promise<void>;
  removeTenant(tenantIds: string): Promise<void>;
}
