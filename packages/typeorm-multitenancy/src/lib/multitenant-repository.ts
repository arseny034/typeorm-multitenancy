import {
  DeepPartial,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  ObjectLiteral,
  QueryRunner,
  RemoveOptions,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { EntityMetadata } from 'typeorm/metadata/EntityMetadata';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { InsertResult } from 'typeorm/query-builder/result/InsertResult';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';

import { _MultitenantDataSource } from './multitenant-datasource';

export class MultitenantRepository<Entity extends ObjectLiteral>
  implements Repository<Entity>
{
  constructor(
    readonly target: EntityTarget<Entity>,
    protected readonly dataSource: _MultitenantDataSource,
    readonly queryRunner?: QueryRunner,
  ) {}

  get manager(): EntityManager {
    return this.dataSource.manager;
  }

  get metadata(): EntityMetadata {
    return this.dataSource.getMetadata(this.target);
  }

  createQueryBuilder(
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity> {
    return this.dataSource.manager.createQueryBuilder<Entity>(
      this.metadata.target,
      alias ?? this.metadata.targetName,
      queryRunner ?? this.queryRunner,
    );
  }

  hasId(entity: Entity): boolean {
    return this.manager.hasId(this.metadata.target, entity);
  }

  getId(entity: Entity): any {
    return this.manager.getId(this.metadata.target, entity);
  }

  create(): Entity;
  create(entityLikeArray: Array<DeepPartial<Entity>>): Entity[];
  create(entityLike: DeepPartial<Entity>): Entity;
  create(
    entityLikeOrArray?: DeepPartial<Entity> | Array<DeepPartial<Entity>>,
  ): Entity | Entity[] {
    return this.manager.create(this.metadata.target, entityLikeOrArray);
  }

  merge(
    mergeIntoEntity: Entity,
    ...entityLikes: Array<DeepPartial<Entity>>
  ): Entity {
    return this.manager.merge(
      this.metadata.target,
      mergeIntoEntity,
      ...entityLikes,
    );
  }

  preload(entityLike: DeepPartial<Entity>): Promise<Entity | undefined> {
    return this.manager.preload(this.metadata.target, entityLike);
  }

  save<T extends DeepPartial<Entity>>(
    entities: T[],
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T[]>;
  save<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<Array<T & Entity>>;
  save<T extends DeepPartial<Entity>>(
    entity: T,
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T>;
  save<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity>;
  save<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?:
      | SaveOptions
      | {
          reload: false;
        },
  ) {
    return this.manager.save(this.metadata.target, entityOrEntities, options);
  }

  remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
  remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;
  remove(entityOrEntities: Entity | Entity[], options?: RemoveOptions) {
    return this.manager.remove(this.metadata.target, entityOrEntities, options);
  }

  softRemove<T extends DeepPartial<Entity>>(
    entities: T[],
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T[]>;
  softRemove<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<Array<T & Entity>>;
  softRemove<T extends DeepPartial<Entity>>(
    entity: T,
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T>;
  softRemove<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity>;
  softRemove<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?:
      | SaveOptions
      | {
          reload: false;
        },
  ) {
    return this.manager.softRemove(
      this.metadata.target,
      entityOrEntities,
      options,
    );
  }

  recover<T extends DeepPartial<Entity>>(
    entities: T[],
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T[]>;
  recover<T extends DeepPartial<Entity>>(
    entities: T[],
    options?: SaveOptions,
  ): Promise<Array<T & Entity>>;
  recover<T extends DeepPartial<Entity>>(
    entity: T,
    options: SaveOptions & {
      reload: false;
    },
  ): Promise<T>;
  recover<T extends DeepPartial<Entity>>(
    entity: T,
    options?: SaveOptions,
  ): Promise<T & Entity>;
  recover<T extends DeepPartial<Entity>>(
    entityOrEntities: T | T[],
    options?: SaveOptions | { reload: false },
  ) {
    return this.manager.recover(
      this.metadata.target,
      entityOrEntities,
      options,
    );
  }

  insert(
    entity:
      | QueryDeepPartialEntity<Entity>
      | Array<QueryDeepPartialEntity<Entity>>,
  ): Promise<InsertResult> {
    return this.manager.insert(this.metadata.target, entity);
  }

  update(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
    partialEntity: QueryDeepPartialEntity<Entity>,
  ): Promise<UpdateResult> {
    return this.manager.update(this.metadata.target, criteria, partialEntity);
  }

  upsert(
    entityOrEntities:
      | QueryDeepPartialEntity<Entity>
      | Array<QueryDeepPartialEntity<Entity>>,
    conflictPathsOrOptions: string[] | UpsertOptions<Entity>,
  ): Promise<InsertResult> {
    return this.manager.upsert(
      this.metadata.target,
      entityOrEntities,
      conflictPathsOrOptions,
    );
  }

  delete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<DeleteResult> {
    return this.manager.delete(this.metadata.target, criteria);
  }

  softDelete(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<UpdateResult> {
    return this.manager.softDelete(this.metadata.target, criteria);
  }

  restore(
    criteria:
      | string
      | string[]
      | number
      | number[]
      | Date
      | Date[]
      | ObjectId
      | ObjectId[]
      | FindOptionsWhere<Entity>,
  ): Promise<UpdateResult> {
    return this.manager.restore(this.metadata.target, criteria);
  }

  exist(options?: FindManyOptions<Entity>): Promise<boolean> {
    return this.manager.exists(this.metadata.target, options);
  }

  exists(options?: FindManyOptions<Entity>): Promise<boolean> {
    return this.manager.exists(this.metadata.target, options);
  }

  existsBy(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<boolean> {
    return this.manager.existsBy(this.metadata.target, where);
  }

  count(options?: FindManyOptions<Entity>): Promise<number> {
    return this.manager.count(this.metadata.target, options);
  }

  countBy(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<number> {
    return this.manager.countBy(this.metadata.target, where);
  }

  sum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<number | null> {
    return this.manager.sum(this.metadata.target, columnName, where);
  }

  average(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<number | null> {
    return this.manager.average(this.metadata.target, columnName, where);
  }

  minimum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<number | null> {
    return this.manager.minimum(this.metadata.target, columnName, where);
  }

  maximum(
    columnName: PickKeysByType<Entity, number>,
    where?: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<number | null> {
    return this.manager.maximum(this.metadata.target, columnName, where);
  }

  find(options?: FindManyOptions<Entity>): Promise<Entity[]> {
    return this.manager.find(this.metadata.target, options);
  }

  findBy(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<Entity[]> {
    return this.manager.findBy(this.metadata.target, where);
  }

  findAndCount(options?: FindManyOptions<Entity>): Promise<[Entity[], number]> {
    return this.manager.findAndCount(this.metadata.target, options);
  }

  findAndCountBy(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<[Entity[], number]> {
    return this.manager.findAndCountBy(this.metadata.target, where);
  }

  findByIds(ids: any[]): Promise<Entity[]> {
    return this.manager.findByIds(this.metadata.target, ids);
  }

  findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return this.manager.findOne(this.metadata.target, options);
  }

  findOneBy(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<Entity | null> {
    return this.manager.findOneBy(this.metadata.target, where);
  }

  findOneById(id: number | string | Date | ObjectId): Promise<Entity | null> {
    return this.manager.findOneById(this.metadata.target, id);
  }

  findOneOrFail(options: FindOneOptions<Entity>): Promise<Entity> {
    return this.manager.findOneOrFail(this.metadata.target, options);
  }

  findOneByOrFail(
    where: FindOptionsWhere<Entity> | Array<FindOptionsWhere<Entity>>,
  ): Promise<Entity> {
    return this.manager.findOneByOrFail(this.metadata.target, where);
  }

  query(query: string, parameters?: any[]): Promise<any> {
    return this.manager.query(query, parameters);
  }

  clear(): Promise<void> {
    return this.manager.clear(this.metadata.target);
  }

  increment(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    return this.manager.increment(
      this.metadata.target,
      conditions,
      propertyPath,
      value,
    );
  }

  decrement(
    conditions: FindOptionsWhere<Entity>,
    propertyPath: string,
    value: number | string,
  ): Promise<UpdateResult> {
    return this.manager.decrement(
      this.metadata.target,
      conditions,
      propertyPath,
      value,
    );
  }

  extend<CustomRepository>(
    _: CustomRepository & ThisType<this & CustomRepository>,
  ): this & CustomRepository {
    throw new Error('not implemented');
  }
}
