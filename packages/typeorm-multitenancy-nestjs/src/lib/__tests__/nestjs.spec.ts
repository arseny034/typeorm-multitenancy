import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InjectDataSource,
  InjectEntityManager,
  InjectRepository,
  TypeOrmModule,
} from '@nestjs/typeorm';
import {
  Column,
  DataSource,
  Entity,
  EntityManager,
  PrimaryGeneratedColumn,
  Repository,
} from 'typeorm';
import {
  MultitenantDataSource,
  MultitenantDataSourceInstance,
} from 'typeorm-multitenancy';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { query } from '../../../test/sqlite-helpers';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}

@Injectable()
class UserService {
  constructor(
    @InjectRepository(User) public readonly userRepository: Repository<User>,
    @InjectDataSource()
    public readonly dataSource: MultitenantDataSourceInstance,
    @InjectEntityManager() public readonly entityManager: EntityManager,
  ) {}
}

const TENANT_1 = 'tenant_1';
const TENANT_2 = 'tenant_2';

const seedUser = (tenantId: typeof TENANT_1 | typeof TENANT_2) =>
  query<User>(tenantId, "INSERT INTO user (name) VALUES ('Alice') RETURNING *");

describe('MultitenantDataSource & TypeOrmModule', () => {
  let module: TestingModule;
  let service: UserService;
  let dataSource: MultitenantDataSourceInstance;
  let currentTenantId: string;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [User],
            synchronize: true,
            dropSchema: true,
          }),
          dataSourceFactory: () =>
            new MultitenantDataSource({
              type: 'better-sqlite3',
              database: ':memory:',
              entities: [User],
              synchronize: true,
              dropSchema: true,
              getTenantId: () => currentTenantId,
              getTenantDataSourceConfig: (tenantId, sharedOptions) => ({
                ...sharedOptions,
                database: `.sqlite/${tenantId}.db`,
              }),
            }).initialize(),
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get(UserService);
    dataSource = module.get(DataSource);

    await dataSource.addTenants([TENANT_1, TENANT_2]);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should route queries when using default injected repo', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.userRepository.findOneBy({ id });
    };

    const insertedUser = await query<User>(
      TENANT_1,
      "INSERT INTO user (name) VALUES ('Alice') RETURNING *",
    );

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it("should route queries when using default repo's query builder", async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.userRepository
        .createQueryBuilder('user')
        .where('id = :id', { id })
        .getOne();
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it("should route queries when using default repo's query method", async () => {
    const findOneById = async function (this: UserService, id: number) {
      const [user] = await this.userRepository.query(
        `SELECT * FROM user WHERE id = ?`,
        [id],
      );
      return user ?? null;
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using repo obtained from data source', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.dataSource.getRepository(User).findOneBy({ id });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it("should route queries when using data source's query builder", async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.dataSource
        .createQueryBuilder(User, 'user')
        .where('id = :id', { id })
        .getOne();
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it("should route queries when using data source's query method", async () => {
    const findOneById = async function (this: UserService, id: number) {
      const [user] = await this.dataSource.query(
        `SELECT * FROM user WHERE id = ?`,
        [id],
      );
      return user ?? null;
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using transaction manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.dataSource.transaction(async (entityManager) => {
        return await entityManager.findOneBy(User, { id });
      });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using repo obtained from transaction manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.dataSource.transaction(async (entityManager) => {
        return await entityManager.getRepository(User).findOneBy({ id });
      });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using entity manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.entityManager.findOneBy(User, { id });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using repo obtained via entity manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.entityManager.getRepository(User).findOneBy({ id });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using query builder obtained via entity manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.entityManager
        .createQueryBuilder(User, 'user')
        .where('id = :id', { id })
        .getOne();
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using query method of entity manager', async () => {
    const findOneById = async function (this: UserService, id: number) {
      const [user] = await this.entityManager.query(
        `SELECT * FROM user WHERE id = ?`,
        [id],
      );
      return user ?? null;
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });

  it('should route queries when using entity manager obtained from data source', async () => {
    const findOneById = async function (this: UserService, id: number) {
      return await this.dataSource.manager.findOneBy(User, { id });
    };

    const insertedUser = await seedUser(TENANT_1);

    currentTenantId = TENANT_1;
    const foundUser = await findOneById.call(service, insertedUser.id);

    expect(foundUser).toEqual(insertedUser);

    currentTenantId = TENANT_2;
    const notFoundUser = await findOneById.call(service, insertedUser.id);

    expect(notFoundUser).toBe(null);
  });
});
