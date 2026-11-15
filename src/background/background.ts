import "./message-listener";
import "./context-menu";
import "./active-window";
import { registerNotesBackground } from "@modules/notes/background";
import { createNotesRepository } from "@modules/notes/storage";
import { applicationDatabase, pendingEditsDatabase } from "@app/storage/databases";

registerNotesBackground(createNotesRepository({ applicationDatabase, pendingEditsDatabase }));
