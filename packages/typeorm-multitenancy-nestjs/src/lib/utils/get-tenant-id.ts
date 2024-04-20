import { tenantIdStore } from '../multitenancy.constants';

export const getTenantId = () => {
  return tenantIdStore.getStore() ?? null;
};
