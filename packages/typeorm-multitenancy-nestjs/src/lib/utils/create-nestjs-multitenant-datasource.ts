import { DataSource, DataSourceOptions } from 'typeorm';
import {
  createMultitenantDataSource,
  MultitenantDataSource,
  MultitenantDataSourceOptions,
} from 'typeorm-multitenancy';

import { getTenantId } from './get-tenant-id';

export function createNestjsMultitenantDatasource(
  options?: DataSourceOptions,
): MultitenantDataSource;
export function createNestjsMultitenantDatasource(
  dataSourceCtor: typeof DataSource,
  options?: DataSourceOptions,
): MultitenantDataSource;
export function createNestjsMultitenantDatasource(
  optionsOrCtor?: DataSourceOptions | typeof DataSource,
  options?: DataSourceOptions,
): MultitenantDataSource {
  if (options) {
    return createMultitenantDataSource(optionsOrCtor as typeof DataSource, {
      ...options,
      getTenantId,
    });
  }

  return createMultitenantDataSource({
    ...optionsOrCtor,
    getTenantId,
  } as MultitenantDataSourceOptions);
}
