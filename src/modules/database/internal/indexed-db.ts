export type DatabaseDefinition = {
  readonly name: string;
  readonly version: number;
  readonly upgrade: (database: IDBDatabase, previousVersion: number, transaction: IDBTransaction) => void;
};

export type Database = {
  /** Resolve after commit, or reject after failure. Await only database requests inside the operation. */
  transaction: <T>(names: string[], operation: (tx: IDBTransaction) => Promise<T>) => Promise<T>;
};

/** Read a native request result. This does not wait for the transaction to commit. */
export const request = <T>(operation: EventTarget & { readonly result: T; readonly error: DOMException | null }) =>
  new Promise<T>((resolve, reject) => {
    operation.addEventListener('success', () => resolve(operation.result), { once: true });
    operation.addEventListener('error', () => reject(operation.error ?? new Error('Cannot access the database.')), {
      once: true,
    });
  });

async function openDatabase(definition: DatabaseDefinition) {
  const opening = indexedDB.open(definition.name, definition.version);
  opening.addEventListener(
    'upgradeneeded',
    (event) => {
      const upgrade = opening.transaction;
      if (!upgrade) throw new Error('The database upgrade transaction is missing.');
      definition.upgrade(opening.result, event.oldVersion, upgrade);
    },
    { once: true },
  );
  return request(opening);
}

async function runOperation<T>(tx: IDBTransaction, operation: (tx: IDBTransaction) => Promise<T>) {
  try {
    return await operation(tx);
  } catch (error) {
    try {
      tx.abort();
    } catch {
      throw error instanceof Error ? error : new Error('Cannot complete the database transaction.');
    }
    throw error;
  }
}

async function transact<T>(
  definition: DatabaseDefinition,
  names: string[],
  operation: (tx: IDBTransaction) => Promise<T>,
) {
  const db = await openDatabase(definition);
  try {
    const tx = db.transaction(names, 'readwrite', { durability: 'strict' });
    const committed = new Promise<void>((resolve, reject) => {
      tx.addEventListener('complete', () => resolve(), { once: true });
      tx.addEventListener('abort', () => reject(tx.error ?? new Error('The database transaction was interrupted.')), {
        once: true,
      });
    });
    const result = runOperation(tx, operation);
    const [value] = await Promise.all([result, committed]);
    return value;
  } finally {
    db.close();
  }
}

/** Create a lazy database handle. Schema upgrades run synchronously in the native upgrade transaction. */
export function createDatabase(definition: DatabaseDefinition): Database {
  return {
    transaction: <T>(names: string[], operation: (tx: IDBTransaction) => Promise<T>) =>
      transact(definition, names, operation),
  };
}
