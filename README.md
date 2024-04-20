# typeorm-multitenancy

TypeORM extension for multitenant database connections.

⚠️ Only schema-based multitenancy for PostgreSQL is supported at the moment ⚠️

## Install

```shell
npm install typeorm-multitenancy
```
or
```shell
yarn add typeorm-multitenancy
```

## Usage

The extension chooses a database schema based on the tenant id,
which means that each tenant should have its own schema, and the schema name
should be the same as the tenant id.

Instead of a regular DataSource constructor, use `createMultitenantDataSource` 
to create a multitenant data source.
Besides the regular options, pass `getTenantId` function that will be called
to determine the tenant id for each request.
```typescript
let tenant = 'tenant1';

const options = {
  // ...
  getTenantId: () => tenant,
};

const dataSource = await createMultitenantDataSource(options).initialize();
```

Tenants can be added or removed at runtime by calling corresponding data source methods:
```typescript
dataSource.addTenant('tenant2');
dataSource.addTenants(['tenant3', 'tenant4']);

dataSource.removeTenant('tenant2');
dataSource.removeTenants(['tenant3', 'tenant4']);
```

## Integration with NestJS

There is a separate package for NestJS integration. 
A tenant id is supposed to be passed in `x-tenant-id` HTTP header. 

### Install
```shell
npm install typeorm-multitenancy typeorm-multitenancy-nestjs
```

### Usage

Use multitenant data source factory when importing a TypeORM module:
```typescript
TypeOrmModule.forRootAsync({
  dataSourceFactory: (options) =>
    createNestjsMultitenantDatasource(options).initialize(),
})
```

Then add the following import to your AppModule or another module:
```typescript
MultitenancyModule.forRoot({
  entity: Tenant,
  extractTenantId: (tenant) => tenant.name,
})
```
Specify a tenant entity and a function to extract tenant id from the tenant entity.
There's no need to additionally provide the tenant entity to `TypeOrmModule.forFeature`.

You also need to register MultitenancyMiddleware in your AppModule
in order to set up a tenant context properly:
```typescript
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MultitenancyMiddleware).forRoutes('*');
  }
}
```

After that you can inject `MultitenancyService` into your services and controllers:
```typescript
@Injectable()
export class MyService {
  constructor(private multitenancyService: MultitenancyService) {}

  async rescanTenants() {
    return this.multitenancyService.rescan();
  }
}
```

You can optionally apply MultitenancyGuard to your routes to ensure that a tenant id is provided.

## Limitations
- Only schema-based multitenancy for PostgreSQL is supported at the moment.
- The extension does not support different database users for different tenants.
- If you use the NestJS integration, the only way to pass a tenant id is through the `x-tenant-id` HTTP header.

## License
typeorm-multitenancy is MIT licensed.
