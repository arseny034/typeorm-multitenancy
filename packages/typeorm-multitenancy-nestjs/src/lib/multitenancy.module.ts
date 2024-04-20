import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MultitenantDataSource } from 'typeorm-multitenancy';

import {
  TENANT_ID_EXTRACTOR_TOKEN,
  TENANT_REPO_TOKEN,
} from './multitenancy.constants';
import { MultitenancyGuard } from './multitenancy.guard';
import { MultitenancyService } from './multitenancy.service';

export interface MultitenancyModuleOptions<
  T extends new (..._arguments: any[]) => object,
> {
  entity: T;
  extractTenantId: (tenant: InstanceType<T>) => string;
}

@Module({})
export class MultitenancyModule {
  static forRoot<T extends new (...arguments_: any[]) => object>(
    options: MultitenancyModuleOptions<T>,
  ): DynamicModule {
    return {
      module: MultitenancyGuard,
      global: true,
      imports: [TypeOrmModule.forFeature([options.entity])],
      providers: [
        {
          provide: TENANT_REPO_TOKEN,
          inject: [DataSource],
          useFactory: (dataSource: MultitenantDataSource) =>
            dataSource.getRepository(options.entity),
        },
        {
          provide: TENANT_ID_EXTRACTOR_TOKEN,
          useValue: options.extractTenantId,
        },
        MultitenancyService,
      ],
      exports: [MultitenancyService],
    };
  }
}
