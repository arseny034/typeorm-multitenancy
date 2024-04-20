import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntityTarget,
  Migration,
  ObjectLiteral,
  ObjectType,
  QueryRunner,
  ReplicationMode,
  SelectQueryBuilder,
} from 'typeorm';
import { QueryResultCache } from 'typeorm/cache/QueryResultCache';
import { Driver } from 'typeorm/driver/Driver';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { MongoEntityManager } from 'typeorm/entity-manager/MongoEntityManager';
import { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager';
import { Logger } from 'typeorm/logger/Logger';
import { EntityMetadata } from 'typeorm/metadata/EntityMetadata';
import { MigrationInterface } from 'typeorm/migration/MigrationInterface';
import { NamingStrategyInterface } from 'typeorm/naming-strategy/NamingStrategyInterface';
import { RelationIdLoader } from 'typeorm/query-builder/RelationIdLoader';
import { RelationLoader } from 'typeorm/query-builder/RelationLoader';
import { MongoRepository } from 'typeorm/repository/MongoRepository';
import { Repository } from 'typeorm/repository/Repository';
import { TreeRepository } from 'typeorm/repository/TreeRepository';
import { EntitySubscriberInterface } from 'typeorm/subscriber/EntitySubscriberInterface';

import { MultitenantRepository } from './multitenant-repository';
import { MultitenantDataSource, MultitenantDataSourceOptions } from './types';

export class _MultitenantDataSource {
  protected readonly defaultDataSourceId: string;
  protected readonly dataSources = new Map<string, DataSource>();
  protected readonly repositories = new Map<
    EntityTarget<any>,
    MultitenantRepository<any>
  >();

  readonly '@instanceof' = Symbol.for('DataSource');
  readonly name = _MultitenantDataSource.name;

  constructor(
    readonly options: MultitenantDataSourceOptions,
    protected readonly dataSourceCtor: typeof DataSource = DataSource,
  ) {
    this.defaultDataSourceId =
      options.type === 'postgres' ? options.schema ?? 'public' : 'default';
    const defaultDataSource = new this.dataSourceCtor(this.options);
    this.dataSources.set(this.defaultDataSourceId, defaultDataSource);
  }

  get isInitialized(): boolean {
    return this.getDataSource().isInitialized;
  }

  get driver(): Driver {
    return this.getDataSource().driver;
  }

  get manager(): EntityManager {
    return this.getDataSource().manager;
  }

  get namingStrategy(): NamingStrategyInterface {
    return this.getDataSource().namingStrategy;
  }

  get metadataTableName(): string {
    return this.getDataSource().metadataTableName;
  }

  get logger(): Logger {
    return this.getDataSource().logger;
  }

  get migrations(): MigrationInterface[] {
    return this.getDataSource().migrations;
  }

  get subscribers(): Array<EntitySubscriberInterface<any>> {
    return this.getDataSource().subscribers;
  }

  get entityMetadatas(): EntityMetadata[] {
    return this.getDataSource().entityMetadatas;
  }

  get entityMetadatasMap(): Map<EntityTarget<any>, EntityMetadata> {
    return this.getDataSource().entityMetadatasMap;
  }

  get queryResultCache(): QueryResultCache | undefined {
    return this.getDataSource().queryResultCache;
  }

  get relationLoader(): RelationLoader {
    return this.getDataSource().relationLoader;
  }

  get relationIdLoader(): RelationIdLoader {
    return this.getDataSource().relationIdLoader;
  }

  get isConnected(): boolean {
    return this.getDataSource().isConnected;
  }

  get mongoManager(): MongoEntityManager {
    return this.getDataSource().mongoManager;
  }

  get sqljsManager(): SqljsEntityManager {
    return this.getDataSource().sqljsManager;
  }

  set driver(driver) {
    this.getDataSource().driver = driver;
  }

  set namingStrategy(namingStrategy) {
    for (const [, dataSource] of this.dataSources) {
      dataSource.namingStrategy = namingStrategy;
    }
  }

  set logger(logger) {
    this.getDataSource().logger = logger;
  }

  set queryResultCache(queryResultCache) {
    this.getDataSource().queryResultCache = queryResultCache;
  }

  setOptions(options: DataSourceOptions): this {
    (this as any).options = options;

    for (const [, dataSource] of this.dataSources) {
      dataSource.setOptions(options);
    }

    return this;
  }

  async initialize(): Promise<this> {
    await Promise.all(
      [...this.dataSources.values()].map((ds) => ds.initialize()),
    );

    return this;
  }

  async connect(): Promise<this> {
    await this.initialize();

    return this;
  }

  async destroy(): Promise<void> {
    await Promise.all([...this.dataSources.values()].map((ds) => ds.destroy()));
  }

  async close(): Promise<void> {
    await this.destroy();
  }

  async synchronize(dropBeforeSync?: boolean): Promise<void> {
    await Promise.all(
      [...this.dataSources.values()].map((ds) =>
        ds.synchronize(dropBeforeSync),
      ),
    );
  }

  async dropDatabase(): Promise<void> {
    await Promise.all(
      [...this.dataSources.values()].map((ds) => ds.dropDatabase()),
    );
  }

  async runMigrations(options?: {
    transaction?: 'all' | 'none' | 'each';
    fake?: boolean;
  }): Promise<Migration[]> {
    const migrations = await Promise.all(
      [...this.dataSources.values()].map((ds) => ds.runMigrations(options)),
    );

    return migrations[0];
  }

  async undoLastMigration(options?: {
    transaction?: 'all' | 'none' | 'each';
    fake?: boolean;
  }): Promise<void> {
    await Promise.all(
      [...this.dataSources.values()].map((ds) => ds.undoLastMigration(options)),
    );
  }

  async showMigrations(): Promise<boolean> {
    const results = await Promise.all(
      [...this.dataSources.values()].map((ds) => ds.showMigrations()),
    );

    return results.every(Boolean);
  }

  hasMetadata(target: EntityTarget<any>): boolean {
    return this.getDataSource().hasMetadata(target);
  }

  getMetadata(target: EntityTarget<any>): EntityMetadata {
    return this.getDataSource().getMetadata(target);
  }

  getRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
  ): Repository<Entity> {
    const foundRepository = this.repositories.get(target);

    if (foundRepository) {
      return foundRepository;
    }

    const newRepository = new MultitenantRepository<any>(target, this);
    this.repositories.set(target, newRepository);
    return newRepository;
  }

  getTreeRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
  ): TreeRepository<Entity> {
    return this.getDataSource().getTreeRepository(target);
  }

  getMongoRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
  ): MongoRepository<Entity> {
    return this.getDataSource().getMongoRepository(target);
  }

  getCustomRepository<T>(customRepository: ObjectType<T>): T {
    return this.getDataSource().getCustomRepository(customRepository);
  }

  async transaction<T>(
    runInTransaction: (entityManager: EntityManager) => Promise<T>,
  ): Promise<T>;
  async transaction<T>(
    isolationLevel: IsolationLevel,
    runInTransaction: (entityManager: EntityManager) => Promise<T>,
  ): Promise<T>;
  async transaction<T>(
    isolationLevelOrRunInTransaction:
      | IsolationLevel
      | ((entityManager: EntityManager) => Promise<T>),
    runInTransaction?: (entityManager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.getDataSource().transaction(
      isolationLevelOrRunInTransaction as any,
      runInTransaction as any,
    );
  }

  async query<T = any>(
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): Promise<T> {
    return await this.getDataSource().query(query, parameters, queryRunner);
  }

  createQueryBuilder<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    alias: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity>;
  createQueryBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any>;
  createQueryBuilder<Entity extends ObjectLiteral>(
    entityClassOrQueryRunner?: EntityTarget<Entity> | QueryRunner,
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity> {
    return this.getDataSource().createQueryBuilder(
      entityClassOrQueryRunner as any,
      alias as any,
      queryRunner,
    );
  }

  createQueryRunner(mode?: ReplicationMode): QueryRunner {
    return this.getDataSource().createQueryRunner(mode);
  }

  getManyToManyMetadata(
    entityTarget: EntityTarget<any>,
    relationPropertyPath: string,
  ): EntityMetadata | undefined {
    return this.getDataSource().getManyToManyMetadata(
      entityTarget,
      relationPropertyPath,
    );
  }

  createEntityManager(queryRunner?: QueryRunner): EntityManager {
    return this.getDataSource().createEntityManager(queryRunner);
  }

  defaultReplicationModeForReads(): ReplicationMode {
    return this.getDataSource().defaultReplicationModeForReads();
  }

  getDefaultTenantId(): string {
    return this.defaultDataSourceId;
  }

  getTenantIds(): string[] {
    return [...this.dataSources.keys()];
  }

  async addTenant(tenantId: string) {
    await this.addTenants([tenantId]);
  }

  async addTenants(tenantIds: string[]) {
    const existingTenants = tenantIds.filter((tenantId) =>
      this.dataSources.has(tenantId),
    );

    if (existingTenants.length > 0) {
      throw new Error(`Tenants ${existingTenants.join(', ')} already exist`);
    }

    await Promise.all(
      tenantIds.map((tenantId) =>
        new this.dataSourceCtor({
          ...this.options,
          ...(this.options.type === 'postgres' ? { schema: tenantId } : {}),
        })
          .initialize()
          .then((ds) => this.dataSources.set(tenantId, ds)),
      ),
    );
  }

  async removeTenant(tenantId: string) {
    await this.removeTenants([tenantId]);
  }

  async removeTenants(tenantIds: string[]) {
    await Promise.all(
      tenantIds.map(async (tenantId) => {
        const tenantDataSource = this.dataSources.get(tenantId);

        if (tenantDataSource) {
          await tenantDataSource.destroy();
          this.dataSources.delete(tenantId);
        }
      }),
    );
  }

  protected getDataSource() {
    if (this.options.type !== 'postgres') {
      const defaultDataSource = this.dataSources.get(this.defaultDataSourceId);
      if (!defaultDataSource) {
        throw new Error('Default data source not found');
      }
      return defaultDataSource;
    }

    const tenantId = this.options.getTenantId();
    if (!tenantId || tenantId === this.options.schema) {
      const defaultDataSource = this.dataSources.get(this.defaultDataSourceId);
      if (!defaultDataSource) {
        throw new Error('Default data source not found');
      }
      return defaultDataSource;
    }

    const dataSource = this.dataSources.get(tenantId);
    if (!dataSource) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return dataSource;
  }
}

export function createMultitenantDataSource(
  options?: MultitenantDataSourceOptions,
): MultitenantDataSource;
export function createMultitenantDataSource(
  dataSourceCtor: typeof DataSource,
  options?: MultitenantDataSourceOptions,
): MultitenantDataSource;
export function createMultitenantDataSource(
  optionsOrCtor?: typeof DataSource | MultitenantDataSourceOptions,
  options?: MultitenantDataSourceOptions,
): MultitenantDataSource {
  if (options) {
    return new _MultitenantDataSource(
      options,
      optionsOrCtor as typeof DataSource,
    ) as unknown as MultitenantDataSource;
  }

  return new _MultitenantDataSource(
    optionsOrCtor as MultitenantDataSourceOptions,
  ) as unknown as MultitenantDataSource;
}
