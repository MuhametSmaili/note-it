import { fireEvent, render, screen } from "@testing-library/react";
import type { Note } from "@modules/notes";
import type { notes } from "@app/notes";
import { SingleNoteFooter } from "../note-header";

const setFavorite = vi.hoisted(() => vi.fn<typeof notes.setFavorite>());

vi.mock("@app/notes", () => ({ notes: { setFavorite } }));
vi.mock("@app/use-notes.hook", () => ({ useNotes: () => ({ state: null, error: null }) }));
vi.mock("@icons/star.svg", () => ({ default: () => <svg data-testid="star" /> }));
vi.mock("@icons/star-filled.svg", () => ({ default: () => <svg data-testid="star-filled" /> }));

const note = (isFavorite: boolean): Note => ({
  id: "1",
  revision: 0,
  title: "Note",
  isFavorite,
  noteContent: "",
  createdAt: null,
  updatedAt: null,
});

const renderFooter = (isFavorite: boolean) =>
  render(
    <SingleNoteFooter
      note={note(isFavorite)}
      onDeleteNote={vi.fn<() => void>()}
      onError={vi.fn<(error: unknown) => void>()}
    />,
  );

it.each([
  { isFavorite: true, icon: "star-filled" },
  { isFavorite: false, icon: "star" },
])("shows $icon when isFavorite is $isFavorite", ({ isFavorite, icon }) => {
  renderFooter(isFavorite);

  expect(screen.getByTestId(icon)).toBeInTheDocument();
});

it("unfavorites a favorite note when its star is clicked", () => {
  setFavorite.mockImplementation(() => new Promise(() => {}));
  renderFooter(true);

  fireEvent.click(screen.getByRole("button", { name: "make-note-favorite" }));

  expect(setFavorite).toHaveBeenCalledExactlyOnceWith("1", false);
});
