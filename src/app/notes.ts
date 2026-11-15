import { createNotes } from '@modules/notes';
import { editInBackground } from '@modules/notes/background';
import { createNotesRepository } from '@modules/notes/storage';
import { applicationDatabase, pendingEditsDatabase } from './storage/databases';

const repository = createNotesRepository({ applicationDatabase, pendingEditsDatabase });

export const notes = createNotes(repository.adapter, editInBackground);
