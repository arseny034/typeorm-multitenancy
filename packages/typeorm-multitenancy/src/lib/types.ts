import { DataSource, DataSourceOptions } from 'typeorm';

export type SpecificDataSourceOptions<T extends DataSourceOptions['type']> =
  DataSourceOptions & { type: T };

export type MultitenantDataSourceOptions<T extends DataSourceOptions['type']> =
  DataSourceOptions & {
    type: T;
    getTenantId: () => string | undefined;
    dataSourceConfigFactory?: (
      tenantId: string,
      sharedOptions: SpecificDataSourceOptions<T>,
    ) => SpecificDataSourceOptions<T>;
    dataSourceFactory?: (
      options: SpecificDataSourceOptions<T>,
    ) => Promise<DataSource>;
  };

export interface MultitenantDataSourceInstance extends DataSource {
  getTenants(): Promise<string[]>;
  setTenants(tenantIds: string[]): Promise<void>;
  addTenants(tenantIds: string[]): Promise<void>;
  addTenant(tenantIds: string): Promise<void>;
  removeTenants(tenantIds: string[]): Promise<void>;
  removeTenant(tenantIds: string): Promise<void>;
}

export interface MultitenantDataSourceConstructor {
  new <T extends DataSourceOptions['type']>(
    options: MultitenantDataSourceOptions<T>,
  ): MultitenantDataSourceInstance;
}
