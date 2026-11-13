import { act, fireEvent, render, screen } from '@testing-library/react';
import { ImageDropzone } from '../ImageDropzone';

function clipboardFiles(files: File[]) {
  return {
    files,
    items: files.map((file) => ({
      kind: 'file',
      type: file.type,
      getAsFile: () => file,
    })),
    types: ['Files'],
  };
}

it.each(['image/png', 'image/jpeg'])('accepts a selected %s image', async (type) => {
  const onDrop = vi.fn<(files: File[]) => void>();
  const file = new File(['image'], type === 'image/png' ? 'note.png' : 'note.jpg', { type });
  render(<ImageDropzone droppedImage={undefined} clearImage={vi.fn<() => void>()} onDrop={onDrop} />);

  await act(async () => {
    fireEvent.change(screen.getByLabelText('Choose an image'), { target: { files: [file] } });
  });

  expect(onDrop).toHaveBeenCalledExactlyOnceWith([file]);
});

it('accepts one dropped image', async () => {
  const onDrop = vi.fn<(files: File[]) => void>();
  const file = new File(['image'], 'note.png', { type: 'image/png' });
  render(<ImageDropzone droppedImage={undefined} clearImage={vi.fn<() => void>()} onDrop={onDrop} />);

  await act(async () => {
    fireEvent.drop(screen.getByRole('group', { name: 'Image upload' }), { dataTransfer: clipboardFiles([file]) });
  });

  expect(onDrop).toHaveBeenCalledExactlyOnceWith([file]);
});

it.each([
  { name: 'an unsupported file', files: [new File(['text'], 'note.txt', { type: 'text/plain' })] },
  {
    name: 'multiple images',
    files: [
      new File(['first'], 'first.png', { type: 'image/png' }),
      new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
    ],
  },
])('rejects $name', async ({ files }) => {
  const onDrop = vi.fn<(files: File[]) => void>();
  render(<ImageDropzone droppedImage={undefined} clearImage={vi.fn<() => void>()} onDrop={onDrop} />);

  await act(async () => {
    fireEvent.drop(screen.getByRole('group', { name: 'Image upload' }), { dataTransfer: clipboardFiles(files) });
  });

  expect(onDrop).not.toHaveBeenCalled();
});

it('leaves clipboard paste to the existing clipboard controls', async () => {
  const onDrop = vi.fn<(files: File[]) => void>();
  const file = new File(['image'], 'note.png', { type: 'image/png' });
  render(<ImageDropzone droppedImage={undefined} clearImage={vi.fn<() => void>()} onDrop={onDrop} />);

  await act(async () => {
    fireEvent.paste(screen.getByRole('group', { name: 'Image upload' }), { clipboardData: clipboardFiles([file]) });
  });

  expect(onDrop).not.toHaveBeenCalled();
});
