import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntityMetadataNotFoundError,
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

import { TenantConnectionNotFound, TenantIdNotProvided } from './errors';
import { MultitenantRepository } from './multitenant-repository';
import { createNoopEntityManager } from './noop-entity-manager';
import {
  MultitenantDataSourceConstructor,
  MultitenantDataSourceOptions,
  SpecificDataSourceOptions,
} from './types';

export class _MultitenantDataSource<T extends DataSourceOptions['type']> {
  protected readonly tenantDataSources = new Map<string, DataSource>();
  protected readonly repositories = new Map<
    EntityTarget<any>,
    MultitenantRepository<any>
  >();
  protected readonly getTenantId: MultitenantDataSourceOptions<T>['getTenantId'];
  protected readonly getTenantDataSourceConfig:
    | MultitenantDataSourceOptions<T>['getTenantDataSourceConfig']
    | undefined;
  protected readonly dataSourceFactory:
    | MultitenantDataSourceOptions<T>['dataSourceFactory']
    | undefined;

  protected _entityMetadatas: EntityMetadata[] = [];
  protected _entityMetadatasMap = new Map<EntityTarget<any>, EntityMetadata>();

  readonly '@instanceof' = Symbol.for('DataSource');
  readonly name = _MultitenantDataSource.name;
  readonly options: SpecificDataSourceOptions<T>;

  constructor(options: MultitenantDataSourceOptions<T>) {
    const {
      getTenantId,
      getTenantDataSourceConfig,
      dataSourceFactory,
      ...sharedOptions
    } = options;

    this.getTenantId = getTenantId;
    this.getTenantDataSourceConfig = getTenantDataSourceConfig;
    this.dataSourceFactory = dataSourceFactory;
    this.options = sharedOptions;
  }

  get isInitialized(): boolean {
    return [...this.tenantDataSources.values()].every((ds) => ds.isInitialized);
  }

  get driver(): Driver {
    return this.getDataSource().driver;
  }

  get manager(): EntityManager {
    return this.tryGetDataSource()?.manager ?? createNoopEntityManager();
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
    return this._entityMetadatas;
  }

  get entityMetadatasMap(): Map<EntityTarget<any>, EntityMetadata> {
    return this._entityMetadatasMap;
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
    for (const [, dataSource] of this.tenantDataSources) {
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

    for (const [, dataSource] of this.tenantDataSources) {
      dataSource.setOptions(options);
    }

    return this;
  }

  async initialize(): Promise<this> {
    const [tenantDataSource] = await Promise.all(
      [...this.tenantDataSources.values()].map((ds) => ds.initialize()),
    );

    if (tenantDataSource) {
      this._entityMetadatas = tenantDataSource.entityMetadatas;
      this._entityMetadatasMap = tenantDataSource.entityMetadatasMap;
    } else {
      const temporaryDataSource = new DataSource(this.options);
      await (temporaryDataSource as any).buildMetadatas();

      this._entityMetadatas = temporaryDataSource.entityMetadatas;
      this._entityMetadatasMap = temporaryDataSource.entityMetadatasMap;
    }

    return this;
  }

  async connect(): Promise<this> {
    await this.initialize();

    return this;
  }

  async destroy(): Promise<void> {
    await Promise.all(
      [...this.tenantDataSources.values()].map((ds) => ds.destroy()),
    );
  }

  async close(): Promise<void> {
    await this.destroy();
  }

  async synchronize(dropBeforeSync?: boolean): Promise<void> {
    await Promise.all(
      [...this.tenantDataSources.values()].map((ds) =>
        ds.synchronize(dropBeforeSync),
      ),
    );
  }

  async dropDatabase(): Promise<void> {
    await Promise.all(
      [...this.tenantDataSources.values()].map((ds) => ds.dropDatabase()),
    );
  }

  async runMigrations(options?: {
    transaction?: 'all' | 'none' | 'each';
    fake?: boolean;
  }): Promise<Migration[]> {
    const migrations = await Promise.all(
      [...this.tenantDataSources.values()].map((ds) =>
        ds.runMigrations(options),
      ),
    );

    return migrations[0];
  }

  async undoLastMigration(options?: {
    transaction?: 'all' | 'none' | 'each';
    fake?: boolean;
  }): Promise<void> {
    await Promise.all(
      [...this.tenantDataSources.values()].map((ds) =>
        ds.undoLastMigration(options),
      ),
    );
  }

  async showMigrations(): Promise<boolean> {
    const results = await Promise.all(
      [...this.tenantDataSources.values()].map((ds) => ds.showMigrations()),
    );

    return results.every(Boolean);
  }

  hasMetadata(target: EntityTarget<any>): boolean {
    return this.getDataSource().hasMetadata(target);
  }

  getMetadata(target: EntityTarget<any>): EntityMetadata {
    const metadata = this._entityMetadatasMap.get(target);

    if (!metadata) {
      throw new EntityMetadataNotFoundError(target);
    }

    return metadata;
  }

  getRepository<Entity extends ObjectLiteral>(
    target: EntityTarget<Entity>,
  ): Repository<Entity> {
    const foundRepository = this.repositories.get(target);

    if (foundRepository) {
      return foundRepository;
    }

    const newRepository = new MultitenantRepository<any>(
      target,
      this as unknown as DataSource,
    );
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

  async getTenants(): Promise<string[]> {
    return [...this.tenantDataSources.keys()];
  }

  async setTenants(tenantIds: string[]) {
    const existingTenants = new Set(this.tenantDataSources.keys());
    const desiredTenants = new Set(tenantIds);

    const tenantsToAdd = [...desiredTenants.values()].filter(
      (tenantId) => !existingTenants.has(tenantId),
    );
    const tenantsToRemove = [...existingTenants.values()].filter(
      (tenantId) => !desiredTenants.has(tenantId),
    );

    await Promise.all([
      this.addTenants(tenantsToAdd),
      this.removeTenants(tenantsToRemove),
    ]);
  }

  async addTenant(tenantId: string) {
    await this.addTenants([tenantId]);
  }

  async addTenants(tenantIds: string[]) {
    const existingTenants = tenantIds.filter((tenantId) =>
      this.tenantDataSources.has(tenantId),
    );

    if (existingTenants.length > 0) {
      throw new Error(`Tenants ${existingTenants.join(', ')} already exist`);
    }

    await Promise.all(
      tenantIds.map(async (tenantId) => {
        const options = this.getTenantDataSourceConfig
          ? this.getTenantDataSourceConfig(tenantId, this.options)
          : this.options;

        const dataSource = this.dataSourceFactory
          ? await this.dataSourceFactory(options)
          : await new DataSource(options).initialize();

        this.tenantDataSources.set(tenantId, dataSource);
      }),
    );
  }

  async removeTenant(tenantId: string) {
    await this.removeTenants([tenantId]);
  }

  async removeTenants(tenantIds: string[]) {
    await Promise.all(
      tenantIds.map(async (tenantId) => {
        const tenantDataSource = this.tenantDataSources.get(tenantId);

        if (tenantDataSource) {
          await tenantDataSource.destroy();
          this.tenantDataSources.delete(tenantId);
        }
      }),
    );
  }

  protected getDataSource() {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      throw new TenantIdNotProvided();
    }

    const tenantDataSource = this.tenantDataSources.get(tenantId);

    if (!tenantDataSource) {
      throw new TenantConnectionNotFound(tenantId);
    }

    return tenantDataSource;
  }

  protected tryGetDataSource() {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      return null;
    }

    return this.tenantDataSources.get(tenantId) ?? null;
  }
}

export const MultitenantDataSource =
  _MultitenantDataSource as unknown as MultitenantDataSourceConstructor;
