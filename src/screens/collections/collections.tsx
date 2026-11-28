import { Button } from "@components";
import { notes as noteStore } from "@app/notes";
import { useNotes } from "@app/use-notes.hook";
import StarIcon from "@icons/star.svg";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useTab } from "@app/providers/active-tab.provider";
import NoteContent from "./components/note/note-content";
import { SearchNotes } from "./components/search-notes";
import type { Filter } from "./utils/filter-notes";
import { getFilteredNotes } from "./utils/filter-notes";

const Collections = () => {
  const [filter, setFilter] = useState<Filter>({ showFavorites: false });
  const { state, error: loadError } = useNotes();
  const notes = state?.notes;
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useTab();

  const visibleNotes = useMemo(() => getFilteredNotes(filter, notes), [notes, filter]);

  const reportError = (failure: unknown) => {
    setError(failure instanceof Error ? failure.message : "Cannot change this note.");
  };

  const onDeleteNoteHandler = (id: string) => {
    const note = notes?.find((item) => item.id === id);
    if (!note) return;
    setError(null);
    noteStore.deleteNote(id, note.revision).catch(reportError);
  };

  const onSearchHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setFilter((previous) => ({ ...previous, title: e.target.value }));
  };

  const createNewNoteHandler = () => {
    if (!state) return;
    setError(null);
    noteStore
      .startDraft(state.draft)
      .then(() => dispatch({ type: "TAB_HANDLER", payload: 0 }))
      .catch(reportError);
  };

  return (
    <>
      {error || loadError ? <div role="alert">{error ?? loadError?.message}</div> : null}
      <div className="m-2 flex flex-wrap items-center gap-y-2 border-b border-b-primary pb-1">
        <SearchNotes onSearchHandler={onSearchHandler} value={filter.title ?? ""} />
        <Button
          className="mx-2 text-primary"
          variant="primary"
          active={filter.showFavorites}
          title="Favorites"
          icon={<StarIcon fill={filter.showFavorites ? "currentcolor" : "transparent"} />}
          onClick={() => setFilter((old) => ({ showFavorites: !old.showFavorites }))}
        />
        <Button
          className="mx-2 text-light"
          variant="primary"
          active={filter.showFavorites}
          title="New note"
          onClick={createNewNoteHandler}
        />
      </div>
      <div className="flex flex-wrap">
        {visibleNotes &&
          visibleNotes?.map((note) => (
            <NoteContent
              onDeleteNoteHandler={onDeleteNoteHandler}
              onError={reportError}
              note={note}
              key={`${note.id}:${note.revision}`}
            />
          ))}
      </div>
    </>
  );
};

export default Collections;
