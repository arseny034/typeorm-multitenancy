import { AsyncLocalStorage } from 'node:async_hooks';

export const TENANT_ID_HEADER = 'x-tenant-id';

export const tenantIdStore = new AsyncLocalStorage<string>();

export const TENANT_REPO_TOKEN = 'TENANT_REPO_TOKEN';
export const TENANT_ID_EXTRACTOR_TOKEN = 'TENANT_ID_EXTRACTOR_TOKEN';
