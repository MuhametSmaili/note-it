import { render, screen } from '@testing-library/react';
import { ActiveTabProvider } from '@app/providers/active-tab.provider';
import { storedRichNote } from '../../../../../../test/fixtures/rich-note';
import NoteContent from '../note-content';

vi.mock('@app/use-notes.hook', () => ({ useNotes: () => ({ state: null, error: null }) }));

it('renders stored rich-text JSON in a read-only preview', async () => {
  const onDelete = vi.fn<(id: string) => void>();

  const { container } = render(
    <ActiveTabProvider>
      <NoteContent note={storedRichNote} onDeleteNoteHandler={onDelete} onError={vi.fn<(error: unknown) => void>()} />
    </ActiveTabProvider>,
  );

  expect(await screen.findByRole('heading', { name: 'Legacy heading', level: 2 })).toBeVisible();
  expect(container.querySelector('[contenteditable]')).toHaveAttribute('contenteditable', 'false');
  expect(container.querySelector('strong em u')).toHaveTextContent('Styled text');
  expect(screen.getByRole('link', { name: 'a link' })).toHaveAttribute('href', 'https://example.com/');
  expect(container.querySelector('ul li')).toHaveTextContent('Bullet item');
  expect(container.querySelector('ol')).toHaveAttribute('start', '3');
  expect(container.querySelector('blockquote')).toHaveTextContent('Quoted text');
  expect(container.querySelector('pre code')).toHaveTextContent('const saved = true;');
  expect(container.querySelector('hr')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Saved image' })).toHaveAttribute(
    'src',
    expect.stringContaining('data:image/png;base64,'),
  );
});
