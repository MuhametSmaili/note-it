import { platform } from "@platform/extension";
import { request } from "@modules/database";
import type { Database } from "@modules/database";
import { transactionAdapter } from "./database-storage";
import { draftStorageKey, storageKey } from "./schema";
import { createNotes } from "./store";

export async function initializeDatabase(applicationDatabase: Database) {
  const exists = await applicationDatabase.transaction(["state"], (tx) => request(tx.objectStore("state").count()));
  if (exists !== 0) return;

  const legacy = await platform.storage.read([storageKey, draftStorageKey, "notes", "currentNote"]);
  await applicationDatabase.transaction(["state"], async (tx) => {
    if (await request(tx.objectStore("state").count())) return;

    const adapter = transactionAdapter(tx, () => undefined, legacy);
    const state = await createNotes(adapter).read();
    await adapter.write({ ...state, schemaVersion: 1 });
  });
}
