import { createRoot } from 'react-dom/client';

const container = document.createElement('div');
document.body.appendChild(container);

export const rootRender = createRoot(container);
