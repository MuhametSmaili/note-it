import type { Note } from '../../src/utils/types/Note';

const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });

export const richNote = {
  id: 42,
  title: 'Legacy heading',
  isFavorite: true,
  noteContent: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Legacy heading' }] },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Styled text', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] },
          { type: 'text', text: ' and ' },
          {
            type: 'text',
            text: 'a link',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com/',
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                  class: null,
                },
              },
            ],
          },
        ],
      },
      paragraph('Plain text'),
      { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('Bullet item')] }] },
      {
        type: 'orderedList',
        attrs: { start: 3 },
        content: [{ type: 'listItem', content: [paragraph('Ordered item')] }],
      },
      { type: 'blockquote', content: [paragraph('Quoted text')] },
      { type: 'codeBlock', attrs: { language: null }, content: [{ type: 'text', text: 'const saved = true;' }] },
      { type: 'horizontalRule' },
      {
        type: 'image',
        attrs: {
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          alt: 'Saved image',
          title: null,
        },
      },
      paragraph('End of saved note'),
    ],
  },
} satisfies Note;
