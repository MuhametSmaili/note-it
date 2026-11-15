export function createNotesStores(database: IDBDatabase) {
  database.createObjectStore("state");
  database.createObjectStore("editors");
  database.createObjectStore("replies");
}

export function createPendingEditsStore(database: IDBDatabase) {
  const pending = database.createObjectStore("pending", { keyPath: "sequence", autoIncrement: true });
  pending.createIndex("session", "session");
}
