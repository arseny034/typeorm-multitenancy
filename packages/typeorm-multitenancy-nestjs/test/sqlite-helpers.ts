import sqlite from 'better-sqlite3';

export const query = async <T = unknown>(
  tenantId: string,
  query: string,
  _arguments: unknown[] = [],
): Promise<T> => {
  const database = sqlite(`.sqlite/${tenantId}.db`, { fileMustExist: true });

  const row = database.prepare(query).get(..._arguments);

  database.close();

  return row as T;
};
