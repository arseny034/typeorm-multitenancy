export class TenantIdNotProvided extends Error {
  constructor() {
    super('Tenant ID not provided');
  }
}

export class TenantConnectionNotFound extends Error {
  constructor(tenantId?: string) {
    super(
      tenantId
        ? `Connection for tenant "${tenantId}" not found`
        : 'Tenant connection not found',
    );
  }
}
