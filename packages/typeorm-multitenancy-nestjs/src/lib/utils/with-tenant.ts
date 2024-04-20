import { tenantIdStore } from '../multitenancy.constants';

export const withTenant = <T>(tenantId: string, callback: () => T): T => {
  return tenantIdStore.run(tenantId, callback);
};
