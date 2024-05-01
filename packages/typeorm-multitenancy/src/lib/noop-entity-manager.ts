import { EntityManager } from 'typeorm';

import { TenantConnectionNotFound } from './errors';

export const createNoopEntityManager = () =>
  ({
    '@instanceof': Symbol.for('EntityManager'),

    get connection() {
      throw new TenantConnectionNotFound();
    },

    get queryRunner() {
      throw new TenantConnectionNotFound();
    },

    async transaction() {
      throw new TenantConnectionNotFound();
    },

    async query() {
      throw new TenantConnectionNotFound();
    },

    createQueryBuilder() {
      throw new TenantConnectionNotFound();
    },

    hasId() {
      throw new TenantConnectionNotFound();
    },

    getId() {
      throw new TenantConnectionNotFound();
    },

    create() {
      throw new TenantConnectionNotFound();
    },

    merge() {
      throw new TenantConnectionNotFound();
    },

    async preload() {
      throw new TenantConnectionNotFound();
    },

    async save() {
      throw new TenantConnectionNotFound();
    },

    async remove() {
      throw new TenantConnectionNotFound();
    },

    async softRemove() {
      throw new TenantConnectionNotFound();
    },

    async recover() {
      throw new TenantConnectionNotFound();
    },

    async insert() {
      throw new TenantConnectionNotFound();
    },

    async upsert() {
      throw new TenantConnectionNotFound();
    },

    async update() {
      throw new TenantConnectionNotFound();
    },

    async delete() {
      throw new TenantConnectionNotFound();
    },

    async softDelete() {
      throw new TenantConnectionNotFound();
    },

    async restore() {
      throw new TenantConnectionNotFound();
    },

    async exists() {
      throw new TenantConnectionNotFound();
    },

    async existsBy() {
      throw new TenantConnectionNotFound();
    },

    async count() {
      throw new TenantConnectionNotFound();
    },

    async countBy() {
      throw new TenantConnectionNotFound();
    },

    async sum() {
      throw new TenantConnectionNotFound();
    },

    async average() {
      throw new TenantConnectionNotFound();
    },

    async minimum() {
      throw new TenantConnectionNotFound();
    },

    async maximum() {
      throw new TenantConnectionNotFound();
    },

    async find() {
      throw new TenantConnectionNotFound();
    },

    async findBy() {
      throw new TenantConnectionNotFound();
    },

    async findAndCount() {
      throw new TenantConnectionNotFound();
    },

    async findAndCountBy() {
      throw new TenantConnectionNotFound();
    },

    async findByIds() {
      throw new TenantConnectionNotFound();
    },

    async findOne() {
      throw new TenantConnectionNotFound();
    },

    async findOneBy() {
      throw new TenantConnectionNotFound();
    },

    async findOneById() {
      throw new TenantConnectionNotFound();
    },

    async findOneOrFail() {
      throw new TenantConnectionNotFound();
    },

    async findOneByOrFail() {
      throw new TenantConnectionNotFound();
    },

    async clear() {
      throw new TenantConnectionNotFound();
    },

    async increment() {
      throw new TenantConnectionNotFound();
    },

    async decrement() {
      throw new TenantConnectionNotFound();
    },

    getRepository() {
      throw new TenantConnectionNotFound();
    },

    getTreeRepository() {
      throw new TenantConnectionNotFound();
    },

    getMongoRepository() {
      throw new TenantConnectionNotFound();
    },

    withRepository() {
      throw new TenantConnectionNotFound();
    },

    getCustomRepository() {
      throw new TenantConnectionNotFound();
    },

    async release() {
      throw new TenantConnectionNotFound();
    },
  }) as unknown as EntityManager;
