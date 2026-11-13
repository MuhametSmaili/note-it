import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

it('shows a drop target while an image is dragged over it', async () => {
  const file = new File(['image'], 'note.png', { type: 'image/png' });
  render(
    <ImageDropzone
      droppedImage={undefined}
      clearImage={vi.fn<() => void>()}
      onDrop={vi.fn<(files: File[]) => void>()}
    />,
  );

  await act(async () => {
    fireEvent.dragEnter(screen.getByRole('group', { name: 'Image upload' }), { dataTransfer: clipboardFiles([file]) });
  });

  expect(screen.getByText('Drop here...')).toBeVisible();
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

it('restricts the native picker to one PNG or JPEG', () => {
  const onDrop = vi.fn<(files: File[]) => void>();

  render(<ImageDropzone droppedImage={undefined} clearImage={vi.fn<() => void>()} onDrop={onDrop} />);

  const input = screen.getByLabelText('Choose an image');
  expect(input).toHaveAttribute('accept', 'image/png,image/jpeg');
  expect(input).not.toHaveAttribute('multiple');
});

it('shows the selected image preview', () => {
  const image = new Blob(['image'], { type: 'image/png' });
  const createUrl = vi.fn<() => string>().mockReturnValue('blob:preview');
  vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: vi.fn<(url: string) => void>() });
  try {
    render(
      <ImageDropzone droppedImage={image} clearImage={vi.fn<() => void>()} onDrop={vi.fn<(files: File[]) => void>()} />,
    );

    expect(screen.getByRole('img', { name: 'Uploaded document' })).toHaveAttribute('src', 'blob:preview');
    expect(createUrl).toHaveBeenCalledWith(image);
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});

it('releases preview URLs when replacing the image and unmounting', () => {
  const createUrl = vi
    .fn<(blob: Blob) => string>()
    .mockReturnValueOnce('blob:first')
    .mockReturnValueOnce('blob:second');
  const revokeUrl = vi.fn<(url: string) => void>();
  vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
  const clearImage = vi.fn<() => void>();
  const onDrop = vi.fn<(files: File[]) => void>();
  try {
    const { rerender, unmount } = render(
      <ImageDropzone droppedImage={new Blob()} clearImage={clearImage} onDrop={onDrop} />,
    );

    rerender(<ImageDropzone droppedImage={new Blob()} clearImage={clearImage} onDrop={onDrop} />);
    unmount();

    expect(revokeUrl.mock.calls).toEqual([['blob:first'], ['blob:second']]);
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});

it('requests removal of the selected image', () => {
  const clearImage = vi.fn<() => void>();
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:preview', revokeObjectURL: vi.fn<(url: string) => void>() });
  try {
    render(
      <ImageDropzone droppedImage={new Blob()} clearImage={clearImage} onDrop={vi.fn<(files: File[]) => void>()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove uploaded image' }));

    expect(clearImage).toHaveBeenCalledOnce();
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});

it('accepts the same file after its preview is cleared', async () => {
  const file = new File(['image'], 'note.png', { type: 'image/png' });
  const onDrop = vi.fn<(files: File[]) => void>();
  const clearImage = vi.fn<() => void>();
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:preview', revokeObjectURL: vi.fn<(url: string) => void>() });
  try {
    const { rerender } = render(<ImageDropzone droppedImage={file} clearImage={clearImage} onDrop={onDrop} />);
    rerender(<ImageDropzone droppedImage={undefined} clearImage={clearImage} onDrop={onDrop} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Choose an image'), { target: { files: [file] } });
    });

    expect(onDrop).toHaveBeenCalledExactlyOnceWith([file]);
  } finally {
    cleanup();
    vi.unstubAllGlobals();
  }
});
