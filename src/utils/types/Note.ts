import { JSONContent } from '@tiptap/react';

export interface Note {
  id: number;
  title: string;
  isFavorite: boolean;
  noteContent: JSONContent;
}
