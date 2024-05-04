import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { query } from '../../../test/sqlite-helpers';
import { TenantConnectionNotFound } from '../errors';
import { MultitenantDataSource } from '../multitenant-data-source';
import { MultitenantRepository } from '../multitenant-repository';
import { MultitenantDataSourceInstance } from '../types';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: false })
  company: Company;
}

const TENANT_1 = 'tenant_1';
const TENANT_2 = 'tenant_2';

describe('MultitenantDataSource', () => {
  let dataSource: MultitenantDataSourceInstance;
  let currentTenantId: string;

  beforeEach(async () => {
    dataSource = await new MultitenantDataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [User, Company],
      synchronize: true,
      getTenantId: () => currentTenantId,
      dataSourceConfigFactory: (tenantId, sharedOptions) => ({
        ...sharedOptions,
        database: `.sqlite/${tenantId}.db`,
      }),
    }).initialize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it('should initialize tenant connection', async () => {
    // There's no tenant connection yet, so it's considered initialized automatically
    expect(dataSource.isInitialized).toBe(true);

    await dataSource.setTenants(['default']);

    expect(dataSource.isInitialized).toBe(true);

    currentTenantId = 'default';

    const [{ version }] = await dataSource.query(
      'SELECT sqlite_version() AS version',
    );

    expect(version).toMatch(/\d+\.\d+\.\d+/);
  });

  it('should destroy tenant connection', async () => {
    await dataSource.setTenants(['default']);
    await dataSource.removeTenant('default');

    currentTenantId = 'default';

    const promise = dataSource.query('SELECT sqlite_version() AS version');

    expect(promise).rejects.toThrowError(TenantConnectionNotFound);
  });

  it('should reject query if tenant was never initialized', async () => {
    currentTenantId = 'default';

    const promise = dataSource.query('SELECT sqlite_version() AS version');

    expect(promise).rejects.toThrowError(TenantConnectionNotFound);
  });

  it('should proxy query to corresponding tenant connection', async () => {
    interface CountResult {
      cnt: number;
    }

    await dataSource.setTenants([TENANT_1, TENANT_2]);

    const repository = dataSource.getRepository(Company);

    currentTenantId = TENANT_1;

    const company1 = repository.create({ name: 'Company 1' });
    await dataSource.getRepository(Company).save(company1);

    currentTenantId = TENANT_2;

    const company2 = repository.create({ name: 'Company 2' });
    await dataSource.getRepository(Company).save(company2);

    const countCompaniesSql =
      'SELECT count(*) AS cnt FROM company WHERE company.name = ?';

    const { cnt: countCompany1InTenant1 } = await query<CountResult>(
      TENANT_1,
      countCompaniesSql,
      [company1.name],
    );
    expect(countCompany1InTenant1).toBe(1);

    const { cnt: countCompany2InTenant1 } = await query<CountResult>(
      TENANT_1,
      countCompaniesSql,
      [company2.name],
    );
    expect(countCompany2InTenant1).toBe(0);

    const { cnt: countCompany1InTenant2 } = await query<CountResult>(
      TENANT_2,
      countCompaniesSql,
      [company1.name],
    );
    expect(countCompany1InTenant2).toBe(0);

    const { cnt: countCompany2InTenant2 } = await query<CountResult>(
      TENANT_2,
      countCompaniesSql,
      [company2.name],
    );
    expect(countCompany2InTenant2).toBe(1);
  });

  it('should initialize entity metadata without adding tenants', async () => {
    expect(dataSource.entityMetadatas).toBeInstanceOf(Array);
    expect(dataSource.entityMetadatasMap).toBeInstanceOf(Map);

    const entityNames = dataSource.entityMetadatas.map(
      (metadata) => metadata.name,
    );
    const entityClasses = [...dataSource.entityMetadatasMap.keys()];

    expect(entityNames).toEqual(['Company', 'User']);
    expect(entityClasses).toEqual([Company, User]);
  });

  it('should initialize repository without adding tenants', async () => {
    const repository = dataSource.getRepository(Company);

    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(MultitenantRepository);
    expect(repository.metadata.name).toBe('Company');
  });
});
